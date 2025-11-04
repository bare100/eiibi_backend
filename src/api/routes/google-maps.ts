import { Router } from 'express'
import { GoogleMapsController } from '../../modules/google-maps/controller.js'
import { cacheMiddleware } from '../middlewares/cache.js'

const googleMapsRouter = Router()

googleMapsRouter.get(
  '/details/:referenceId',
  cacheMiddleware,
  GoogleMapsController.getReferenceDetails
)
googleMapsRouter.get(
  '/location/:lat/:lng',
  cacheMiddleware,
  GoogleMapsController.getDetailsBasedOnLocation
)

googleMapsRouter.get(
  '/search/:keyword',
  cacheMiddleware,
  GoogleMapsController.searchByKeyword
)

export { googleMapsRouter }
