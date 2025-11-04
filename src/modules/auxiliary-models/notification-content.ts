import { Model, DataTypes } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { getModelConfig } from '../../utils/db.js'
import { Asset } from '../assets/model.js'

export class NotificationContent extends Model {
  declare type: string
  declare title: Record<string, string>
  declare enabled: boolean
  declare description: Record<string, string>

  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  declare readonly asset: Asset

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.NOTIFICATIONS_CONTENT)
  NotificationContent.init(
    {
      type: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      description: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

function initAssociations() {}
