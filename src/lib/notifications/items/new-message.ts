import admin from 'firebase-admin'
import { Account } from '../../../modules/accounts/model.js'
import { Notification } from '../../../modules/notifications/model.js'
import { FCMNotificationItem, NotificationTypes } from '../types.js'
import { NotificationContent } from '../../../modules/auxiliary-models/notification-content.js'
import { WebSubscriptions } from '../../../web-subscriptions.js'
import { Op } from 'sequelize'
import { WebSocketInstance } from '../../../ws/instance.js'
import { WebsocketEvents } from '../../../ws/socket-module.js'

class NewMessageNotification implements FCMNotificationItem {
  send = async (
    accountId: string,
    fromAccount: Account,
    chatGroupId: string
  ) => {
    try {
      const account = await Account.findByPk(accountId)
      if (!account) {
        return
      }

      const language = (account.meta.appLanguage || 'en') as string
      const notificationContent = await NotificationContent.findByPk(
        NotificationTypes.NEW_MESSAGE
      )
      if (!notificationContent || !notificationContent.enabled) {
        return
      }

      const notificationFromSameUserSendInLast2Mins =
        await Notification.findOne({
          where: {
            type: NotificationTypes.NEW_MESSAGE,
            initiatedByAccountId: fromAccount.id,
            entityId: chatGroupId,
            createdAt: {
              [Op.gte]: new Date(new Date().getTime() - 2 * 60 * 1000),
            },
          },
        })

      if (notificationFromSameUserSendInLast2Mins) {
        return
      }

      if (account.allowedNotifications.NEW_MESSAGE === false) {
        return
      }

      let notification = new Notification({
        accountId: account.id,
        type: NotificationTypes.NEW_MESSAGE,
        entityId: chatGroupId,
        title: notificationContent.title,
        initiatedByAccountId: fromAccount.id,
        description: notificationContent.description,
      })

      notification = await notification.save()

      const socketInstance = WebSocketInstance.getInstance()
      socketInstance.sendEventToAccount(
        account.id,
        WebsocketEvents.NEW_NOTIFICATION,
        { ...notification }
      )

      WebSubscriptions.sendNotificationToAccount(account.id, notification)

      if (account.deviceFCMToken) {
        await admin.messaging().send({
          token: account.deviceFCMToken,
          notification: {
            title: notification.title[language] ?? notification.title['en'],
            body:
              notification.description[language] ??
              notification.description['en'],
          },
          data: {
            accountId,
            chatGroupId,
            notificationId: notification.id,
            type: NotificationTypes.NEW_MESSAGE,
            fromAccountId: fromAccount.id,
          },
          android: {
            notification: {
              color: '#D94F30',
            },
          },
        })
      }
    } catch (error) {
      console.error('Coult not send new message notification', error)
    }
  }
}

const notificationInstance = new NewMessageNotification()
export { notificationInstance as NewMessageNotification }
