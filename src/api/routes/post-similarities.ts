import { Router } from 'express'
import { Authenticator } from '../middlewares/auth.js'
import { HttpRateLimiter } from '../middlewares/rate-limiter.js'
import { PostSimilaritiesController as PostSimilaritiesController } from '../../modules/post-similarities/controller.js'
import { HttpIPRateLimiter } from '../middlewares/ip_rate_limiter.js'

const postSimilaritiesRouter = Router()

postSimilaritiesRouter.post(
  '/',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  PostSimilaritiesController.getRecommendations
)

postSimilaritiesRouter.post(
  '/similar',
  HttpIPRateLimiter.limitRequestsForUser,
  PostSimilaritiesController.getSimilarPosts
)

export { postSimilaritiesRouter }
