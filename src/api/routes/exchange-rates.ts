import { Router } from 'express'
import { ExchangeRatesController } from '../../modules/exchange-rates/controller.js'
import { HttpIPRateLimiter } from '../middlewares/ip_rate_limiter.js'

const exchangeRatesRouter = Router()

exchangeRatesRouter.get(
  '/',
  HttpIPRateLimiter.limitRequestsForUser,
  ExchangeRatesController.getLatest
)

export { exchangeRatesRouter }
