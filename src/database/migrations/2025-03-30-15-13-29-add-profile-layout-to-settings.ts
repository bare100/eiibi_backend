import sequelize, { DataTypes } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'profilePageLayout',
      {
        type: DataTypes.ENUM('sidebar', 'tabs'),
        defaultValue: 'sidebar',
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'accountPageLayout',
      {
        type: DataTypes.ENUM('sidebar', 'tabs'),
        defaultValue: 'tabs',
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
    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'profilePageLayout', {
      transaction,
    })

    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'accountPageLayout', {
      transaction,
    })

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
