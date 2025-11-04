import { Express } from 'express'
import webpush from 'web-push'
import { config } from './config.js'
import { Authenticator } from './api/middlewares/auth.js'
import { PushSubscription } from './modules/auxiliary-models/push-subscription.js'
import { Notification } from './modules/notifications/model.js'
import { AccountsRepository } from './modules/accounts/repository.js'
import { NotificationTypes } from './lib/notifications/types.js'
import { SettingsRepository } from './modules/settings/repository.js'
import { Settings } from './modules/settings/model.js'

class WebSubscriptions {
  private initialized = false

  init = (app: Express) => {
    if (this.initialized) {
      return
    }

    this.initialized = true

    app.post('/web-push-subscribe', async (req, res) => {
      try {
        res.status(201).json({ status: 'success' })

        const subscription = req.body
        const authToken = req.headers.authorization
        if (!authToken) {
          return
        }

        const actualToken = authToken?.split('Bearer ')[1]
        if (!actualToken) {
          return
        }

        const account = await Authenticator.authenticateToken(actualToken)
        if (!account) {
          return
        }

        const existingPushSubscription = await PushSubscription.findOne({
          where: { accountId: account.id },
        })

        if (!existingPushSubscription) {
          await PushSubscription.create({
            accountId: account.id,
            ...subscription,
          })
        }
      } catch (error) {
        console.error('Error listening for notifications subscriber', error)
      }
    })
  }

  sendNotificationToAccount = async (accountId: string, notification: Notification) => {
    if (!this.initialized) {
      return
    }

    const settings = await SettingsRepository.get()
    const vapidPublicKey = settings?.vapidPublicKey || config.WEB_PUSH.VAPID_PUBLIC_KEY
    const vapidPrivateKey = settings?.vapidPrivateKey || config.WEB_PUSH.VAPID_PRIVATE_KEY

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys are missing. Web push notifications are disabled')
      return
    }

    const supportEmail = settings?.vapidSupportEmail || config.WEB_PUSH.SUPPORT_EMAIL

    try {
      webpush.setVapidDetails(`mailto:${supportEmail}`, vapidPublicKey, vapidPrivateKey)
    } catch (error) {
      console.error('Error setting VAPID keys', error)
    }

    try {
      const subscriberData = await PushSubscription.findOne({
        where: { accountId },
      })
      if (!subscriberData) {
        return
      }

      const accountData = await AccountsRepository.findOne({
        where: { id: accountId },
      })
      if (!accountData) {
        return
      }

      const accountLanguage = accountData.meta.appLanguage || 'en'
      const title = notification.title[accountLanguage as string] || notification.title['en']
      const description =
        notification.description[accountLanguage as string] || notification.description['en']

      const notificationPayload = {
        title,
        id: notification.id,
        body: description,
        // If you would like to add an icon to the notification, you can do it here
        // icon: 'https://example.com/icon.png',
        data: {
          url: this.generateURLForNotification(notification, settings),
        },
      }

      const subscriber = {
        endpoint: subscriberData.endpoint,
        keys: {
          p256dh: subscriberData.keys.p256dh,
          auth: subscriberData.keys.auth,
        },
      }

      await webpush.sendNotification(subscriber, JSON.stringify(notificationPayload))
    } catch (error) {
      console.error('Error sending web push notification', error)
    }
  }

  private generateURLForNotification = (notification: Notification, settings: Settings) => {
    const webAppUrl = settings?.webAppUrl || config.WEB_APP_URL
    switch (notification.type) {
      case NotificationTypes.POST_ADDED_TO_FAVOURITES:
      case NotificationTypes.FAVOURITE_POST_PRICE_CHANGE:
      case NotificationTypes.NEW_POST_FROM_FOLLOWING:
        return `${webAppUrl}/posts/${notification.entityId}`
      case NotificationTypes.NEW_FOLLOWER:
        return `${webAppUrl}/account/${notification.entityId}`

      case NotificationTypes.NEW_MESSAGE:
        return `${webAppUrl}/profile?tab=chat`

      case NotificationTypes.SYSTEM:
        return `${webAppUrl}`
    }
  }
}

const subscriptionsInstance = new WebSubscriptions()
export { subscriptionsInstance as WebSubscriptions }
