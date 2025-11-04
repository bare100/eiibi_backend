import { Op, Transaction } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { DatabaseConnection } from '../../database/index.js'
import { GenericRepository } from '../../lib/base-repository.js'
import { PaginatedQueryParams } from '../../types.js'
import { Account } from '../accounts/model.js'
import { Post } from '../posts/model.js'
import { CategoriesRepository } from '../categories/repository.js'
import { FavouritesRepository } from '../favourites/repository.js'
import { PostSimilarity } from './model.js'
import { PostsRepository } from '../posts/repository.js'

const MIN_SIMILARITY = 0.25

const SIMILARITY_WEIGHTS = {
  titleWeight: 0.4,
  descriptionWeight: 0.3,
  categoryWeight: 0.1,
  subCategoryWeight: 0.1,
  locationWeight: 0.1,
}

class PostSimilarityRepository extends GenericRepository<PostSimilarity> {
  constructor() {
    super(PostSimilarity)
  }

  public async getSimilarPosts(postId: string, params?: PaginatedQueryParams) {
    const { page = 0, perPage = 20 } = params || {}

    const similaritiesQuery = `
      SELECT
        "a"."id" AS "postId",
        "s"."similarity"
      FROM
        ${DATABASE_MODELS.POSTS} "a"
      JOIN
        (
          SELECT
            CASE
                WHEN "postId1" = :postId THEN "postId2"
                ELSE "postId1"
            END AS "relatedPostId",
            "similarity"
          FROM
            ${DATABASE_MODELS.POST_SIMILARITIES}
          WHERE
            ("postId1" = :postId OR "postId2" = :postId)
            AND "similarity" >= ${MIN_SIMILARITY}
        ) "s" ON "a"."id" = "s"."relatedPostId"
      WHERE
        "a"."expiresAt" > NOW()
        AND "a"."id" != :postId
      ORDER BY
        "s"."similarity" DESC
      LIMIT :limit OFFSET :offset;
    `

    const similarities = await DatabaseConnection.getInstance().query(similaritiesQuery, {
      replacements: { postId, limit: perPage, offset: page * perPage },
    })

    const postIds: string[] = similarities[0].map((similarity) => similarity.postId)

    const uniquePostIds = Array.from(new Set(postIds)).filter((el) => el !== postId)
    return PostsRepository.findByIds(uniquePostIds)
  }

  public async getRecommendations(account: Account, params?: PaginatedQueryParams) {
    const { page = 0, perPage = 20 } = params || {}
    const [favouritePosts, categoriesVectors] = await Promise.all([
      FavouritesRepository.getFavouritePosts(account.id),
      CategoriesRepository.getVectorsForCategories(account.preferredCategoriesIds),
    ])

    const favouritePostIds = favouritePosts.map((favourite) => favourite.post.id)
    const favouritesVectors = favouritePosts.map((favourite) => favourite.post.vectors)

    if (!favouritesVectors.length && !categoriesVectors.length) {
      return []
    }

    const isFavouritePostIdsEmpty = favouritePostIds.length === 0
    const query = `
      WITH similarity_scores AS (
        SELECT
          s."postId2" AS id,
          COALESCE(AVG(s.similarity), 0) AS aggregated_similarity
        FROM
          ${DATABASE_MODELS.POSTS} a
        LEFT JOIN
          post_similarities s ON s."postId2" = a.id 
          AND ${isFavouritePostIdsEmpty ? '1=1' : 's."postId1" = ANY(:favouritePostIds)'}
        WHERE a."accountId" != :userAccountId
          AND a."expiresAt" >= NOW()
         ${
           isFavouritePostIdsEmpty && account.preferredCategoriesIds.length
             ? 'AND a."mainCategoryId" = ANY(:preferredCategoryIds)'
             : ''
         } 
        GROUP BY
          s."postId2"
      ),
      preferred_category_scores AS (
        SELECT
          a.id,
          (
            (
              SELECT COALESCE(SUM(uv * av), 0)
              FROM UNNEST(array[:preferredCategoryVectors]::float8[], 
                (SELECT array_agg((value->>0)::float8) 
                  FROM jsonb_array_elements(a.vectors->'categoryVector') AS value)) AS t(uv, av)
            ) * :categoryWeight
          ) AS category_similarity
        FROM
          ${DATABASE_MODELS.POSTS} a
        WHERE
          a."accountId" != :userAccountId
      ),
      combined_scores AS (
        SELECT
          ss.id,
          pcs.category_similarity as category_similarity,
          COALESCE(ss.aggregated_similarity, 0) + COALESCE(pcs.category_similarity, 0) AS total_similarity
        FROM
          similarity_scores ss
        LEFT JOIN
          preferred_category_scores pcs ON ss.id = pcs.id
      )
      SELECT id, total_similarity, category_similarity
      FROM combined_scores
      WHERE total_similarity >= ${MIN_SIMILARITY}
      ORDER BY total_similarity DESC
      LIMIT :limit OFFSET :offset;
    `

    const replacements = {
      favouritePostIds: `{${favouritePostIds.join(',')}}`,
      preferredCategoryVectors: categoriesVectors.flat(),
      preferredCategoryIds: `{${account.preferredCategoriesIds.join(',')}}`,
      userAccountId: account.id,
      limit: perPage,
      offset: page * perPage,
      categoryWeight: SIMILARITY_WEIGHTS.categoryWeight,
    }

    const posts = await DatabaseConnection.getInstance().query(query, {
      replacements,
    })

    const postIds = posts[0].map((post) => post.id)
    return PostsRepository.findByIds(postIds)
  }

  public async updateSimilaritiesForPost(
    post: Post,
    transaction?: Transaction,
    commitTransaction = true
  ) {
    transaction = transaction || (await DatabaseConnection.getInstance().transaction())

    try {
      const allPosts = await Post.findAll({
        where: {
          id: { [Op.ne]: post.id },
          expiresAt: { [Op.gte]: new Date() },
        },
        attributes: ['id', 'vectors'],
        transaction,
      })

      const similarities = []

      for (const otherPost of allPosts) {
        if (post.id === otherPost.id) {
          continue
        }

        const titleSimilarity = this.computeCosineSimilarity(
          post.vectors.titleVector,
          otherPost.vectors.titleVector
        )
        const descriptionSimilarity = this.computeCosineSimilarity(
          post.vectors.descriptionVector,
          otherPost.vectors.descriptionVector
        )
        const categorySimilarity = this.computeCosineSimilarity(
          post.vectors.categoryVector,
          otherPost.vectors.categoryVector
        )
        const subCategorySimilarity = this.computeCosineSimilarity(
          post.vectors.subCategoryVector,
          otherPost.vectors.subCategoryVector
        )
        const locationSimilarity = this.computeCosineSimilarity(
          post.vectors.locationVector,
          otherPost.vectors.locationVector
        )

        const similarity =
          titleSimilarity * SIMILARITY_WEIGHTS.titleWeight +
          (post.description?.length
            ? descriptionSimilarity * SIMILARITY_WEIGHTS.descriptionWeight
            : 0) +
          categorySimilarity * SIMILARITY_WEIGHTS.categoryWeight +
          subCategorySimilarity * SIMILARITY_WEIGHTS.subCategoryWeight +
          locationSimilarity * SIMILARITY_WEIGHTS.locationWeight

        similarities.push({
          postId1: post.id,
          postId2: otherPost.id,
          similarity,
        })

        // Also store the reverse similarity
        similarities.push({
          postId1: otherPost.id,
          postId2: post.id,
          similarity,
        })
      }

      // Delete existing similarities
      await PostSimilarity.destroy({
        where: {
          [Op.or]: { postId1: post.id, postId2: post.id },
        },
        transaction,
      })

      // Insert new similarities
      await PostSimilarity.bulkCreate(similarities, { transaction })

      if (commitTransaction) {
        await transaction.commit()
      }
    } catch (error) {
      if (commitTransaction) {
        console.error('Coult not commit transaction - update similarities', error)
        await transaction.rollback()
      } else {
        throw error
      }
    }
  }

  public computeCosineSimilarity(vectorA: number[], vectorB: number[]) {
    const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0)
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0))
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0))
    if (magnitudeA === 0 || magnitudeB === 0) return 0
    return dotProduct / (magnitudeA * magnitudeB)
  }
}

const postSimilarityRepositoryInstance = new PostSimilarityRepository()
Object.freeze(postSimilarityRepositoryInstance)

export { postSimilarityRepositoryInstance as PostSimilarityRepository }
