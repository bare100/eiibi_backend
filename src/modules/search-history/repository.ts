import { Op, Sequelize, Transaction } from 'sequelize'
import { DatabaseConnection } from '../../database/index.js'
import { GenericRepository } from '../../lib/base-repository.js'
import { SearchHistoryItem } from './model.js'
import { PaginatedQueryParams } from '../../types.js'

class SearchHistoryRepository extends GenericRepository<SearchHistoryItem> {
  constructor() {
    super(SearchHistoryItem)
  }

  public async getForAccount(
    accountId: string,
    paginationParams: PaginatedQueryParams
  ) {
    const { page, perPage, query } = paginationParams

    const SEARCH_WHERE_COND = query.length
      ? {
          where: {
            [Op.or]: [
              ...(query.length
                ? [
                    Sequelize.literal(`"data" ILIKE $1`),
                    Sequelize.literal(`"searchKey" ILIKE $1`),
                  ]
                : []),
            ],
          },
        }
      : {}

    return SearchHistoryItem.findAll({
      where: {
        [Op.and]: {
          accountId,
          ...SEARCH_WHERE_COND,
        },
      },
      order: [['createdAt', 'DESC']],
      limit: perPage,
      offset: page * perPage,
      ...(query ? { bind: [`%${query}%`] } : {}),
    })
  }

  public async createNewSearchItem(item: Partial<SearchHistoryItem>) {
    return await DatabaseConnection.getInstance().transaction(
      async (transaction: Transaction) => {
        if (item.entityId) {
          await SearchHistoryItem.destroy({
            where: { type: item.type, entityId: item.entityId },
            transaction,
          })
        } else {
          await SearchHistoryItem.destroy({
            where: { type: item.type, searchKey: item.searchKey },
            transaction,
          })
        }

        return await super.create(item, transaction)
      }
    )
  }
}

const searchHistoryRepository = new SearchHistoryRepository()
Object.freeze(searchHistoryRepository)

export { searchHistoryRepository as SearchHistoryRepository }
