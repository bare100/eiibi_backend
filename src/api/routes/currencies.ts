import { Router } from 'express'
import { CurrenciesController } from '../../modules/currencies/controller.js'
import { HttpIPRateLimiter } from '../middlewares/ip_rate_limiter.js'
// import { cacheMiddleware } from '../middlewares/cache.js'

const currenciesRouter = Router()

currenciesRouter.get(
  '/',
  HttpIPRateLimiter.limitRequestsForUser,
  // cacheMiddleware,
  CurrenciesController.getAll
)

export { currenciesRouter }
