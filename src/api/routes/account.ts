import { Router } from 'express'
import { Authenticator } from '../middlewares/auth.js'
import { HttpRateLimiter } from '../middlewares/rate-limiter.js'
import { AccountsController } from '../../modules/accounts/controller.js'
import multer from 'multer'
import { valdiateFilesInRequest, validateMaxAssetsCountInRequest } from '../middlewares/upload.js'
import { accountValidation } from '../../modules/accounts/validation.js'
import { validateHttpRequest } from '../middlewares/validate-request.js'
import { HttpIPRateLimiter } from '../middlewares/ip_rate_limiter.js'

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const accountRouter = Router()

accountRouter.get(
  '/',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  AccountsController.getAuthenticated
)
accountRouter.get(
  '/details/:accountId',
  HttpIPRateLimiter.limitRequestsForUser,
  AccountsController.getDetails
)
accountRouter.get(
  '/stats',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  AccountsController.getStats
)

accountRouter.post(
  '/search',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  AccountsController.search
)

accountRouter.post(
  '/',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  // @ts-ignore
  upload.array('files'),
  valdiateFilesInRequest,
  validateMaxAssetsCountInRequest(1),
  validateHttpRequest(accountValidation.update),
  AccountsController.update
)

accountRouter.delete(
  '/',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  AccountsController.deleteAccountData
)

accountRouter.put(
  '/requestVerification',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  AccountsController.requestVerification
)

accountRouter.put(
  '/update/blocked/block/:accountId',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  AccountsController.blockAccount
)
accountRouter.put(
  '/update/blocked/unblock/:accountId',
  await Authenticator.authenticateHttp(),
  HttpRateLimiter.limitRequestsForUser,
  AccountsController.unblockAccount
)

export { accountRouter }
