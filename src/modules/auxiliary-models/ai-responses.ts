import { DataTypes, Model } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import sequelize from 'sequelize'
import { getModelConfig } from '../../utils/db.js'

export class AiResponse extends Model {
  declare id: number
  declare accountId: string
  declare type: string
  declare aiResponse: string
  declare paidCoins: number
  declare createdAt: Date
  declare updatedAt: Date

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.AI_RESPONSES)
  AiResponse.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      accountId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      paidCoins: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      aiResponse: {
        type: DataTypes.JSONB,
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

function initAssociations() {}
