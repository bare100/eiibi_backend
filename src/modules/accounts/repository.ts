import { Op, Transaction } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { DatabaseConnection } from '../../database/index.js'
import { GenericRepository } from '../../lib/base-repository.js'
import { PaginatedQueryParams } from '../../types.js'
import { generateAnonymousEmail } from '../../utils/generic.js'
import { Account } from './model.js'
import { Follower } from '../followers/model.js'
import { Report } from '../reports/model.js'
import { Favourite } from '../favourites/model.js'
import { ChatMessage } from '../auxiliary-models/chat-message.js'
import { ChatGroup } from '../chat/model.js'
import { SearchHistoryItem } from '../search-history/model.js'
import { Notification } from '../notifications/model.js'
import { Post } from '../posts/model.js'
import { PostsRepository } from '../posts/repository.js'
import { AssetsRepository } from '../assets/repository.js'
import { Asset } from '../assets/model.js'
import { LastSeenPost } from '../last-seen/model.js'
import { PostSimilarity } from '../post-similarities/model.js'
import { PushSubscription } from '../auxiliary-models/push-subscription.js'
import { ChatGroupPost } from '../auxiliary-models/chat-group-posts.js'
import { Comment } from '../comments/entity.js'
import { SettingsRepository } from '../settings/repository.js'

class AccountsRepository extends GenericRepository<Account> {
  constructor() {
    super(Account)
  }

  public async getOneWithDetails(accountId: string) {
    return await Account.findByPk(accountId, {
      attributes: ['id', 'name', 'email', 'picture', 'verified'],
      include: [{ model: Asset, as: 'asset' }],
    })
  }

  public async findOneOrCreate(
    authId: string,
    accountData: Partial<Account>,
    identities: Record<string, string[]>,
    phone?: string
  ) {
    const result = await Account.findOne({
      where: { authId },
      include: [
        {
          model: Asset,
          as: 'asset',
        },
      ],
    })

    if (result?.id) {
      return result
    }

    const settings = await SettingsRepository.get()

    const accountEmail = accountData.email ?? generateAnonymousEmail()
    await Account.create({
      ...accountData,
      email: accountEmail,
      isAnonymous: !accountData.email,
      picture: `https://icotar.com/avatar/${accountEmail}.png`,
      selectedCurrencyId: settings?.defaultCurrencyId,
      phone,
    })

    return this.findOneOrCreate(authId, accountData, identities, phone)
  }

  public async getStats(accountId: string) {
    const posts = await Post.findAll({
      where: { accountId },
      attributes: ['id', 'expiresAt', 'markedAsClosedAt'],
    })

    const now = new Date()

    const activePosts = posts.filter((post) => post.expiresAt > now && !post.markedAsClosedAt)
    const closedPosts = posts.filter((post) => post.expiresAt <= now || post.markedAsClosedAt)

    return {
      posts: posts.length,
      activePosts: activePosts.length,
      closedPosts: closedPosts.length,
    }
  }

  public async search(paginationParams: PaginatedQueryParams) {
    const { query, page, perPage } = paginationParams

    const QUERY = `
      SELECT ${DATABASE_MODELS.ACCOUNTS}.id, email, name, picture, verified, ${DATABASE_MODELS.ASSETS}.id as "assetId", ${DATABASE_MODELS.ASSETS}.path
      FROM ${DATABASE_MODELS.ACCOUNTS}
      LEFT JOIN ${DATABASE_MODELS.ASSETS} ON ${DATABASE_MODELS.ACCOUNTS}."assetId" = ${DATABASE_MODELS.ASSETS}.id
      WHERE name ILIKE $1 OR email ILIKE $1  
      ORDER BY POSITION($2::text IN name), name
      DESC
      LIMIT $3
      OFFSET $4
    `

    const result = await DatabaseConnection.getInstance().query(QUERY, {
      bind: [`%${query}%`, query, perPage, page * perPage],
    })

    return result[0].map((el) => {
      if (el.email) {
        const [localPart] = (el.email ?? '').split('@')
        el.email = `${localPart}@${'*'.repeat(7)}`
      }

      if (el.path) {
        el.asset = {
          path: el.path,
        }
      }

      return el
    })
  }

  public async hasVerificationRequest(accountId: string) {
    const result = await Account.findByPk(accountId, {
      attributes: ['verificationRequestedAt'],
    })

    return !!result?.verificationRequestedAt
  }

  public async requestVerification(accountId: string) {
    return await Account.update(
      { verificationRequestedAt: new Date() },
      {
        where: { id: accountId },
      }
    )
  }

  public async blockAccount(currentAccountId: string, accountToBlock: string) {
    return await DatabaseConnection.getInstance().transaction(async (transaction: Transaction) => {
      const existingAccount = await Account.findByPk(currentAccountId, {
        transaction,
      })

      const blockedAccounts = existingAccount?.blockedAccounts || []
      if (blockedAccounts.includes(accountToBlock)) {
        return
      }

      blockedAccounts.push(accountToBlock)

      await super.update(
        { id: currentAccountId },
        {
          blockedAccounts,
        },
        transaction
      )
    })
  }

  public async unblockAccount(currentAccountId: string, accountToUnblock: string) {
    return await DatabaseConnection.getInstance().transaction(async (transaction: Transaction) => {
      const existingAccount = await Account.findByPk(currentAccountId, {
        transaction,
      })

      const blockedAccounts = existingAccount?.blockedAccounts || []
      const index = blockedAccounts.indexOf(accountToUnblock)
      if (index === -1) {
        return
      }

      blockedAccounts.splice(index, 1)

      await super.update(
        { id: currentAccountId },
        {
          blockedAccounts,
        },
        transaction
      )
    })
  }

  public async deleteAccountData(
    accountId: string,
    transaction?: Transaction,
    commitTransaction = true
  ) {
    transaction = transaction || (await DatabaseConnection.getInstance().transaction())

    try {
      await PushSubscription.destroy({ where: { accountId }, transaction })

      await Follower.destroy({
        where: { [Op.or]: { followerId: accountId, followingId: accountId } },
        transaction,
      })

      await LastSeenPost.destroy({ where: { accountId }, transaction })

      await Report.update({ reportedBy: null }, { where: { reportedBy: accountId }, transaction })

      await Favourite.destroy({ where: { accountId }, transaction })

      await Comment.destroy({
        where: { accountId },
        transaction,
      })

      const chatGroups = await ChatGroup.findAll({
        where: {
          [Op.or]: { firstAccountId: accountId, secondAccountId: accountId },
        },
        attributes: ['id'],
        transaction,
      })

      const chatGroupIds = chatGroups.map((el) => el.id)
      const assetTypeMessages = await ChatMessage.findAll({
        where: {
          chatGroupId: { [Op.in]: chatGroupIds },
          type: 'assets',
        },
        transaction,
      })

      if (assetTypeMessages.length) {
        const assetsToRemove = assetTypeMessages.reduce((acc, el) => {
          acc.push(...el.assetIds)
          return acc
        }, [] as string[])

        for (const assetId of assetsToRemove) {
          await AssetsRepository.removeAsset(assetId, transaction)
        }
      }

      await ChatMessage.destroy({
        where: {
          chatGroupId: { [Op.in]: chatGroupIds },
        },
        transaction,
      })

      await ChatGroupPost.destroy({
        where: {
          chatGroupId: { [Op.in]: chatGroupIds },
        },
        transaction,
      })

      await ChatGroup.destroy({
        where: {
          id: { [Op.in]: chatGroupIds },
        },
        transaction,
      })

      await SearchHistoryItem.destroy({
        where: { accountId },
        transaction,
      })

      await Notification.destroy({
        where: { accountId },
        transaction,
      })

      const accountPosts = await Post.findAll({
        where: { accountId },
        attributes: ['id'],
        transaction,
      })

      const postIds = accountPosts.map((el) => el.id)
      await PostSimilarity.destroy({
        where: {
          [Op.or]: {
            postId1: { [Op.in]: postIds },
            postId2: { [Op.in]: postIds },
          },
        },
        transaction,
      })

      const postDeletePromises = postIds.map((postId) =>
        PostsRepository.deletePost(postId, transaction, false)
      )

      await Promise.all(postDeletePromises)

      await Account.destroy({ where: { id: accountId }, transaction })

      if (commitTransaction) {
        await transaction.commit()
      }
    } catch (error) {
      if (commitTransaction) {
        console.error('Coult not commit transaction - delete account', error)
        await transaction.rollback()
      } else {
        throw error
      }
    }
  }

  public async updateWithPreferences(
    account: Partial<Account>,
    profileAsset: Express.Multer.File | null
  ): Promise<Account> {
    return await DatabaseConnection.getInstance().transaction(async (transaction: Transaction) => {
      const existingAccount = await Account.findByPk(account.id as string, {
        transaction,
      })
      const existingMeta = existingAccount.meta

      await super.update(
        { id: account.id },
        {
          ...account,
          ...(account.meta ? { ...existingMeta, ...account.meta } : {}),
        },
        transaction
      )

      if (profileAsset) {
        await this.storeAccountAsset(profileAsset, account.id as string, transaction)
      }

      return await Account.findOne({
        where: { id: account.id },
        include: [
          {
            model: Asset,
            as: 'asset',
          },
        ],
        transaction,
      })
    })
  }

  private async storeAccountAsset(
    asset: Express.Multer.File,
    accountId: string,
    transaction: Transaction
  ) {
    const createdAsset = await AssetsRepository.storeAsset(asset, transaction)
    if (!createdAsset) {
      return
    }

    const existingAccount = await Account.findByPk(accountId, { transaction })
    await Account.update({ assetId: createdAsset.id }, { where: { id: accountId }, transaction })

    if (existingAccount.assetId) {
      await AssetsRepository.removeAsset(existingAccount.assetId, transaction)
    }
  }
}

const accountRepositoryInstance = new AccountsRepository()
Object.freeze(accountRepositoryInstance)

export { accountRepositoryInstance as AccountsRepository }
