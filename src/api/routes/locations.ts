import { Router } from 'express'
import { PostsController } from '../../modules/posts/controller.js'
import { HttpIPRateLimiter } from '../middlewares/ip_rate_limiter.js'

const locationsRouter = Router()
locationsRouter.use(HttpIPRateLimiter.limitRequestsForUser)

locationsRouter.get('/all', PostsController.getAllLocations)

export { locationsRouter }
