import { Model, DataTypes } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { Post } from '../posts/model.js'
import { getModelConfig } from '../../utils/db.js'
import { Asset } from '../assets/model.js'

export class PostAsset extends Model {
  declare postId: string
  declare assetId: string

  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  declare readonly asset: Asset

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.POST_ASSETS)
  PostAsset.init(
    {
      postId: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      assetId: {
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
  PostAsset.belongsTo(Post, {
    foreignKey: 'postId',
    onDelete: 'cascade',
  })
  PostAsset.belongsTo(Asset, {
    foreignKey: 'assetId',
    onDelete: 'cascade',
    as: 'asset',
  })
}
