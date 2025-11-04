import { Router } from 'express'
import { Authenticator } from '../middlewares/auth.js'
import { HttpRateLimiter } from '../middlewares/rate-limiter.js'
import { FollowersController } from '../../modules/followers/controller.js'
import { HttpIPRateLimiter } from '../middlewares/ip_rate_limiter.js'

const followersRouter = Router()

followersRouter.get(
  '/followers/:accountId/:page/:perPage',
  HttpIPRateLimiter.limitRequestsForUser,
  FollowersController.getFollowersForAccount
)
followersRouter.get(
  '/following/:accountId/:page/:perPage',
  HttpIPRateLimiter.limitRequestsForUser,
  FollowersController.getFollowingForAccount
)

followersRouter.put(
  '/follow/:accountId',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  FollowersController.followAccount
)
followersRouter.put(
  '/unfollow/:accountId',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  FollowersController.unfollowAccount
)

export { followersRouter }
