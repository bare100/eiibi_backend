import { DataTypes, Model, literal } from 'sequelize'
import { getModelConfig } from '../../utils/db.js'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { deleteDataFromCache } from '../../api/middlewares/cache.js'

export const CURRENCIES_CACHE_KEY = 'currencies'

export class Currency extends Model {
  declare id: string
  declare code: string
  declare symbol: string
  declare name: Record<string, string>

  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.CURRENCIES)
  Currency.init(
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: literal('gen_random_uuid()'),
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      symbol: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
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

  Currency.afterUpdate(() => {
    deleteDataFromCache(CURRENCIES_CACHE_KEY)
  })

  Currency.afterDestroy(() => {
    deleteDataFromCache(CURRENCIES_CACHE_KEY)
  })

  Currency.afterCreate(() => {
    deleteDataFromCache(CURRENCIES_CACHE_KEY)
  })
}

function initAssociations() {
  return
}
