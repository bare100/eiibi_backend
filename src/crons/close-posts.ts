// This cron will run every hour, checking if there are any
// posts that have expired.
// If so, it will mark the post as closed
import { schedule } from 'node-cron'
import { Post } from '../modules/posts/model.js'
import { Op } from 'sequelize'
import { DatabaseConnection } from '../database/index.js'
import { PostHistoryEvent } from '../modules/auxiliary-models/post-history-events.js'

export const runClosePostsCron = () => {
  closePosts()

  schedule('0 * * * *', () => {
    closePosts()
  })
}

const closePosts = async () => {
  const expiredPosts = await Post.findAll({
    where: {
      expiresAt: {
        [Op.lt]: new Date(),
      },
      markedAsClosedAt: null,
    },
  })

  if (!expiredPosts.length) {
    return
  }

  const transaction = await DatabaseConnection.getInstance().transaction()

  try {
    for (const post of expiredPosts) {
      await Post.update({ markedAsClosedAt: new Date() }, { where: { id: post.id }, transaction })

      await PostHistoryEvent.create(
        {
          postId: post.id,
          type: 'marked_as_closed_system',
          details: {},
        },
        { transaction }
      )
    }

    await transaction.commit()
  } catch (error) {
    console.error('Error closing posts', error)
    await transaction.rollback()
    return
  }
}
