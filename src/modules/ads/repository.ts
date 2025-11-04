import { Transaction } from 'sequelize'
import { DatabaseConnection } from '../../database/index.js'
import { GenericRepository } from '../../lib/base-repository.js'
import { RewardAd } from './model.js'
import { Account } from '../accounts/model.js'
import { Settings } from '../settings/model.js'

class RewardAdRepository extends GenericRepository<RewardAd> {
  constructor() {
    super(RewardAd)
  }

  public async giveReward(adId: string) {
    return await DatabaseConnection.getInstance().transaction(
      async (transaction: Transaction) => {
        const rewardAd = await this.getOneById(adId, transaction)
        if (!rewardAd) {
          throw new Error('Reward ad not found')
        }

        rewardAd.rewardGiven = true
        await rewardAd.save({ transaction })

        const [account, settings] = await Promise.all([
          Account.findByPk(rewardAd.accountId, { transaction }),
          Settings.findOne({ transaction }),
        ])

        if (!account) {
          throw new Error('Account not found')
        }

        const coinsToAdd = settings.rewardCoinsForWatchingAd ?? 1
        account.coins += coinsToAdd
        await account.save({ transaction })

        return account.coins
      }
    )
  }
}

const rewardAdRepositoryInstance = new RewardAdRepository()
Object.freeze(rewardAdRepositoryInstance)

export { rewardAdRepositoryInstance as RewardAdRepository }
