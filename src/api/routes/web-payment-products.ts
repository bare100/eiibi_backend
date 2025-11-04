import { Router } from 'express'
import { WebPaymentProductsController } from '../../modules/web-payment-products/controller.js'
import { HttpIPRateLimiter } from '../middlewares/ip_rate_limiter.js'

const webPaymentProductsRouter = Router()

webPaymentProductsRouter.get(
  '/',
  HttpIPRateLimiter.limitRequestsForUser,
  WebPaymentProductsController.getAll
)

export { webPaymentProductsRouter }
