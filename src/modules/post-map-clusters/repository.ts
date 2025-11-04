import { Transaction } from 'sequelize'
import { DatabaseConnection } from '../../database/index.js'
import { GenericRepository } from '../../lib/base-repository.js'
import { Asset } from '../assets/model.js'
import { Post } from '../posts/model.js'
import { PostMapCluster } from './model.js'

class PostMapClustersRepository extends GenericRepository<PostMapCluster> {
  constructor() {
    super(PostMapCluster)
  }

  public async storeForPost(postId: string, transaction?: Transaction, commit = true) {
    transaction = transaction || (await DatabaseConnection.getInstance().transaction())

    try {
      await PostMapCluster.destroy({
        where: { id: postId },
        transaction,
      })

      const post = await Post.findOne({
        where: { id: postId },
        include: [{ model: Asset, as: 'postAssets' }],
        transaction,
      })
      if (!post) {
        return
      }

      const cluster = new PostMapCluster({
        id: post.id,
        locationLat: post.locationLat,
        locationLong: post.locationLong,
        meta: {
          assetPath: post.postAssets?.length ? post.postAssets[0].path : '',
          mainCategoryId: post.mainCategoryId,
        },
        expiresAt: post.expiresAt,
      })

      await cluster.save({ transaction })
      if (commit) {
        try {
          await transaction.commit()
        } catch (error) {
          console.error('Coult not commit transaction - store post map cluster', error)
        }
      }
    } catch (error) {
      console.error('Error storing post map cluster', postId, error)
      if (commit) {
        await transaction.rollback()
      }
    }
  }
}

const postMapClustersRepositoryInstance = new PostMapClustersRepository()
Object.freeze(postMapClustersRepositoryInstance)

export { postMapClustersRepositoryInstance as PostMapClustersRepository }
