import { DataTypes, Model, literal } from 'sequelize'
import { getModelConfig } from '../../utils/db.js'
import { DATABASE_MODELS } from '../../constants/model-names.js'

export class ExchangeRate extends Model {
  declare id: string
  declare baseCurrencyId: string
  declare rates: Record<string, number>
  declare ratesDate: Date

  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.EXCHANGE_RATES)
  ExchangeRate.init(
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: literal('gen_random_uuid()'),
      },
      baseCurrencyId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: DATABASE_MODELS.CURRENCIES,
          key: 'id',
        },
      },
      rates: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      ratesDate: {
        type: DataTypes.DATE,
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
  return
}
