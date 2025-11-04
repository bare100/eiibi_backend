import sequelize, { DataTypes } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'

export async function up({
  context: queryInterface,
}: {
  context: sequelize.QueryInterface
}) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.addColumn(
      DATABASE_MODELS.ACCOUNTS,
      'coins',
      {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      { transaction }
    )

    await queryInterface.createTable(
      DATABASE_MODELS.PAYMENTS,
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: sequelize.literal('gen_random_uuid()'),
          primaryKey: true,
        },
        accountId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        number: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING(250),
          allowNull: true,
        },
        name: {
          type: DataTypes.STRING(250),
          allowNull: true,
        },
        vatRate: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 19,
        },
        currency: {
          type: DataTypes.STRING(10),
          allowNull: false,
          defaultValue: '$',
        },
        amount: {
          type: DataTypes.DOUBLE,
          allowNull: false,
        },
        vatAmount: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        totalAmount: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        boughtPackage: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        transactionId: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        store: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        purchasedAt: {
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
      { transaction }
    )
    await transaction.commit()
  } catch (error) {
    console.error(error)
    await transaction.rollback()
    throw error
  }
}

export async function down({
  context: queryInterface,
}: {
  context: sequelize.QueryInterface
}) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.removeColumn(DATABASE_MODELS.ACCOUNTS, 'coins', {
      transaction,
    })

    await queryInterface.dropTable(DATABASE_MODELS.PAYMENTS, { transaction })
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
