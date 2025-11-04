import sequelize, { DataTypes } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.createTable(
      DATABASE_MODELS.POST_SIMILARITIES,
      {
        postId1: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
        },
        postId2: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
        },
        similarity: {
          type: DataTypes.FLOAT,
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
    await queryInterface.dropTable(DATABASE_MODELS.POST_SIMILARITIES, {
      transaction,
    })

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
