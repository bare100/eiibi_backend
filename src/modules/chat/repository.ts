import { literal, Op, Transaction } from 'sequelize'
import { GenericRepository } from '../../lib/base-repository.js'
import { ChatGroup } from './model.js'
import { Account } from '../accounts/model.js'
import { ChatMessage } from '../auxiliary-models/chat-message.js'
import { DatabaseConnection } from '../../database/index.js'
import { Asset } from '../assets/model.js'
import { AssetsRepository } from '../assets/repository.js'
import { ChatGroupPost } from '../auxiliary-models/chat-group-posts.js'
import { Post } from '../posts/model.js'
import { DATABASE_MODELS } from '../../constants/model-names.js'

class ChatGroupRepository extends GenericRepository<ChatGroup> {
  constructor() {
    super(ChatGroup)
  }

  public async createChatGroup(firstAccountId: string, secondAccountId: string, postId?: string) {
    return await DatabaseConnection.getInstance().transaction(async (transaction: Transaction) => {
      const chatGroup = new ChatGroup({
        firstAccountId,
        secondAccountId,
        initiatedBy: firstAccountId,
      })

      const savedGroup = await chatGroup.save({ transaction })
      if (postId) {
        const chatGroupPost = new ChatGroupPost({
          postId,
          chatGroupId: savedGroup.id,
        })
        await chatGroupPost.save({ transaction })
      }
      return savedGroup
    })
  }

  public async findChatGroupById(id: string) {
    return ChatGroup.findOne({
      where: { id },
      include: [
        {
          model: Account,
          as: 'firstAccount',
          attributes: ['id', 'name', 'email', 'picture', 'verified'],
          include: [{ model: Asset, as: 'asset' }],
        },
        {
          model: Account,
          as: 'secondAccount',
          attributes: ['id', 'name', 'email', 'picture', 'verified'],
          include: [{ model: Asset, as: 'asset' }],
        },
        {
          model: Post,
          attributes: [
            'id',
            'title',
            'description',
            'mainCategoryId',
            'subCategoryId',
            'createdAt',
            'updatedAt',
          ],
          as: 'chatGroupPosts',
          include: [{ model: Asset, as: 'postAssets' }],
          through: { attributes: ['createdAt'] },
          order: [[DATABASE_MODELS.CHAT_GROUP_POSTS, 'createdAt', 'DESC']],
        },
      ],
      order: [
        [literal(`"chatGroupPosts->${DATABASE_MODELS.CHAT_GROUP_POSTS}"."createdAt"`), 'DESC'],
      ],
    })
  }

  public async getChatGroupById(id: string) {
    return ChatGroup.findOne({
      where: { id },
      include: [
        {
          model: Account,
          as: 'firstAccount',
          attributes: ['id', 'name', 'email', 'picture', 'verified'],
          include: [{ model: Asset, as: 'asset' }],
        },
        {
          model: Account,
          as: 'secondAccount',
          attributes: ['id', 'name', 'email', 'picture', 'verified'],
          include: [{ model: Asset, as: 'asset' }],
        },
      ],
    })
  }

  public async getActiveChatsForAccount(accountId: string) {
    return ChatGroup.findAll({
      where: {
        [Op.or]: [{ firstAccountId: accountId }, { secondAccountId: accountId }],
        closesAt: { [Op.gt]: new Date() },
      },
    })
  }

  public async deleteMessagesForGroup(chatGroupId: string, messageIds: string[]) {
    return await DatabaseConnection.getInstance().transaction(async (transaction: Transaction) => {
      const assetTypeMessages = await ChatMessage.findAll({
        where: { chatGroupId, id: { [Op.in]: messageIds }, type: 'assets' },
      })
      if (assetTypeMessages.length) {
        const assetIds = assetTypeMessages.map((message) => message.assetIds).flat()
        for (const assetId of assetIds) {
          await AssetsRepository.removeAsset(assetId, transaction)
        }
      }

      await ChatMessage.destroy({
        where: { chatGroupId, id: { [Op.in]: messageIds } },
        transaction,
      })

      const latestMessageFromGroup = await ChatMessage.findOne({
        where: { chatGroupId },
        order: [['createdAt', 'DESC']],
      })

      await ChatGroup.update(
        { lastMessageAt: latestMessageFromGroup.createdAt },
        { where: { id: chatGroupId }, transaction }
      )
    })
  }

  public async unlockChat(chatGroupId: string, accountId: string, cost: number) {
    return await DatabaseConnection.getInstance().transaction(async (transaction: Transaction) => {
      await ChatGroup.update(
        { unlockedChatBy: accountId, unlockedChatAt: new Date(), paidCoinsToUnlockChat: cost },
        { where: { id: chatGroupId }, transaction }
      )

      await Account.decrement('coins', {
        where: { id: accountId },
        by: cost,
        transaction,
      })
    })
  }

  public async markMessagesAsSeen(chatGroupId: string, accountId: string) {
    return ChatMessage.update(
      { seenAt: new Date() },
      { where: { chatGroupId, fromAccountId: { [Op.ne]: accountId } } }
    )
  }

  public async getMessagesForGroup(chatGroupId: string, page: number, perPage: number) {
    return ChatMessage.findAll({
      where: { chatGroupId },
      offset: page * perPage,
      limit: perPage,
      order: [['createdAt', 'DESC']],
    })
  }

  public async getForAccount(accountId: string) {
    const chatGroups = await ChatGroup.findAll({
      where: {
        [Op.or]: [{ firstAccountId: accountId }, { secondAccountId: accountId }],
      },
      include: [
        {
          model: Account,
          as: 'firstAccount',
          attributes: ['id', 'name', 'email', 'picture', 'verified'],
          include: [{ model: Asset, as: 'asset' }],
        },
        {
          model: Account,
          as: 'secondAccount',
          attributes: ['id', 'name', 'email', 'picture', 'verified'],
          include: [{ model: Asset, as: 'asset' }],
        },
        {
          model: Post,
          attributes: [
            'id',
            'title',
            'description',
            'mainCategoryId',
            'subCategoryId',
            'createdAt',
            'updatedAt',
          ],
          as: 'chatGroupPosts',
          include: [{ model: Asset, as: 'postAssets' }],
          through: { attributes: ['createdAt'] },
          order: [[DATABASE_MODELS.CHAT_GROUP_POSTS, 'createdAt', 'DESC']],
        },
      ],
      order: [
        [literal(`"chatGroupPosts->${DATABASE_MODELS.CHAT_GROUP_POSTS}"."createdAt"`), 'DESC'],
      ],
    })

    for (const chatGroup of chatGroups) {
      const unreadMessagesFromGroup = await ChatMessage.count({
        where: {
          chatGroupId: chatGroup.id,
          fromAccountId: { [Op.ne]: accountId },
          seenAt: null,
        },
      })

      chatGroup.setDataValue('unreadMessages', unreadMessagesFromGroup)
    }

    return chatGroups
  }

  public async getForTwoAccounts(firstAccountId: string, secondAccountId: string) {
    return ChatGroup.findOne({
      where: {
        [Op.and]: [
          {
            [Op.or]: [{ firstAccountId: firstAccountId }, { secondAccountId: firstAccountId }],
          },
          {
            [Op.or]: [{ firstAccountId: secondAccountId }, { secondAccountId: secondAccountId }],
          },
        ],
      },
      include: [
        {
          model: Account,
          as: 'firstAccount',
          attributes: ['id', 'name', 'email', 'picture', 'verified'],
        },
        {
          model: Account,
          as: 'secondAccount',
          attributes: ['id', 'name', 'email', 'picture', 'verified'],
        },
        {
          model: Post,
          attributes: [
            'id',
            'title',
            'description',
            'mainCategoryId',
            'subCategoryId',
            'createdAt',
            'updatedAt',
          ],
          as: 'chatGroupPosts',
          include: [{ model: Asset, as: 'postAssets' }],
          through: { attributes: ['createdAt'] },
          order: [[DATABASE_MODELS.CHAT_GROUP_POSTS, 'createdAt', 'DESC']],
        },
      ],
      order: [
        [literal(`"chatGroupPosts->${DATABASE_MODELS.CHAT_GROUP_POSTS}"."createdAt"`), 'DESC'],
      ],
    })
  }

  public async createAssetsMessage(message: Partial<ChatMessage>, assets: Express.Multer.File[]) {
    return await DatabaseConnection.getInstance().transaction(async (transaction: Transaction) => {
      const createdAt = new Date()

      const assetPromises = assets.map((asset) => {
        return AssetsRepository.storeAsset(asset, transaction)
      })

      const storedAssets = await Promise.all(assetPromises)
      const assetIds = storedAssets.map((asset) => asset.id)
      const assetPaths = storedAssets.map((asset) => asset.path)

      return await this.createMessage(
        { ...message, assetIds, assetPaths, createdAt, type: 'assets' },
        transaction,
        false
      )
    })
  }

  public async createMessage(
    message: Partial<ChatMessage>,
    transaction?: Transaction,
    commitTransaction = true
  ) {
    transaction = transaction || (await DatabaseConnection.getInstance().transaction())
    try {
      const createdAt = new Date()
      const {
        id,
        fromAccountId,
        assetIds,
        assetPaths,
        type = 'text',
        chatGroupId,
        latitude,
        longitude,
      } = message
      const createdMessage = await ChatMessage.create(
        {
          id,
          message: message.message,
          type,
          assetIds,
          assetPaths,
          fromAccountId,
          chatGroupId,
          createdAt,
          latitude,
          longitude,
        },
        { transaction }
      )

      await ChatGroup.update(
        { lastMessageAt: createdAt },
        { where: { id: chatGroupId }, transaction }
      )

      if (commitTransaction) {
        await transaction.commit()
      }

      return createdMessage
    } catch (error) {
      if (commitTransaction) {
        console.error('Could not commit transaction - create message', error)
        await transaction.rollback()
      } else {
        throw error
      }
    }
  }

  public async addPostToChatGroup(chatGroupId: string, postId: string) {
    const alreadyExists = await ChatGroupPost.findOne({ where: { chatGroupId, postId } })
    if (alreadyExists) {
      return false
    }
    await ChatGroupPost.create({ chatGroupId, postId })
    return true
  }

  public async getForAccounts(firstAccountId: string, secondAccountId: string) {
    return ChatGroup.findOne({
      where: {
        [Op.or]: [
          {
            [Op.and]: [{ firstAccountId: firstAccountId }, { secondAccountId: secondAccountId }],
          },
          {
            [Op.and]: [{ firstAccountId: secondAccountId }, { secondAccountId: firstAccountId }],
          },
        ],
      },
      include: [
        {
          model: Post,
          attributes: [
            'id',
            'title',
            'description',
            'mainCategoryId',
            'subCategoryId',
            'createdAt',
            'updatedAt',
          ],
          as: 'chatGroupPosts',
          include: [{ model: Asset, as: 'postAssets' }],
          through: { attributes: ['createdAt'] },
          order: [[DATABASE_MODELS.CHAT_GROUP_POSTS, 'createdAt', 'DESC']],
        },
      ],
    })
  }
}

const chatGroupRepositoryInstance = new ChatGroupRepository()
Object.freeze(chatGroupRepositoryInstance)

export { chatGroupRepositoryInstance as ChatGroupRepository }
