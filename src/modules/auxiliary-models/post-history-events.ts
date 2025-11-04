import { Model, DataTypes, literal } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { Post } from '../posts/model.js'
import { getModelConfig } from '../../utils/db.js'
import { Asset } from '../assets/model.js'

export class PostHistoryEvent extends Model {
  declare id: string
  declare postId: string
  declare type: string
  declare details: Record<string, unknown>

  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  declare readonly asset: Asset

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.POST_HISTORY_EVENTS)
  PostHistoryEvent.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: literal('gen_random_uuid()'),
        primaryKey: true,
      },
      postId: {
        type: DataTypes.UUID,
        references: {
          model: DATABASE_MODELS.POSTS,
          key: 'id',
        },
        primaryKey: true,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      details: {
        type: DataTypes.JSONB,
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
  PostHistoryEvent.belongsTo(Post, {
    foreignKey: 'postId',
    onDelete: 'cascade',
  })
}
