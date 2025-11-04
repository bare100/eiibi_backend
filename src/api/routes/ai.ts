import { Router } from 'express'
import { Authenticator } from '../middlewares/auth.js'
import { HttpRateLimiter } from '../middlewares/rate-limiter.js'
import { AiController } from '../../modules/ai/controller.js'
import multer from 'multer'
import { cacheMiddleware } from '../middlewares/cache.js'
import { valdiateFilesInRequest } from '../middlewares/upload.js'

const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
})

const aiRouter = Router()
aiRouter.use(await Authenticator.authenticateHttp())
aiRouter.use(HttpRateLimiter.limitRequestsForUser)

aiRouter.get('/ai-is-enabled', cacheMiddleware, AiController.aiIsEnabled)

aiRouter.post(
  '/generate-from-images',
  // @ts-ignore
  upload.array('files'),
  valdiateFilesInRequest,
  AiController.generateFromImages
)
export { aiRouter }
