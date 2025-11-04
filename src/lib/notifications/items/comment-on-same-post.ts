import admin from 'firebase-admin'
import { Account } from '../../../modules/accounts/model.js'
import { Notification } from '../../../modules/notifications/model.js'
import { FCMNotificationItem, NotificationTypes } from '../types.js'
import { NotificationContent } from '../../../modules/auxiliary-models/notification-content.js'
import { WebSubscriptions } from '../../../web-subscriptions.js'
import { WebSocketInstance } from '../../../ws/instance.js'
import { WebsocketEvents } from '../../../ws/socket-module.js'
import { generateNameForAccount, replaceNotificationPlaceholders } from '../utils.js'
import { Comment } from '../../../modules/comments/entity.js'
import { Post } from '../../../modules/posts/model.js'

class CommentOnSamePostNotification implements FCMNotificationItem {
  send = async (postId: string, initiatedBy: string) => {
    try {
      const post = await Post.findByPk(postId)
      if (!post) {
        return
      }

      const postComments = await Comment.findAll({
        where: {
          postId,
          parentCommentId: null,
        },
        attributes: ['accountId'],
      })

      if (!postComments.length) {
        return
      }

      const accountsToSendNotification = postComments
        .map((el) => el.accountId)
        .filter((el) => el !== initiatedBy && el !== post.accountId)

      const uniqueAccounts = [...new Set(accountsToSendNotification)]
      if (!uniqueAccounts.length) {
        return
      }

      for (const accountId of uniqueAccounts) {
        const account = await Account.findByPk(accountId)
        const language = (account.meta.appLanguage || 'en') as string

        const notificationContent = await NotificationContent.findByPk(
          NotificationTypes.COMMENT_ON_SAME_POST
        )
        if (!notificationContent || !notificationContent.enabled) {
          continue
        }

        if (account.allowedNotifications.COMMENT_ON_SAME_POST === false) {
          continue
        }

        const latestSentNotification = await Notification.findOne({
          where: {
            accountId: account.id,
            entityId: post.id,
            type: NotificationTypes.COMMENT_ON_SAME_POST,
            initiatedByAccountId: initiatedBy,
          },
          order: [['createdAt', 'DESC']],
          limit: 1,
        })

        const timeDifference = latestSentNotification
          ? new Date().getTime() - latestSentNotification.createdAt.getTime()
          : 0

        // Notification is not older than 1 minute
        if (latestSentNotification && timeDifference < 1000 * 60 * 1) {
          continue
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
          type: NotificationTypes.COMMENT_ON_SAME_POST,
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
              type: NotificationTypes.COMMENT_ON_SAME_POST,
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
      }
    } catch (error) {
      console.error('Could not send comment on the same post notification', error)
    }
  }
}

const notificationInstance = new CommentOnSamePostNotification()
export { notificationInstance as CommentOnSamePostNotification }
