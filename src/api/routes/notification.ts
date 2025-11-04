import { Router } from 'express'
import { Authenticator } from '../middlewares/auth.js'
import { HttpRateLimiter } from '../middlewares/rate-limiter.js'
import { NotificationsController } from '../../modules/notifications/controller.js'

const notificationRouter = Router()
notificationRouter.use(await Authenticator.authenticateHttp())
notificationRouter.use(HttpRateLimiter.limitRequestsForUser)

notificationRouter.get('/:page/:perPage', NotificationsController.getForAccount)
notificationRouter.get(
  '/unread',
  NotificationsController.getUnreadNotificationsCount
)

notificationRouter.put('/:notificationId', NotificationsController.markAsRead)
notificationRouter.put('/', NotificationsController.markAllAsRead)

export { notificationRouter }
