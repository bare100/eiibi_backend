import sequelize, { DataTypes } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.addColumn(
      DATABASE_MODELS.CHAT_MESSAGES,
      'type',
      {
        type: DataTypes.ENUM('text', 'assets'),
        defaultValue: 'text',
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.CHAT_MESSAGES,
      'assetIds',
      {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      { transaction }
    )

    await queryInterface.changeColumn(
      DATABASE_MODELS.CHAT_MESSAGES,
      'message',
      {
        type: DataTypes.TEXT,
        allowNull: true,
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
    await queryInterface.removeColumn(DATABASE_MODELS.CHAT_MESSAGES, 'type', { transaction })
    await queryInterface.removeColumn(DATABASE_MODELS.CHAT_MESSAGES, 'assetPaths', { transaction })
    await queryInterface.changeColumn(
      DATABASE_MODELS.CHAT_MESSAGES,
      'message',
      {
        type: DataTypes.STRING,
        allowNull: false,
      },
      { transaction }
    )

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
