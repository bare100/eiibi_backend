import { Router } from 'express'
import { Authenticator } from '../middlewares/auth.js'
import { HttpRateLimiter } from '../middlewares/rate-limiter.js'
import { ReportsController } from '../../modules/reports/controller.js'
import { validateHttpRequest } from '../middlewares/validate-request.js'
import { reportValidation } from '../../modules/reports/validation.js'

const reportRouter = Router()
reportRouter.use(await Authenticator.authenticateHttp())
reportRouter.use(HttpRateLimiter.limitRequestsForUser)

reportRouter.post(
  '/',
  validateHttpRequest(reportValidation.create),
  ReportsController.create
)

export { reportRouter }
