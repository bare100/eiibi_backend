import { Request, Response } from 'express'
import { GENERAL } from '../../constants/errors.js'
import { SearchHistoryRepository } from './repository.js'

export class SearchHistoryController {
  public static async getForAccount(req: Request, res: Response) {
    const { account } = res.locals
    const { query = '', page, perPage } = req.body

    try {
      const historyItems = await SearchHistoryRepository.getForAccount(
        account.id,
        {
          query,
          page: page ? parseInt(page) : 0,
          perPage: perPage ? parseInt(perPage) : 10,
        }
      )

      return res.status(200).json(historyItems)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async create(req: Request, res: Response) {
    const { account } = res.locals
    const { type, data, searchKey, entityId } = req.body

    try {
      const result = await SearchHistoryRepository.createNewSearchItem({
        accountId: account.id,
        type,
        searchKey,
        entityId,
        data,
      })

      return res.status(200).json(result)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }
}
