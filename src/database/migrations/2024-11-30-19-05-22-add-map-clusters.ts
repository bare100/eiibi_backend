import sequelize, { DataTypes } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.createTable(
      DATABASE_MODELS.POST_MAP_CLUSTERS,
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: sequelize.literal('gen_random_uuid()'),
          primaryKey: true,
        },
        locationLat: {
          type: DataTypes.DOUBLE,
          allowNull: false,
        },
        locationLong: {
          type: DataTypes.DOUBLE,
          allowNull: false,
        },
        meta: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        expiresAt: {
          type: DataTypes.DATE,
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
    await queryInterface.dropTable(DATABASE_MODELS.POST_MAP_CLUSTERS, {
      transaction,
    })

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
