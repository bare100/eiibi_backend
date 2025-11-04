import { Request, Response } from 'express'
import { GENERAL } from '../../constants/errors.js'
import { CommentsRepository } from './repository.js'
import { Comment } from './entity.js'
import { FCMNotificationService } from '../../lib/notifications/index.js'
import { TranslationManager } from '../../lib/translation-manager.js'

export class CommentsController {
  public static async countForPost(req: Request, res: Response) {
    const { postId } = req.params

    try {
      const count = await CommentsRepository.countForPost(postId)

      return res.status(200).json(count)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async translateContent(req: Request, res: Response) {
    const { commentId, lang } = req.params

    try {
      const comment = await Comment.findByPk(commentId)
      if (!comment) {
        return res.status(500).send({ error: GENERAL.BAD_REQUEST })
      }

      const { content } = comment
      const translated = await TranslationManager.translate(content, lang)

      return res.status(200).json({ content: translated })
    } catch (error) {
      console.error('Cannot translate comment', error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async loadForPost(req: Request, res: Response) {
    const { postId } = req.params

    try {
      const comments = await CommentsRepository.getAllForPost(postId)

      return res.status(200).json(comments)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async deleteComment(req: Request, res: Response) {
    const { account } = res.locals
    const { commentId } = req.params

    try {
      const comment = await Comment.findByPk(commentId)
      if (!comment) {
        return res.status(404).send({ error: GENERAL.NOT_FOUND })
      }

      if (comment.accountId !== account.id) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      await CommentsRepository.deleteComment(commentId)
      return res.status(200).json({ success: true })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async create(req: Request, res: Response) {
    const { account } = res.locals

    try {
      if (!account.email) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      const { postId, content, parentCommentId } = req.body
      if (!postId) {
        return res.status(500).send({ error: GENERAL.BAD_REQUEST })
      }

      if (!content) {
        return res.status(500).send({ error: GENERAL.BAD_REQUEST })
      }

      const comment = await CommentsRepository.createAndReturnWithDetails({
        accountId: account.id,
        postId,
        content,
        parentCommentId,
      })

      if (!comment) {
        return res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
      }

      if (parentCommentId) {
        const parentComment = await Comment.findByPk(parentCommentId)
        if (parentComment && parentComment.accountId !== account.id) {
          FCMNotificationService.sendCommentReply(postId, parentComment.accountId, account.id)
        }
      } else {
        FCMNotificationService.sendNewCommentOnPost(postId, account.id)
        FCMNotificationService.sendCommentOnSamePost(postId, account.id)
      }

      return res.status(200).json(comment)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }
}
