import { Router } from 'express'
import { Authenticator } from '../middlewares/auth.js'
import { HttpRateLimiter } from '../middlewares/rate-limiter.js'
import { FiltersController } from '../../modules/filters/controller.js'

const filtersRouter = Router()
filtersRouter.use(await Authenticator.authenticateHttp())
filtersRouter.use(HttpRateLimiter.limitRequestsForUser)

filtersRouter.post('/', FiltersController.create)

filtersRouter.delete('/:filterId', FiltersController.delete)

export { filtersRouter }
