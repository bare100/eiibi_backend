import sequelize from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.changeColumn(DATABASE_MODELS.CHAT_MESSAGES, 'type', {
      type: sequelize.DataTypes.STRING,
      allowNull: true,
    })

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
