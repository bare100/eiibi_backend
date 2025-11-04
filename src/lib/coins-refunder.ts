import { Transaction } from 'sequelize'
import { Post } from '../modules/posts/model.js'
import { Account } from '../modules/accounts/model.js'

class CoinsRefunder {
  handleDeletePostRefund = async (postId: string, transaction: Transaction) => {
    // Refund coins to the post creator if there were any spent and no bids were made
    const postDetails = await Post.findByPk(postId, { transaction })
    if (postDetails.paidCoins > 0 && !postDetails.coinsPaidBack) {
      const account = await Account.findByPk(postDetails.accountId, {
        transaction,
      })

      if (!account) {
        return
      }

      account.coins += postDetails.paidCoins
      await account.save({ transaction })
    }
  }
}

const coinsRefunder = new CoinsRefunder()
export { coinsRefunder as CoinsRefunder }
