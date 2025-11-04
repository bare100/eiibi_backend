import { Op } from 'sequelize'
import { GenericRepository } from '../../lib/base-repository.js'
import { Notification } from './model.js'

class NotificationsRepository extends GenericRepository<Notification> {
  constructor() {
    super(Notification)
  }

  public async getNotificationsPaginated(
    accountId: string,
    page: number,
    perPage: number
  ) {
    return await Notification.findAll({
      limit: perPage,
      offset: page * perPage,
      where: {
        accountId: accountId,
      },
      order: [['createdAt', 'DESC']],
    })
  }

  public async getUnreadNotificationsCount(accountId: string) {
    return await Notification.count({
      where: {
        accountId,
        read: false,
      },
    })
  }

  public async notificationOfTypeExistsInLast2Mins(
    accountId: string,
    notificationType: string
  ) {
    const count = await Notification.count({
      where: {
        accountId,
        type: notificationType,
        createdAt: {
          [Op.gte]: new Date(new Date().getTime() - 2 * 60 * 1000),
        },
      },
    })

    return count > 0
  }

  public async notificationOfTypeExistsInLast30Mins(
    accountId: string,
    notificationType: string
  ) {
    const count = await Notification.count({
      where: {
        accountId,
        type: notificationType,
        createdAt: {
          [Op.gte]: new Date(new Date().getTime() - 30 * 60 * 1000),
        },
      },
    })

    return count > 0
  }

  public async notificationOfTypeExistsInLast10Mins(
    accountId: string,
    notificationType: string
  ) {
    const count = await Notification.count({
      where: {
        accountId,
        type: notificationType,
        createdAt: {
          [Op.gte]: new Date(new Date().getTime() - 10 * 60 * 1000),
        },
      },
    })

    return count > 0
  }
}

const notificationsRepoInstance = new NotificationsRepository()
Object.freeze(notificationsRepoInstance)

export { notificationsRepoInstance as NotificationsRepository }
