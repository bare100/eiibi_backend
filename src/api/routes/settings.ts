import { Router } from 'express'
import { SettingsController } from '../../modules/settings/controller.js'
import { HttpIPRateLimiter } from '../middlewares/ip_rate_limiter.js'

const settingsRouter = Router()

settingsRouter.get('/', HttpIPRateLimiter.limitRequestsForUser, SettingsController.get)

export { settingsRouter }
