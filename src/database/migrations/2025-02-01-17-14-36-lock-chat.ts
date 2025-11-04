import sequelize from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.addColumn(
      DATABASE_MODELS.CHAT_GROUPS,
      'unlockedChatAt',
      {
        type: sequelize.DataTypes.DATE,
        allowNull: true,
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.CHAT_GROUPS,
      'unlockedChatBy',
      {
        type: sequelize.DataTypes.UUID,
        allowNull: true,
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.CHAT_GROUPS,
      'paidCoinsToUnlockChat',
      {
        type: sequelize.DataTypes.INTEGER,
        allowNull: true,
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'lockChatForSeller',
      {
        type: sequelize.DataTypes.BOOLEAN,
        defaultValue: false,
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'unlockChatCoinsCost',
      {
        type: sequelize.DataTypes.INTEGER,
        defaultValue: 5,
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
    await queryInterface.removeColumn(DATABASE_MODELS.CHAT_GROUPS, 'unlockedChatAt', {
      transaction,
    })
    await queryInterface.removeColumn(DATABASE_MODELS.CHAT_GROUPS, 'unlockedChatBy', {
      transaction,
    })
    await queryInterface.removeColumn(DATABASE_MODELS.CHAT_GROUPS, 'paidCoinsToUnlockChat', {
      transaction,
    })
    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'lockChatForSeller', {
      transaction,
    })
    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'unlockChatCoinsCost', {
      transaction,
    })

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
