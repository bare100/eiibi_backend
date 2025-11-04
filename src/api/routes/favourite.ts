import { Router } from 'express'
import { Authenticator } from '../middlewares/auth.js'
import { HttpRateLimiter } from '../middlewares/rate-limiter.js'
import { FavouritesController } from '../../modules/favourites/controller.js'

const favouriteRouter = Router()
favouriteRouter.use(await Authenticator.authenticateHttp())
favouriteRouter.use(HttpRateLimiter.limitRequestsForUser)

favouriteRouter.get('/', FavouritesController.loadForAccount)
favouriteRouter.get(
  '/accounts/:postId/:page/:perPage',
  FavouritesController.getAccountsWhoAddedPostToFavourites
)

favouriteRouter.put('/add/:postId', FavouritesController.addToFavourites)
favouriteRouter.put('/remove/:postId', FavouritesController.removeFromFavourites)

export { favouriteRouter }
