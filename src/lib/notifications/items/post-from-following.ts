import admin from 'firebase-admin'
import { Account } from '../../../modules/accounts/model.js'
import { Notification } from '../../../modules/notifications/model.js'
import { FCMNotificationItem, NotificationTypes } from '../types.js'
import { Op } from 'sequelize'
import { Follower } from '../../../modules/followers/model.js'
import { generateNameForAccount, replaceNotificationPlaceholders } from '../utils.js'
import { NotificationContent } from '../../../modules/auxiliary-models/notification-content.js'
import { WebSubscriptions } from '../../../web-subscriptions.js'
import { WebSocketInstance } from '../../../ws/instance.js'
import { WebsocketEvents } from '../../../ws/socket-module.js'

class PostFromFollowingAccountNotification implements FCMNotificationItem {
  send = async (account: Account, postId: string) => {
    try {
      const accountFollowers = await Follower.findAll({
        where: {
          followingId: account.id,
        },
      })

      if (!accountFollowers.length) {
        return
      }

      const notificationFromSameUserSendInLastMin = await Notification.findOne({
        where: {
          type: NotificationTypes.NEW_POST_FROM_FOLLOWING,
          initiatedByAccountId: account.id,
          createdAt: {
            [Op.gte]: new Date(new Date().getTime() - 60 * 1000),
          },
        },
      })

      if (notificationFromSameUserSendInLastMin) {
        return
      }

      const accountFollowersIds = accountFollowers.map((el) => el.followerId)
      const uniqueAccountIds = [...new Set(accountFollowersIds)]

      const notificationContent = await NotificationContent.findByPk(
        NotificationTypes.NEW_POST_FROM_FOLLOWING
      )
      if (!notificationContent || !notificationContent.enabled) {
        return
      }

      for (const followerId of uniqueAccountIds) {
        if (followerId === account.id) {
          continue
        }

        const follower = await Account.findByPk(followerId)
        if (!follower) {
          return
        }

        const language = (follower.meta.appLanguage || 'en') as string
        const userName = generateNameForAccount(account, language as string)
        const description = Object.keys(notificationContent.description).reduce(
          (acc: Record<string, string>, lang) => {
            acc[lang] = replaceNotificationPlaceholders(notificationContent.description[lang], {
              postCreatorName: userName,
            })
            return acc
          },
          {}
        )

        if (account.allowedNotifications.NEW_POST_FROM_FOLLOWING === false) {
          return
        }

        let notification = new Notification({
          accountId: follower.id,
          type: NotificationTypes.NEW_POST_FROM_FOLLOWING,
          entityId: postId,
          initiatedByAccountId: account.id,
          title: notificationContent.title,
          description: description,
        })

        notification = await notification.save()

        const socketInstance = WebSocketInstance.getInstance()
        socketInstance.sendEventToAccount(follower.id, WebsocketEvents.NEW_NOTIFICATION, {
          ...notification,
        })

        WebSubscriptions.sendNotificationToAccount(follower.id, notification)

        if (follower.deviceFCMToken) {
          await admin.messaging().send({
            token: follower.deviceFCMToken,
            notification: {
              title: notification.title[language] ?? notification.title['en'],
              body: notification.description[language] ?? notification.description['en'],
            },
            data: {
              postId,
              notificationId: notification.id,
              type: NotificationTypes.NEW_POST_FROM_FOLLOWING,
              accountId: follower.id,
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
      console.error('Coult not send new post from followed account notification', error)
    }
  }
}

const notificationInstance = new PostFromFollowingAccountNotification()
export { notificationInstance as PostFromFollowingAccountNotification }
