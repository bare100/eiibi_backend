import { Router } from 'express'
import { Authenticator } from '../middlewares/auth.js'
import { HttpRateLimiter } from '../middlewares/rate-limiter.js'
import { RewardAdController } from '../../modules/ads/controller.js'

const adsRouter = Router()

adsRouter.post(
  '/store',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  RewardAdController.storeStartedAd
)

adsRouter.post(
  '/reward',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  RewardAdController.giveReward
)

export { adsRouter }
