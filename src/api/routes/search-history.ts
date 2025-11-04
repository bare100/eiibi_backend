import { Router } from 'express'
import { SearchHistoryController } from '../../modules/search-history/controller.js'
import { searchHistoryValidation } from '../../modules/search-history/validation.js'
import { Authenticator } from '../middlewares/auth.js'
import { HttpRateLimiter } from '../middlewares/rate-limiter.js'
import { validateHttpRequest } from '../middlewares/validate-request.js'

const searchHistoryRouter = Router()
searchHistoryRouter.use(await Authenticator.authenticateHttp())
searchHistoryRouter.use(HttpRateLimiter.limitRequestsForUser)

searchHistoryRouter.post('/search', SearchHistoryController.getForAccount)

searchHistoryRouter.post(
  '/',
  validateHttpRequest(searchHistoryValidation.create),
  SearchHistoryController.create
)

export { searchHistoryRouter }
