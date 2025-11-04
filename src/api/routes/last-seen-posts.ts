import { Router } from 'express'
import { Authenticator } from '../middlewares/auth.js'
import { HttpRateLimiter } from '../middlewares/rate-limiter.js'
import { LastSeenPostsController } from '../../modules/last-seen/controller.js'

const lastSeenPostsRouter = Router()
lastSeenPostsRouter.use(await Authenticator.authenticateHttp())
lastSeenPostsRouter.use(HttpRateLimiter.limitRequestsForUser)

lastSeenPostsRouter.get('/:page/:perPage', LastSeenPostsController.getLastSeenByAccount)

lastSeenPostsRouter.post('/', LastSeenPostsController.storeLastSeen)

export { lastSeenPostsRouter }
