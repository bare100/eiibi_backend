import { Model, DataTypes, literal } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { getModelConfig } from '../../utils/db.js'

export class UserMessage extends Model {
  declare id: string
  declare accountId: string
  declare message: string
  declare solved: boolean
  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.USER_MESSAGES)
  UserMessage.init(
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
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      solved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
  return
}
