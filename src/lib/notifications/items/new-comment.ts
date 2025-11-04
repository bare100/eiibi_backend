import admin from 'firebase-admin'
import { Account } from '../../../modules/accounts/model.js'
import { Notification } from '../../../modules/notifications/model.js'
import { FCMNotificationItem, NotificationTypes } from '../types.js'
import { NotificationContent } from '../../../modules/auxiliary-models/notification-content.js'
import { WebSubscriptions } from '../../../web-subscriptions.js'
import { WebSocketInstance } from '../../../ws/instance.js'
import { WebsocketEvents } from '../../../ws/socket-module.js'
import { generateNameForAccount, replaceNotificationPlaceholders } from '../utils.js'
import { Post } from '../../../modules/posts/model.js'

class NewCommentOnPostNotification implements FCMNotificationItem {
  send = async (postId: string, initiatedBy: string) => {
    try {
      const post = await Post.findByPk(postId)
      if (!post) {
        return
      }

      if (post.accountId === initiatedBy) {
        return
      }

      const account = await Account.findByPk(post.accountId)
      const language = (account.meta.appLanguage || 'en') as string

      const notificationContent = await NotificationContent.findByPk(
        NotificationTypes.NEW_COMMENT_ON_POST
      )
      if (!notificationContent || !notificationContent.enabled) {
        return
      }

      if (account.allowedNotifications.NEW_COMMENT_ON_POST === false) {
        return
      }

      const latestNotification = await Notification.findOne({
        where: {
          accountId: post.accountId,
          entityId: post.id,
          initiatedByAccountId: initiatedBy,
          type: NotificationTypes.NEW_COMMENT_ON_POST,
        },
        order: [['createdAt', 'DESC']],
        limit: 1,
      })

      const timeDifference = latestNotification
        ? new Date().getTime() - latestNotification.createdAt.getTime()
        : 0

      // Notification is not older than 1 minute
      if (latestNotification && timeDifference < 1000 * 60 * 1) {
        return
      }

      const userName = generateNameForAccount(account, language as string)
      const description = Object.keys(notificationContent.description).reduce(
        (acc: Record<string, string>, lang) => {
          acc[lang] = replaceNotificationPlaceholders(notificationContent.description[lang], {
            userName,
          })
          return acc
        },
        {}
      )

      let notification = new Notification({
        accountId: account.id,
        type: NotificationTypes.NEW_COMMENT_ON_POST,
        entityId: post.id,
        title: notificationContent.title,
        description: description,
        initiatedByAccountId: initiatedBy,
      })
      notification = await notification.save()

      const socketInstance = WebSocketInstance.getInstance()
      socketInstance.sendEventToAccount(account.id, WebsocketEvents.NEW_NOTIFICATION, {
        ...notification,
      })

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
            type: NotificationTypes.NEW_COMMENT_ON_POST,
            postId: post.id,
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
      console.error('Could not send new comment on post notification', error)
    }
  }
}

const notificationInstance = new NewCommentOnPostNotification()
export { notificationInstance as NewCommentOnPostNotification }
