import sequelize from 'sequelize'
import { DatabaseConnection } from '../index.js'
import { config } from '../../config.js'

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await DatabaseConnection.getInstance().query(
      `ALTER DATABASE "${config.DATABASE.POSTGRES_DB}" SET idle_in_transaction_session_timeout = '5min';`,
      {
        raw: true,
      }
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
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
