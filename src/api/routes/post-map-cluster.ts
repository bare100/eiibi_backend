import { Router } from 'express'
import { HttpIPRateLimiter } from '../middlewares/ip_rate_limiter.js'
import { PostMapClustersController } from '../../modules/post-map-clusters/controller.js'

const postMapClusterRouter = Router()

postMapClusterRouter.get(
  '/',
  HttpIPRateLimiter.limitRequestsForUser,
  PostMapClustersController.getAll
)

export { postMapClusterRouter }
