import { Model, DataTypes, literal } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { Account } from '../accounts/model.js'
import { getModelConfig } from '../../utils/db.js'

export class Report extends Model {
  declare id: string
  declare reportedBy: string
  declare entityName: string
  declare entityId: string
  declare reason: string

  declare description: string

  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.REPORTS)
  Report.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: literal('gen_random_uuid()'),
        primaryKey: true,
      },
      reportedBy: {
        type: DataTypes.UUID,
        references: {
          model: DATABASE_MODELS.ACCOUNTS,
          key: 'id',
        },
      },
      entityName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      entityId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
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
  Report.belongsTo(Account, { foreignKey: 'reportedBy', as: 'reporter' })
  return
}
