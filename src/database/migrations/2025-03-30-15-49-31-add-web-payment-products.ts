import sequelize, { DataTypes } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.createTable(
      DATABASE_MODELS.WEB_PAYMENT_PRODUCTS,
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: sequelize.literal('gen_random_uuid()'),
          primaryKey: true,
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
      { transaction }
    )
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
    await queryInterface.dropTable(DATABASE_MODELS.WEB_PAYMENT_PRODUCTS, { transaction })
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
