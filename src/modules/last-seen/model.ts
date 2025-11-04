import { DataTypes, Model, literal } from 'sequelize'
import { getModelConfig } from '../../utils/db.js'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { Account } from '../accounts/model.js'
import { Post } from '../posts/model.js'

export class LastSeenPost extends Model {
  declare id: string
  declare accountId: string
  declare postId: string
  declare lastSeenAt: Date
  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.LAST_SEEN_POSTS)
  LastSeenPost.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: literal('gen_random_uuid()'),
        primaryKey: true,
      },
      accountId: {
        type: DataTypes.UUID,
        references: {
          model: DATABASE_MODELS.ACCOUNTS,
          key: 'id',
        },
      },
      postId: {
        type: DataTypes.UUID,
        references: {
          model: DATABASE_MODELS.POSTS,
          key: 'id',
        },
      },
      lastSeenAt: {
        type: DataTypes.DATE,
        allowNull: false,
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
  LastSeenPost.belongsTo(Account, {
    foreignKey: 'accountId',
    as: 'seenBy',
  })
  LastSeenPost.belongsTo(Post, {
    foreignKey: 'postId',
    as: 'seenPost',
  })
}
