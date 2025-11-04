import { Request, Response } from 'express'
import { PostSimilarityRepository } from './repository.js'
import { GENERAL } from '../../constants/errors.js'

export class PostSimilaritiesController {
  public static async getRecommendations(req: Request, res: Response) {
    const { account } = res.locals
    const { page = 0, perPage = 20 } = req.body

    try {
      const posts = await PostSimilarityRepository.getRecommendations(account, {
        page,
        perPage,
      })

      return res.status(200).json(posts)
    } catch (error) {
      console.error('Cannot get recommendations', error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async getSimilarPosts(req: Request, res: Response) {
    const { postId, page = 0, perPage = 20 } = req.body

    try {
      const posts = await PostSimilarityRepository.getSimilarPosts(postId, {
        page,
        perPage,
      })

      return res.status(200).json(posts)
    } catch (error) {
      console.error('Cannot get similar posts', error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }
}
