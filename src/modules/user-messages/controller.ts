import { Request, Response } from 'express'

import { GENERAL } from '../../constants/errors.js'
import { UserMessagesRepository } from './repository.js'

export class UserMessagesController {
  public static async create(req: Request, res: Response) {
    const { account } = res.locals
    try {
      const { message } = req.body
      if (!message) {
        return res.status(400).send({ error: GENERAL.BAD_REQUEST })
      }

      if (message.length > 1000) {
        return res.status(400).send({ error: 'Message is too long' })
      }

      await UserMessagesRepository.create({
        accountId: account.id,
        message,
      })
      return res.status(200).json({ success: true })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }
}
