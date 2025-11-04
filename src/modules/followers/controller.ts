import { Request, Response } from 'express'
import { Follower } from './model.js'
import { GENERAL } from '../../constants/errors.js'
import { FollowersRepository } from './repository.js'
import { FCMNotificationService } from '../../lib/notifications/index.js'

export class FollowersController {
  public static async followAccount(req: Request, res: Response) {
    const { account } = res.locals
    const { accountId } = req.params

    try {
      if (account.id === accountId) {
        return res.status(400).send({ error: GENERAL.BAD_REQUEST })
      }

      const alreadyFollowing = await Follower.count({
        where: { followingId: accountId, followerId: account.id },
      })

      if (alreadyFollowing) {
        return res.status(400).send({ error: GENERAL.BAD_REQUEST })
      }

      await Follower.create({ followingId: accountId, followerId: account.id })
      FCMNotificationService.sendNewFollower(account, accountId)

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async getFollowingForAccount(req: Request, res: Response) {
    const { accountId, page = 0, perPage = 20 } = req.params

    try {
      const following =
        await FollowersRepository.getFollowingForAccountPaginated(
          accountId,
          parseInt(page.toString()),
          parseInt(perPage.toString())
        )

      return res.status(200).json(following)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async getFollowersForAccount(req: Request, res: Response) {
    const { accountId, page = 0, perPage = 20 } = req.params

    try {
      const followers =
        await FollowersRepository.getFollowersForAccountPaginated(
          accountId,
          parseInt(page.toString()),
          parseInt(perPage.toString())
        )

      return res.status(200).json(followers)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async unfollowAccount(req: Request, res: Response) {
    const { account } = res.locals
    const { accountId } = req.params

    try {
      await Follower.destroy({
        where: { followingId: accountId, followerId: account.id },
      })

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }
}
