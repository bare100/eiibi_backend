import { Model, DataTypes } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { Post } from '../posts/model.js'
import { getModelConfig } from '../../utils/db.js'
import { Asset } from '../assets/model.js'
import { ChatGroup } from '../chat/model.js'

export class ChatGroupPost extends Model {
  declare postId: string
  declare chatGroupId: string

  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  declare readonly asset: Asset

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.CHAT_GROUP_POSTS)
  ChatGroupPost.init(
    {
      postId: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      chatGroupId: {
        type: DataTypes.UUID,
        primaryKey: true,
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
  ChatGroupPost.belongsTo(Post, {
    foreignKey: 'postId',
    onDelete: 'cascade',
  })
  ChatGroupPost.belongsTo(ChatGroup, {
    foreignKey: 'chatGroupId',
    onDelete: 'cascade',
    as: 'chatGroup',
  })
}
