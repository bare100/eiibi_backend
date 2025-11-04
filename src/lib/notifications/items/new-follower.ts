import admin from 'firebase-admin'
import { Account } from '../../../modules/accounts/model.js'
import { Notification } from '../../../modules/notifications/model.js'
import { FCMNotificationItem, NotificationTypes } from '../types.js'
import {
  generateNameForAccount,
  replaceNotificationPlaceholders,
} from '../utils.js'
import { NotificationContent } from '../../../modules/auxiliary-models/notification-content.js'
import { WebSubscriptions } from '../../../web-subscriptions.js'
import { WebSocketInstance } from '../../../ws/instance.js'
import { WebsocketEvents } from '../../../ws/socket-module.js'

class NewFollowerNotification implements FCMNotificationItem {
  send = async (follower: Account, followingId: string) => {
    if (follower.id == followingId) {
      return
    }

    try {
      const account = await Account.findByPk(followingId)
      if (!account) {
        return
      }

      const notificationFromSameUserSent = await Notification.findOne({
        where: {
          type: NotificationTypes.NEW_FOLLOWER,
          accountId: followingId,
          initiatedByAccountId: follower.id,
        },
      })

      if (notificationFromSameUserSent) {
        return
      }

      const language = (account.meta.appLanguage || 'en') as string
      const notificationContent = await NotificationContent.findByPk(
        NotificationTypes.NEW_FOLLOWER
      )
      if (!notificationContent || !notificationContent.enabled) {
        return
      }

      const followerName = generateNameForAccount(follower, language as string)
      const description = Object.keys(notificationContent.description).reduce(
        (acc: Record<string, string>, lang) => {
          acc[lang] = replaceNotificationPlaceholders(
            notificationContent.description[lang],
            { followerName }
          )
          return acc
        },
        {}
      )

      if (account.allowedNotifications.NEW_FOLLOWER === false) {
        return
      }

      let notification = new Notification({
        accountId: followingId,
        type: NotificationTypes.NEW_FOLLOWER,
        entityId: followingId,
        initiatedByAccountId: follower.id,
        title: notificationContent.title,
        description,
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
            followerId: follower.id,
            notificationId: notification.id,
            type: NotificationTypes.NEW_FOLLOWER,
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
      console.error('Coult not send new follower notification', error)
    }
  }
}

const notificationInstance = new NewFollowerNotification()
export { notificationInstance as NewFollowerNotification }
