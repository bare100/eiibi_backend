import { DataTypes, Model, literal } from 'sequelize'
import { getModelConfig } from '../../utils/db.js'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { deleteDataFromCache } from '../../api/middlewares/cache.js'

export class WebPaymentProduct extends Model {
  declare id: string
  declare coinsNo: number
  declare priceInUSD: number

  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.WEB_PAYMENT_PRODUCTS)
  WebPaymentProduct.init(
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: literal('gen_random_uuid()'),
      },
      coinsNo: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      priceInUSD: {
        type: DataTypes.DOUBLE,
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

  WebPaymentProduct.afterUpdate(() => {
    deleteDataFromCache('web-payment-products')
  })

  WebPaymentProduct.afterDestroy(() => {
    deleteDataFromCache('web-payment-products')
  })

  WebPaymentProduct.afterCreate(() => {
    deleteDataFromCache('web-payment-products')
  })
}

function initAssociations() {
  return
}
