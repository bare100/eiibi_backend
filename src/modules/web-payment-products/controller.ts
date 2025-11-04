import { Request, Response } from 'express'

import { GENERAL } from '../../constants/errors.js'
import { WebPaymentProductsRepository } from './repository.js'

export class WebPaymentProductsController {
  public static async getAll(req: Request, res: Response) {
    try {
      const products = await WebPaymentProductsRepository.getAll()
      return res.status(200).json(products)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }
}
