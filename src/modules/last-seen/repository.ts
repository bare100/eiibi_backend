import { Transaction } from 'sequelize'
import { DatabaseConnection } from '../../database/index.js'
import { GenericRepository } from '../../lib/base-repository.js'
import { PaginatedQueryParams } from '../../types.js'
import { PostsRepository } from '../posts/repository.js'
import { LastSeenPost } from './model.js'

class LastSeenPostsRepository extends GenericRepository<LastSeenPost> {
  constructor() {
    super(LastSeenPost)
  }

  public async getLastSeenByAccount(accountId: string, paginationParams: PaginatedQueryParams) {
    const { page, perPage } = paginationParams

    const postIds = await LastSeenPost.findAll({
      where: { accountId },
      order: [['updatedAt', 'DESC']],
      limit: perPage,
      offset: page * perPage,
      attributes: ['postId'],
    })

    return PostsRepository.findByIds(postIds.map((post) => post.postId))
  }

  public async storeLastSeenPost(accountId: string, postId: string) {
    return await DatabaseConnection.getInstance().transaction(async (transaction: Transaction) => {
      // remove the last seen post if it exists
      await LastSeenPost.destroy({
        where: { accountId, postId },
        transaction,
      })

      // store the new last seen post
      await LastSeenPost.create(
        {
          accountId,
          postId,
          lastSeenAt: new Date(),
        },
        { transaction }
      )
    })
  }
}

const lastSeenPostRepositoryInstance = new LastSeenPostsRepository()
Object.freeze(lastSeenPostRepositoryInstance)

export { lastSeenPostRepositoryInstance as LastSeenPostsRepository }
