import { DataTypes, Model, literal } from 'sequelize'
import { Account } from '../accounts/model.js'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { getModelConfig } from '../../utils/db.js'

export class SearchHistoryItem extends Model {
  declare id: string
  declare accountId: string
  declare searchKey: string

  declare type: string
  declare entityId: string
  declare data: string

  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.SEARCH_HISTORY)
  SearchHistoryItem.init(
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
      searchKey: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      entityId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      data: {
        type: DataTypes.TEXT,
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
  SearchHistoryItem.belongsTo(Account, {
    foreignKey: 'accountId',
    onDelete: 'cascade',
  })
}
