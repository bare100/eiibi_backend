import sequelize, { DataTypes } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.createTable(
      DATABASE_MODELS.CURRENCIES,
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: sequelize.literal('gen_random_uuid()'),
          primaryKey: true,
        },
        name: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        code: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        symbol: {
          type: DataTypes.STRING,
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

    await queryInterface.createTable(
      DATABASE_MODELS.EXCHANGE_RATES,
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: sequelize.literal('gen_random_uuid()'),
          primaryKey: true,
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
          allowNull: true,
        },
        ratesDate: {
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

    await queryInterface.addIndex(DATABASE_MODELS.CURRENCIES, ['code'], {
      transaction,
      name: 'currencies_code',
    })

    await queryInterface.addIndex(DATABASE_MODELS.EXCHANGE_RATES, ['ratesDate'], {
      transaction,
      name: 'exchange_rates_ratesDate',
    })

    await queryInterface.addColumn(
      DATABASE_MODELS.ACCOUNTS,
      'selectedCurrencyId',
      {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: DATABASE_MODELS.CURRENCIES,
          key: 'id',
        },
      },
      { transaction }
    )

    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'defaultCurrency', {
      transaction,
    })

    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'defaultCurrencyId',
      {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: DATABASE_MODELS.CURRENCIES,
          key: 'id',
        },
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'allowMultipleCurrencies',
      {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.POSTS,
      'initialCurrencyId',
      {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: DATABASE_MODELS.CURRENCIES,
          key: 'id',
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
    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'defaultCurrency',
      {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '$',
      },
      { transaction }
    )

    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'allowMultipleCurrencies', {
      transaction,
    })

    await queryInterface.removeColumn(DATABASE_MODELS.POSTS, 'initialCurrencyId', {
      transaction,
    })

    await queryInterface.removeColumn(DATABASE_MODELS.ACCOUNTS, 'selectedCurrencyId', {
      transaction,
    })

    await queryInterface.removeIndex(DATABASE_MODELS.EXCHANGE_RATES, 'exchange_rates_ratesDate', {
      transaction,
    })
    await queryInterface.removeIndex(DATABASE_MODELS.CURRENCIES, 'currencies_code', {
      transaction,
    })
    await queryInterface.dropTable(DATABASE_MODELS.EXCHANGE_RATES, {
      transaction,
    })
    await queryInterface.dropTable(DATABASE_MODELS.CURRENCIES, { transaction })

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
