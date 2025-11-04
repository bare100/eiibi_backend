import { Model, DataTypes } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { getModelConfig } from '../../utils/db.js'
import { Post } from '../posts/model.js'

export class PostSimilarity extends Model {
  declare postId1: string
  declare postId2: string
  declare similarity: number

  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  declare readonly firstPost: Post
  declare readonly secondPost: Post

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.POST_SIMILARITIES)

  PostSimilarity.init(
    {
      postId1: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      postId2: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      similarity: {
        type: DataTypes.FLOAT,
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
  PostSimilarity.belongsTo(Post, {
    foreignKey: 'postId1',
    as: 'firstPost',
  })

  PostSimilarity.belongsTo(Post, {
    foreignKey: 'postId2',
    as: 'secondPost',
  })
  return
}
