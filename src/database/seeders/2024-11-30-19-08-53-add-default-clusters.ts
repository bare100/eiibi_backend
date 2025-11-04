import sequelize from 'sequelize'
import { Post } from '../../modules/posts/model.js'
import { Asset } from '../../modules/assets/model.js'
import { PostMapCluster } from '../../modules/post-map-clusters/model.js'
import { Settings } from '../../modules/settings/model.js'
import { config } from '../../config.js'

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    const settings = await Settings.findOne({ transaction })
    const dateForNotExpiredPosts = new Date()
    dateForNotExpiredPosts.setDate(
      dateForNotExpiredPosts.getDate() -
        (settings?.postActiveTimeInDays ?? config.POST_ACTIVE_TIME_IN_DAYS)
    )

    const allPosts = await Post.findAll({
      include: [{ model: Asset, as: 'postAssets' }],
      where: {
        createdAt: {
          [sequelize.Op.gte]: dateForNotExpiredPosts,
        },
      },
    })
    if (!allPosts.length) {
      return
    }

    const postClusters = allPosts.map((post) => ({
      id: post.id,
      locationLat: post.locationLat,
      locationLong: post.locationLong,
      meta: {
        assetPath: post.postAssets?.length ? post.postAssets[0].path : '',
        mainCategoryId: post.mainCategoryId,
      },
      expiresAt: post.expiresAt,
    }))

    await PostMapCluster.bulkCreate(postClusters, { transaction })

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
