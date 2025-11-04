import '@tensorflow/tfjs'
import encoder from '@tensorflow-models/universal-sentence-encoder'
import { Post } from '../modules/posts/model.js'
import { Category } from '../modules/categories/model.js'

class VectorsManager {
  model: encoder.UniversalSentenceEncoder | null = null

  init = async () => {
    const model = await encoder.load()
    this.model = model
  }

  createVectorFromString = async (text: string) => {
    if (!this.model) {
      throw new Error('Model not initialized')
    }

    const embeddings = await this.model.embed([text])
    return embeddings.arraySync()[0]
  }

  createPostVector = async (post: Partial<Post>, category: Category, subCategory: Category) => {
    const titleVector = await this.createVectorFromString(post.title)
    const descriptionVector = await this.createVectorFromString(post.description ?? '')
    const categoryVector = await this.createVectorFromString(
      category.name?.['en'] ? category.name['en'] : Object.values(category.name)[0]
    )
    const subCategoryVector = await this.createVectorFromString(
      subCategory.name?.['en'] ? subCategory.name['en'] : Object.values(subCategory.name)[0]
    )
    const locationVector = await this.createVectorFromString(post.locationPretty)

    return {
      titleVector,
      descriptionVector,
      categoryVector,
      subCategoryVector,
      locationVector,
    }
  }

  computeAccountVector = (
    favouritePostsVectors: number[][],
    preferredCategoriesVectors: number[][]
  ) => {
    const allVectors = [...favouritePostsVectors, ...preferredCategoriesVectors]

    if (allVectors.length === 0) {
      return []
    }

    // Determine the maximum length of vectors
    const maxVectorLength = allVectors.reduce((max, vector) => Math.max(max, vector.length), 0)

    // Pad or truncate all vectors to the maximum length
    const paddedVectors = allVectors.map((vector) =>
      this.padOrTruncateVector(vector, maxVectorLength)
    )

    // Initialize an array to hold the sum of all vectors
    let combinedVector = new Array(maxVectorLength).fill(0)

    // Sum up all the vectors
    paddedVectors.forEach((vector) => {
      combinedVector = combinedVector.map((value, index) => value + vector[index])
    })

    // Calculate the average
    combinedVector = combinedVector.map((value) => value / paddedVectors.length)

    // Normalize the vector
    const length = Math.sqrt(combinedVector.reduce((sum, value) => sum + value * value, 0))
    combinedVector = combinedVector.map((value) => value / length)

    return combinedVector
  }

  private padOrTruncateVector = (vector: unknown[], length: number) => {
    if (vector.length === length) {
      return vector
    } else if (vector.length < length) {
      return [...vector, ...new Array(length - vector.length).fill(0)]
    } else {
      return vector.slice(0, length)
    }
  }
}

const vectorsManager = new VectorsManager()
export { vectorsManager as VectorsManager }
