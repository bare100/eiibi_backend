import { Model, DataTypes } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { Account } from '../accounts/model.js'
import { Post } from '../posts/model.js'
import { getModelConfig } from '../../utils/db.js'

export class Favourite extends Model {
  declare accountId: string
  declare postId: string

  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  declare readonly account: Account
  declare readonly post: Post

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.ACCOUNT_FAVOURITES)
  Favourite.init(
    {
      accountId: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      postId: {
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
  Favourite.belongsTo(Account, {
    foreignKey: 'accountId',
    onDelete: 'cascade',
    as: 'account',
  })
  Favourite.belongsTo(Post, {
    foreignKey: 'postId',
    onDelete: 'cascade',
    as: 'post',
  })
}
