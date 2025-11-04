import { Request, NextFunction } from 'express'
import NodeCache from 'node-cache'

const cache = new NodeCache({
  stdTTL: 60 * 60 * 1, // 1 hour
})

export const cacheMiddleware = (req: Request, res, next: NextFunction) => {
  const { originalUrl } = req
  const cacheKey = `__express_cache__${originalUrl}`

  try {
    const data = cache.get(cacheKey)

    if (data) {
      try {
        const cachedJSON = JSON.parse(data as string)
        return res.json(cachedJSON)
      } catch (error) {
        console.error(`Could not parse cached data`, error)
        cache.del(cacheKey)
        return next()
      }
    }

    const originalJSON = res.json.bind(res)
    res.json = (data) => {
      cache.set(cacheKey, JSON.stringify(data))
      originalJSON(data)
    }
    return next()
  } catch (error) {
    return next()
  }
}

export const setDataInCache = (key: string, data: any) => {
  cache.set(key, JSON.stringify(data))
}

export const deleteDataFromCache = (key: string) => {
  cache.del(key)
}

export const getDataFromCache = (key: string) => {
  try {
    const data = cache.get(key)
    const result = data ? JSON.parse(data as string) : null
    if (!result) {
      return null
    }

    if (Array.isArray(result) && !result.length) {
      return null
    }

    return result
  } catch (error) {
    console.error(`[REDIS] Could not get data from cache`, error)
    return null
  }
}
