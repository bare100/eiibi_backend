import sequelize from 'sequelize'
import { WebPaymentProduct } from '../../modules/web-payment-products/model.js'

const DEFAULT_WEB_PRODUCTS = [
  {
    coinsNo: 50,
    priceInUSD: 5,
  },
  {
    coinsNo: 200,
    priceInUSD: 15,
  },
  {
    coinsNo: 500,
    priceInUSD: 30,
  },
]

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await WebPaymentProduct.bulkCreate(DEFAULT_WEB_PRODUCTS, { transaction })
    await transaction.commit()
  } catch (error) {
    console.error(error)
    await transaction.rollback()
    throw error
  }
}

export async function down({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    // Make sure you add your down seed/migration here and use the above created transaction if necessary

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
