import sequelize, { DataTypes } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.createTable(
      DATABASE_MODELS.AI_RESPONSES,
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
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'openAiApiKey',
      {
        type: DataTypes.STRING,
        allowNull: true,
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'allowAiResponsesOnUnvalidatedEmails',
      {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'freeAiResponses',
      {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'aiResponsesPriceInCoins',
      {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'maxAiResponsesPerUser',
      {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2,
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.ACCOUNTS,
      'aiResponsesCount',
      {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
    await queryInterface.dropTable(DATABASE_MODELS.AI_RESPONSES, { transaction })

    await queryInterface.removeColumn(
      DATABASE_MODELS.SETTINGS,
      'allowAiResponsesOnUnvalidatedEmails',
      { transaction }
    )
    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'openAiApiKey', { transaction })
    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'freeAiResponses', { transaction })
    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'aiResponsesPriceInCoins', {
      transaction,
    })
    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'maxAiResponsesPerUser', {
      transaction,
    })
    await queryInterface.removeColumn(DATABASE_MODELS.ACCOUNTS, 'aiResponsesCount', { transaction })

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
