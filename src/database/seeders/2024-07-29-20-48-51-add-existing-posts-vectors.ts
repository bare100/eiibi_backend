import sequelize from 'sequelize'
import { Post } from '../../modules/posts/model.js'
import { VectorsManager } from '../../lib/vectors-manager.js'
import { Category } from '../../modules/categories/model.js'

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    const allCategories = await Category.findAll({ transaction })
    const posts = await Post.findAll({ transaction })

    for (const post of posts) {
      const category = allCategories.find((category) => category.id === post.mainCategoryId)
      const subCategory = allCategories.find((category) => category.id === post.subCategoryId)

      const vectors = await VectorsManager.createPostVector(post, category, subCategory)

      await Post.update({ vectors }, { where: { id: post.id }, transaction })
    }
    await transaction.commit()
  } catch (error) {
    console.error(error)
    await transaction.rollback()
    throw error
  }
}

export async function down({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
