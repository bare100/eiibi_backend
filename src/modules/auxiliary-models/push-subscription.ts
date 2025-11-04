import { DataTypes, Model } from 'sequelize'
import { Account } from '../accounts/model.js'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import sequelize from 'sequelize'
import { getModelConfig } from '../../utils/db.js'

export class PushSubscription extends Model {
  declare id: number
  declare accountId: string
  declare endpoint: string
  declare keys: Record<string, string>

  declare createdAt: Date
  declare updatedAt: Date

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.PUSH_SUBSCRIPTIONS)
  PushSubscription.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      accountId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: DATABASE_MODELS.ACCOUNTS,
          key: 'id',
        },
      },
      endpoint: DataTypes.TEXT,
      keys: DataTypes.JSONB,
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
  PushSubscription.belongsTo(Account, {
    foreignKey: 'accountId',
    onDelete: 'cascade',
  })
}
