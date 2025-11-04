import { Request, Response } from 'express'
import { GENERAL } from '../../constants/errors.js'
import { Favourite } from './model.js'
import { Post } from '../posts/model.js'
import { FavouritesRepository } from './repository.js'
import { FCMNotificationService } from '../../lib/notifications/index.js'
import { PostsRepository } from '../posts/repository.js'
import { generateNameForAccount } from '../../lib/notifications/utils.js'

export class FavouritesController {
  public static async loadForAccount(req: Request, res: Response) {
    const { account } = res.locals

    try {
      const posts = await FavouritesRepository.getFavouritesByAccountId(account.id)
      return res.status(200).json(posts)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async getAccountsWhoAddedPostToFavourites(req: Request, res: Response) {
    const { postId, page, perPage } = req.params

    try {
      if (!postId) {
        return res.status(400).send({ error: GENERAL.BAD_REQUEST })
      }

      const post = await Post.findByPk(postId)
      if (!post) {
        return res.status(400).send({ error: GENERAL.BAD_REQUEST })
      }

      const accounts = await FavouritesRepository.getAccountsWhoAddedPostToFavourites(
        postId,
        page ? parseInt(page) : 0,
        perPage ? parseInt(perPage) : 20
      )
      return res.status(200).json(accounts)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async addToFavourites(req: Request, res: Response) {
    const { account } = res.locals
    const { postId } = req.params

    try {
      if (!postId) {
        return res.status(400).send({ error: GENERAL.BAD_REQUEST })
      }

      const post = await Post.findByPk(postId)
      if (!post) {
        return res.status(400).send({ error: GENERAL.BAD_REQUEST })
      }

      await FavouritesRepository.create({ accountId: account.id, postId: postId })
      if (account.email) {
        FCMNotificationService.sendPostAddedToFavourites(account, post)
      }

      PostsRepository.storeHistoryEvent(postId, 'add-to-favourites', {
        accountName: generateNameForAccount(account),
        accountId: account.id,
      })

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async removeFromFavourites(req: Request, res: Response) {
    const { account } = res.locals
    const { postId } = req.params

    try {
      if (!postId) {
        return res.status(400).send({ error: GENERAL.BAD_REQUEST })
      }

      await Favourite.destroy({ where: { accountId: account.id, postId } })

      PostsRepository.storeHistoryEvent(postId, 'remove-from-favourites', {
        accountName: generateNameForAccount(account),
        accountId: account.id,
      })

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }
}
