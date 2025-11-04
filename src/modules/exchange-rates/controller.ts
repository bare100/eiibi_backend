import { Request, Response } from 'express'
import { GENERAL } from '../../constants/errors.js'
import { ExchangeRatesRepository } from './repository.js'
import { getDataFromCache, setDataInCache } from '../../api/middlewares/cache.js'

export const EXCHANGE_RATES_CACHE_KEY = 'exchangeRates'

export class ExchangeRatesController {
  public static async getLatest(req: Request, res: Response) {
    try {
      const dataFromCache = getDataFromCache(EXCHANGE_RATES_CACHE_KEY)
      if (dataFromCache) {
        return res.status(200).json(dataFromCache)
      }
      const exchangeRates = await ExchangeRatesRepository.getLatest()
      setDataInCache(EXCHANGE_RATES_CACHE_KEY, exchangeRates)
      return res.status(200).json(exchangeRates)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }
}
