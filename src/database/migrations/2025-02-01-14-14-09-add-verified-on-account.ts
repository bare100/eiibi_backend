import sequelize from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.addColumn(
      DATABASE_MODELS.ACCOUNTS,
      'verified',
      {
        type: sequelize.DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.ACCOUNTS,
      'verifiedAt',
      {
        type: sequelize.DataTypes.DATE,
        allowNull: true,
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.ACCOUNTS,
      'verificationRequestedAt',
      {
        type: sequelize.DataTypes.DATE,
        allowNull: true,
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'allowValidationRequest',
      {
        type: sequelize.DataTypes.BOOLEAN,
        defaultValue: true,
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
    await queryInterface.removeColumn(DATABASE_MODELS.ACCOUNTS, 'verified', { transaction })
    await queryInterface.removeColumn(DATABASE_MODELS.ACCOUNTS, 'verificationRequestedAt', {
      transaction,
    })
    await queryInterface.removeColumn(DATABASE_MODELS.ACCOUNTS, 'verifiedAt', { transaction })
    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'allowValidationRequest', {
      transaction,
    })

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
