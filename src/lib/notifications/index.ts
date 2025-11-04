import { Account } from '../../modules/accounts/model.js'
import { Notification } from '../../modules/notifications/model.js'
import { PostAddedToFavouritesNotification } from './items/post-added-to-favourites.js'
import { PostFromFollowingAccountNotification } from './items/post-from-following.js'
import { FavouritePostPriceChangeNotification } from './items/favourite-price-change.js'
import { NewFollowerNotification } from './items/new-follower.js'
import { NewMessageNotification } from './items/new-message.js'
import admin from 'firebase-admin'
import { NotificationTypes } from './types.js'
import { AccountWasVerifiedNotification } from './items/account-verified.js'
import { NewCommentOnPostNotification } from './items/new-comment.js'
import { NewCommentReplyNotification } from './items/new-comment-reply.js'
import { CommentOnSamePostNotification } from './items/comment-on-same-post.js'

class FCMNotificationService {
  sendPostAddedToFavourites = PostAddedToFavouritesNotification.send
  sendNewMessage = NewMessageNotification.send
  sendNewFollower = NewFollowerNotification.send
  sendNewPostFromFollowingAccount = PostFromFollowingAccountNotification.send
  sendFavouritePostPriceChange = FavouritePostPriceChangeNotification.send
  sendAccountWasVerifiedNotification = AccountWasVerifiedNotification.send
  sendNewCommentOnPost = NewCommentOnPostNotification.send
  sendCommentReply = NewCommentReplyNotification.send
  sendCommentOnSamePost = CommentOnSamePostNotification.send

  sendSystemNotification = async (
    accountIds: string[],
    title: Record<string, string>,
    description: Record<string, string>
  ) => {
    if (!accountIds.length) {
      return 0
    }

    if (!title || typeof title !== 'object' || !Object.keys(title).length) {
      return 0
    }

    if (!description || typeof description !== 'object' || !Object.keys(description).length) {
      return 0
    }

    let sentNotifications = 0
    for (const accountId of accountIds) {
      try {
        const account = await Account.findByPk(accountId)
        if (!account || !account.deviceFCMToken) {
          continue
        }

        let notification = new Notification({
          accountId,
          type: NotificationTypes.SYSTEM,
          title,
          description,
        })

        notification = await notification.save()

        const language = (account.meta.appLanguage || 'en') as string
        await admin.messaging().send({
          token: account.deviceFCMToken,
          notification: {
            title: notification.title[language] ?? notification.title['en'],
            body: notification.description[language] ?? notification.description['en'],
          },
          data: {
            notificationId: notification.id,
            type: NotificationTypes.SYSTEM,
            accountId: account.id,
          },
          android: {
            notification: {
              color: '#D94F30',
            },
          },
        })

        sentNotifications += 1
      } catch (error) {}
    }

    return sentNotifications
  }

  resendNotification = async (notificationId: string) => {
    const notification = await Notification.findByPk(notificationId)
    if (!notification) {
      return false
    }

    const account = await Account.findByPk(notification.accountId)
    if (!account || !account.deviceFCMToken) {
      return false
    }

    const notificationAllowed = account.allowedNotifications[notification.type]
    if (notificationAllowed === false) {
      return false
    }

    const language = (account.meta.appLanguage || 'en') as string

    await admin.messaging().send({
      token: account.deviceFCMToken,
      notification: {
        title: notification.title[language] ?? notification.title['en'],
        body: notification.description[language] ?? notification.description['en'],
      },
      data: {
        postId: notification.entityId,
        notificationId: notification.id,
        type: notification.type,
        accountId: account.id,
      },
      android: {
        notification: {
          color: '#D94F30',
        },
      },
    })

    return true
  }
}

const fcMNotificationService = new FCMNotificationService()
Object.freeze(fcMNotificationService)

export { fcMNotificationService as FCMNotificationService }
