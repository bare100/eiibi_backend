import { Request, Response } from 'express'
import { GENERAL } from '../../constants/errors.js'
import { FiltersRepository } from './repository.js'
import { v4 as uuidv4 } from 'uuid'

export class FiltersController {
  public static async create(req: Request, res: Response) {
    const { account } = res.locals

    const { id = uuidv4(), name, type, data } = req.body
    try {
      if (!account.email) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      if (!name || !type || !data) {
        return res.status(500).send({ error: GENERAL.BAD_REQUEST })
      }

      if (name.length > 250) {
        return res.status(500).send({ error: GENERAL.BAD_REQUEST })
      }

      if (type !== 'generic' && type !== 'genres') {
        return res.status(500).send({ error: GENERAL.BAD_REQUEST })
      }

      const filterItem = await FiltersRepository.create({
        id,
        name,
        type,
        data,
        accountId: account.id,
      })

      return res.status(200).json({ success: true, filterItem })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async delete(req: Request, res: Response) {
    const { account } = res.locals
    const { filterId } = req.params

    try {
      if (!account.email) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      const filter = await FiltersRepository.findOne({
        where: { id: filterId },
      })
      if (!filter) {
        return res.status(404).send({ error: GENERAL.NOT_FOUND })
      }

      if (filter.accountId !== account.id) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      await FiltersRepository.deleteById(filterId)

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }
}
