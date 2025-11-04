import { Router } from 'express'
import { Authenticator } from '../middlewares/auth.js'
import { HttpRateLimiter } from '../middlewares/rate-limiter.js'
import { UserMessagesController } from '../../modules/user-messages/controller.js'

const userMessageRouter = Router()
userMessageRouter.use(await Authenticator.authenticateHttp())
userMessageRouter.use(HttpRateLimiter.limitRequestsForUser)

userMessageRouter.post('/', UserMessagesController.create)

export { userMessageRouter }
