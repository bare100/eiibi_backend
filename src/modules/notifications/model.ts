import sequelize from 'sequelize'
import { DataTypes, Model } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { getModelConfig } from '../../utils/db.js'
import { Account } from '../accounts/model.js'

export class Notification extends Model {
  declare id: string
  declare accountId: string
  declare type: string

  declare title: Record<string, string>
  declare description: Record<string, string>

  declare entityId: string
  declare read: boolean
  declare readAt: Date

  declare initiatedByAccountId?: string

  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.NOTIFICATIONS)
  Notification.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      accountId: {
        type: DataTypes.UUID,
        references: {
          model: DATABASE_MODELS.ACCOUNTS,
          key: 'id',
        },
      },
      title: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      description: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      initiatedByAccountId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      entityId: {
        type: DataTypes.UUID,
      },
      read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      readAt: {
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
  Notification.belongsTo(Account, {
    foreignKey: 'accountId',
    onDelete: 'cascade',
  })

  Notification.belongsTo(Account, {
    foreignKey: 'initiatedByAccountId',
    onDelete: 'cascade',
  })
}
