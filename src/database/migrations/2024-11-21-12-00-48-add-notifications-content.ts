import sequelize, { DataTypes } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'

export async function up({
  context: queryInterface,
}: {
  context: sequelize.QueryInterface
}) {
  const transaction = await queryInterface.sequelize.transaction()
  // ceva aici
  try {
    await queryInterface.createTable(
      DATABASE_MODELS.NOTIFICATIONS_CONTENT,
      {
        type: {
          type: DataTypes.STRING,
          primaryKey: true,
          allowNull: false,
        },
        title: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        description: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        enabled: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
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
    await queryInterface.dropTable(DATABASE_MODELS.NOTIFICATIONS_CONTENT, {
      transaction,
    })
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
