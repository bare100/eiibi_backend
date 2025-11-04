import { Model, DataTypes } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { Account } from '../accounts/model.js'
import { getModelConfig } from '../../utils/db.js'

export class Follower extends Model {
  declare followerId: string
  declare followingId: string

  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.FOLLOWERS)

  Follower.init(
    {
      followerId: {
        type: DataTypes.UUID,
        references: {
          model: DATABASE_MODELS.ACCOUNTS,
          key: 'id',
        },
        allowNull: false,
        primaryKey: true,
      },
      followingId: {
        type: DataTypes.UUID,
        references: {
          model: DATABASE_MODELS.ACCOUNTS,
          key: 'id',
        },
        allowNull: false,
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
  Follower.belongsTo(Account, {
    foreignKey: 'followerId',
    as: 'follower',
    onDelete: 'cascate',
  })
  Follower.belongsTo(Account, {
    foreignKey: 'followingId',
    as: 'following',
    onDelete: 'cascate',
  })
}
