import { Request, Response } from 'express'

import { GENERAL } from '../../constants/errors.js'
import { Notification } from './model.js'
import { NotificationsRepository } from './repository.js'

export class NotificationsController {
  public static async getForAccount(req: Request, res: Response) {
    const { account } = res.locals
    const { page, perPage } = req.params

    try {
      const notifications =
        await NotificationsRepository.getNotificationsPaginated(
          account.id,
          page ? parseInt(page) : 0,
          perPage ? parseInt(perPage) : 20
        )

      return res.status(200).json(notifications)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async getUnreadNotificationsCount(req: Request, res: Response) {
    const { account } = res.locals

    try {
      const unreadNotificationsCount =
        await NotificationsRepository.getUnreadNotificationsCount(account.id)

      return res.status(200).json({ unreadNotificationsCount })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async markAsRead(req: Request, res: Response) {
    const { account } = res.locals
    const { notificationId } = req.params
    try {
      const notification = await Notification.findByPk(notificationId)
      if (!notification || notification.accountId !== account.id) {
        return res.status(400).send({ error: GENERAL.BAD_REQUEST })
      }

      notification.read = true
      notification.readAt = new Date()
      await notification.save()

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async markAllAsRead(req: Request, res: Response) {
    const { account } = res.locals

    try {
      await Notification.update(
        { read: true, readAt: new Date() },
        { where: { accountId: account.id } }
      )

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }
}
