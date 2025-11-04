import admin from 'firebase-admin'
import { Account } from '../../../modules/accounts/model.js'
import { Notification } from '../../../modules/notifications/model.js'
import { FCMNotificationItem, NotificationTypes } from '../types.js'
import { NotificationContent } from '../../../modules/auxiliary-models/notification-content.js'
import { WebSubscriptions } from '../../../web-subscriptions.js'
import { WebSocketInstance } from '../../../ws/instance.js'
import { WebsocketEvents } from '../../../ws/socket-module.js'

class AccountWasVerifiedNotification implements FCMNotificationItem {
  send = async (accountId: string) => {
    try {
      const account = await Account.findByPk(accountId)
      if (!account) {
        return
      }

      // If the notification was already sent, don't send it again from the same user
      const notificationFromSameUserSent = await Notification.findOne({
        where: {
          type: NotificationTypes.ACCOUNT_VERIFIED,
          accountId: account.id,
          entityId: account.id,
        },
      })

      if (notificationFromSameUserSent) {
        return
      }

      const notificationContent = await NotificationContent.findByPk(
        NotificationTypes.ACCOUNT_VERIFIED
      )
      if (!notificationContent || !notificationContent.enabled) {
        return
      }

      const language = (account.meta.appLanguage || 'en') as string
      if (account.allowedNotifications.SYSTEM === false) {
        return
      }

      let notification = new Notification({
        accountId: account.id,
        type: NotificationTypes.ACCOUNT_VERIFIED,
        entityId: account.id,
        title: notificationContent.title,
        description: notificationContent.description,
      })

      notification = await notification.save()

      const socketInstance = WebSocketInstance.getInstance()
      socketInstance.sendEventToAccount(account.id, WebsocketEvents.NEW_NOTIFICATION, {
        ...notification,
      })

      socketInstance.sendEventToAccount(account.id, WebsocketEvents.ACCOUNT_VERIFIED, {})

      WebSubscriptions.sendNotificationToAccount(account.id, notification)

      if (account.deviceFCMToken) {
        await admin.messaging().send({
          token: account.deviceFCMToken,
          notification: {
            title: notification.title[language] ?? notification.title['en'],
            body: notification.description[language] ?? notification.description['en'],
          },
          data: {
            notificationId: notification.id,
            type: NotificationTypes.ACCOUNT_VERIFIED,
            accountId: account.id,
          },
          android: {
            notification: {
              color: '#D94F30',
            },
          },
        })
      }
    } catch (error) {
      console.error('Could not send account verified notification', error)
    }
  }
}

const notificationInstance = new AccountWasVerifiedNotification()
export { notificationInstance as AccountWasVerifiedNotification }
