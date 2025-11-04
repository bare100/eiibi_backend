import { DataTypes, Model, literal } from 'sequelize'
import { getModelConfig } from '../../utils/db.js'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { Account } from '../accounts/model.js'
import { ChatGroup } from '../chat/model.js'

export class ChatMessage extends Model {
  declare id: string
  declare chatGroupId: string
  declare fromAccountId: string
  declare message: string
  declare seenAt: Date
  declare type: string
  declare assetIds: string[]
  declare assetPaths: string[]
  declare latitude?: string
  declare longitude?: string
  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.CHAT_MESSAGES)
  ChatMessage.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: literal('gen_random_uuid()'),
        primaryKey: true,
      },
      chatGroupId: {
        type: DataTypes.UUID,
        references: {
          model: DATABASE_MODELS.CHAT_GROUPS,
          key: 'id',
        },
        allowNull: false,
      },
      fromAccountId: {
        type: DataTypes.UUID,
        references: {
          model: DATABASE_MODELS.ACCOUNTS,
          key: 'id',
        },
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING,
        defaultValue: 'text',
      },
      assetIds: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      assetPaths: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      latitude: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      longitude: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      seenAt: {
        type: DataTypes.DATE,
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
  ChatMessage.belongsTo(Account, {
    foreignKey: 'fromAccountId',
    as: 'fromAccount',
  })
  ChatMessage.belongsTo(ChatGroup, {
    foreignKey: 'chatGroupId',
    as: 'chatGroup',
  })
}
