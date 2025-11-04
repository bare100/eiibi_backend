import { Request, Response } from 'express'
import { GENERAL } from '../../constants/errors.js'
import { PostMapClustersRepository as PostMapClustersRepository } from './repository.js'
import { Op } from 'sequelize'

export class PostMapClustersController {
  public static async getAll(req: Request, res: Response) {
    try {
      const postMapClusters = await PostMapClustersRepository.findAll({
        where: {
          expiresAt: {
            [Op.gte]: new Date(),
          },
        },
      })
      return res.status(200).send(postMapClusters)
    } catch (error) {
      console.error(`Could not get all post map clusters`, error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }
}
