import { Router } from 'express'
import { PaymentsController } from '../../modules/payments/controller.js'
import { Authenticator } from '../middlewares/auth.js'
import { HttpRateLimiter } from '../middlewares/rate-limiter.js'
import { HttpIPRateLimiter } from '../middlewares/ip_rate_limiter.js'
import { cacheMiddleware } from '../middlewares/cache.js'

const paymentsRouter = Router()
paymentsRouter.post('/hook', PaymentsController.handlePayment)

paymentsRouter.get('/available-payments', cacheMiddleware, PaymentsController.getAvailablePayments)

paymentsRouter.get(
  '/products',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  PaymentsController.getAllPaymentProducts
)

paymentsRouter.post(
  '/stripe-session',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  PaymentsController.createPaymentSession
)

paymentsRouter.post(
  '/paypal-session',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  PaymentsController.createPaypalPaymentSession
)

paymentsRouter.post(
  '/paypal-capture',
  HttpIPRateLimiter.limitRequestsForUser,
  PaymentsController.handlePaypalCapture
)

paymentsRouter.post('/stripe-webhook', PaymentsController.handleStripeWebhook)

paymentsRouter.post(
  '/razorpay-order',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  PaymentsController.createRazorpayOrder
)

paymentsRouter.post('/razorpay-webhook', PaymentsController.handleRazorpayWebhook)

export { paymentsRouter }
