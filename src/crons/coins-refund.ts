// This cron will run every hour, checking if there are any
// posts that have expired.
// If so, it will refund the coins to the post owner
import { schedule } from 'node-cron'
import { Post } from '../modules/posts/model.js'
import { literal, Op } from 'sequelize'
import { Account } from '../modules/accounts/model.js'
import { DatabaseConnection } from '../database/index.js'
import { PostHistoryEvent } from '../modules/auxiliary-models/post-history-events.js'

export const runCoinsRefundCron = () => {
  refundCoins()

  schedule('0 * * * *', () => {
    refundCoins()
  })
}

const refundCoins = async () => {
  const expiredPosts = await Post.findAll({
    where: {
      paidCoins: { [Op.gt]: 0 },
      coinsPaidBack: false,
      markedAsClosedAt: null,
    },
  })

  if (!expiredPosts.length) {
    return
  }

  const transaction = await DatabaseConnection.getInstance().transaction()

  try {
    for (const post of expiredPosts) {
      // Not using increment, so that the "afterUpdate" hook is triggered
      await Account.update(
        { coins: literal(`coins + ${post.paidCoins}`) },
        { where: { id: post.accountId }, transaction }
      )

      await Post.update({ coinsPaidBack: true }, { where: { id: post.id }, transaction })

      await PostHistoryEvent.create(
        {
          postId: post.id,
          type: 'coins_refunded',
          details: {},
        },
        { transaction }
      )
    }

    await transaction.commit()
  } catch (error) {
    console.error('Error refunding coins', error)
    await transaction.rollback()
    return
  }
}
