import { Request, Response } from 'express'
import { GENERAL } from '../../constants/errors.js'
import { CurrenciesRepository } from './repository.js'

export class CurrenciesController {
  public static async getAll(req: Request, res: Response) {
    try {
      const currencies = await CurrenciesRepository.getAll()
      return res.status(200).json(currencies)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }
}
