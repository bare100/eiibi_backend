import { Router } from 'express'
import { CategoriesController } from '../../modules/categories/controller.js'
import { HttpIPRateLimiter } from '../middlewares/ip_rate_limiter.js'

const categoriesRouter = Router()
categoriesRouter.use(HttpIPRateLimiter.limitRequestsForUser)

categoriesRouter.get('/', CategoriesController.getAll)

export { categoriesRouter }
