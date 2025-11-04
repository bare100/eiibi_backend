import { Request, Response } from 'express'
import { GENERAL } from '../../constants/errors.js'
import { LastSeenPostsRepository } from './repository.js'

export class LastSeenPostsController {
  public static async getLastSeenByAccount(req: Request, res: Response) {
    const { page = 0, perPage = 10 } = req.params

    try {
      const lastSeenPosts = await LastSeenPostsRepository.getLastSeenByAccount(
        res.locals.account.id,
        {
          page: parseInt(page.toString()),
          perPage: parseInt(perPage.toString()),
        }
      )

      return res.status(200).json(lastSeenPosts)
    } catch (error) {
      console.error('Cannot get last seen posts', error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async storeLastSeen(req: Request, res: Response) {
    const { postId } = req.body

    try {
      await LastSeenPostsRepository.storeLastSeenPost(res.locals.account.id, postId)

      return res.status(200).send()
    } catch (error) {
      console.error('Cannot store last seen post', error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }
}
