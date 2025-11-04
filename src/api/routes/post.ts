import multer from 'multer'
import { Router } from 'express'
import { Authenticator } from '../middlewares/auth.js'
import { HttpRateLimiter } from '../middlewares/rate-limiter.js'
import { PostsController } from '../../modules/posts/controller.js'
import { valdiateFilesInRequest } from '../middlewares/upload.js'
import { validateHttpRequest } from '../middlewares/validate-request.js'
import { postValidation } from '../../modules/posts/validation.js'
import { HttpIPRateLimiter } from '../middlewares/ip_rate_limiter.js'
import { cacheMiddleware } from '../middlewares/cache.js'

const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
})

const postRouter = Router()

postRouter.get('/latest', HttpIPRateLimiter.limitRequestsForUser, PostsController.getLatest)
postRouter.get(
  '/details/:postId',
  HttpIPRateLimiter.limitRequestsForUser,
  PostsController.getDetails
)
postRouter.get(
  '/summary/:postId',
  HttpIPRateLimiter.limitRequestsForUser,
  cacheMiddleware,
  PostsController.getSummary
)
postRouter.get(
  '/search/:keyword/:page/:perPage',
  HttpIPRateLimiter.limitRequestsForUser,
  PostsController.search
)
postRouter.get(
  '/byLocationProximity/:lat/:lng/:mainCategoryId/:distance',
  HttpIPRateLimiter.limitRequestsForUser,
  PostsController.getByLocationProximity
)
postRouter.get(
  '/translate/:postId/:lang',
  HttpIPRateLimiter.limitRequestsForUser,
  PostsController.translatePostDetails
)

postRouter.post(
  '/byAccount/active/:accountId',
  HttpIPRateLimiter.limitRequestsForUser,
  PostsController.getActiveByAccount
)
postRouter.post(
  '/byAccount/active/count/:accountId',
  HttpIPRateLimiter.limitRequestsForUser,
  PostsController.countActiveByAccount
)
postRouter.post(
  '/filter/count',
  HttpIPRateLimiter.limitRequestsForUser,
  PostsController.countFilteredPosts
)
postRouter.post(
  '/filter/posts',
  HttpIPRateLimiter.limitRequestsForUser,
  PostsController.loadFilteredPosts
)
postRouter.post(
  '/all/account/:status',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  PostsController.getAllForAccountByStatus
)
postRouter.post(
  '/all/account/:status/count',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  PostsController.countForAccountByStatus
)
postRouter.post(
  '/summary/many',
  HttpIPRateLimiter.limitRequestsForUser,
  PostsController.getManySummary
)

postRouter.post(
  '/',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  // @ts-ignore
  upload.array('files'),
  valdiateFilesInRequest,
  validateHttpRequest(postValidation.createOrUpdate),
  PostsController.create
)

postRouter.put(
  '/close/:postId',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  PostsController.closePost
)

postRouter.put(
  '/promote/:postId',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  PostsController.promotePost
)
postRouter.put(
  '/:postId',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  // @ts-ignore
  upload.array('files'),
  valdiateFilesInRequest,
  validateHttpRequest(postValidation.createOrUpdate),
  PostsController.update
)

postRouter.delete(
  '/:postId',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  PostsController.delete
)

export { postRouter }
