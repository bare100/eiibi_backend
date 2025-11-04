import sequelize, { DataTypes } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'

export async function up({
  context: queryInterface,
}: {
  context: sequelize.QueryInterface
}) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.createTable(
      DATABASE_MODELS.PUSH_SUBSCRIPTIONS,
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: sequelize.literal('gen_random_uuid()'),
          primaryKey: true,
        },
        accountId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: DATABASE_MODELS.ACCOUNTS,
            key: 'id',
          },
        },
        endpoint: DataTypes.TEXT,
        keys: DataTypes.JSONB,
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
    await queryInterface.dropTable(DATABASE_MODELS.PUSH_SUBSCRIPTIONS, {
      transaction,
    })

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
