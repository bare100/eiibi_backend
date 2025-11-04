import { RateLimiterMemory } from 'rate-limiter-flexible'
import { NextFunction, Request, Response } from 'express'
import { config } from '../../config.js'
import { GENERAL } from '../../constants/errors.js'

const globalRateLimiter = new RateLimiterMemory({
  points: config.IP_RATE_LIMIT_PER_SECOND,
  duration: 1,
})

export class HttpIPRateLimiter {
  public static async limitRequestsForUser(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      await globalRateLimiter.consume(req.ip)
      next()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('too many requests')

      return res.status(429).send({ error: GENERAL.TOO_MANY_REQUESTS })
    }
  }
}
