import sequelize from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.addColumn(
      DATABASE_MODELS.CHAT_MESSAGES,
      'latitude',
      {
        type: sequelize.DataTypes.STRING,
        allowNull: true,
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.CHAT_MESSAGES,
      'longitude',
      {
        type: sequelize.DataTypes.STRING,
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
    await queryInterface.removeColumn(DATABASE_MODELS.CHAT_MESSAGES, 'latitude', { transaction })
    await queryInterface.removeColumn(DATABASE_MODELS.CHAT_MESSAGES, 'longitude', { transaction })
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
