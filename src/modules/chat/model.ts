import { DataTypes, Model, literal } from 'sequelize'
import { getModelConfig } from '../../utils/db.js'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { Account } from '../accounts/model.js'
import { ChatMessage } from '../auxiliary-models/chat-message.js'
import { Post } from '../posts/model.js'

export class ChatGroup extends Model {
  declare id: string
  declare firstAccountId: string
  declare secondAccountId: string
  declare initiatedBy: string
  declare lastMessageAt: Date

  declare unlockedChatBy: string
  declare unlockedChatAt: Date
  declare paidCoinsToUnlockChat: number

  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  declare readonly messages: ChatMessage[]
  declare readonly chatGroupPosts: Post[]

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.CHAT_GROUPS)
  ChatGroup.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: literal('gen_random_uuid()'),
        primaryKey: true,
      },
      firstAccountId: {
        type: DataTypes.UUID,
        references: {
          model: DATABASE_MODELS.ACCOUNTS,
          key: 'id',
        },
        allowNull: false,
      },
      secondAccountId: {
        type: DataTypes.UUID,
        references: {
          model: DATABASE_MODELS.ACCOUNTS,
          key: 'id',
        },
        allowNull: false,
      },
      lastMessageAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      initiatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      unlockedChatBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      unlockedChatAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      paidCoinsToUnlockChat: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    modelConfig
  )
}

function initAssociations() {
  ChatGroup.belongsTo(Account, {
    foreignKey: 'firstAccountId',
    as: 'firstAccount',
  })
  ChatGroup.belongsTo(Account, {
    foreignKey: 'secondAccountId',
    as: 'secondAccount',
  })
  ChatGroup.hasMany(ChatMessage, {
    foreignKey: 'chatGroupId',
    as: 'messages',
  })

  ChatGroup.belongsToMany(Post, {
    through: { model: DATABASE_MODELS.CHAT_GROUP_POSTS },
    foreignKey: 'chatGroupId',
    otherKey: 'postId',
    as: 'chatGroupPosts',
  })
}
