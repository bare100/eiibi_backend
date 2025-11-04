import { RateLimiterMemory } from 'rate-limiter-flexible'
import { NextFunction, Request, Response } from 'express'
import { config } from '../../config.js'
import { GENERAL } from '../../constants/errors.js'

const globalRateLimiter = new RateLimiterMemory({
  points: config.RATE_LIMIT_PER_SECOND,
  duration: 1,
})

export class HttpRateLimiter {
  public static async limitRequestsForUser(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { account } = res.locals
    if (!account) {
      console.error('Rate limiter middleware set on a route without auth')
      return res.status(403).send({ error: GENERAL.FORBIDDEN })
    }

    try {
      await globalRateLimiter.consume(account.id)
      next()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('too many requests')

      return res.status(429).send({ error: GENERAL.TOO_MANY_REQUESTS })
    }
  }
}
