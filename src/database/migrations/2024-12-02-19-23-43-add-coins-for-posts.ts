import sequelize, { DataTypes } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'freePostsCount',
      {
        type: DataTypes.INTEGER,
        defaultValue: 2,
      },
      { transaction }
    )
    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'postsCoinsCost',
      {
        type: DataTypes.INTEGER,
        defaultValue: 25,
      },
      { transaction }
    )
    await queryInterface.addColumn(
      DATABASE_MODELS.POSTS,
      'paidCoins',
      {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      { transaction }
    )
    await queryInterface.addColumn(
      DATABASE_MODELS.POSTS,
      'coinsPaidBack',
      {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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
    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'freePostsCount', {
      transaction,
    })
    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'postsCoinsCost', {
      transaction,
    })
    await queryInterface.removeColumn(DATABASE_MODELS.POSTS, 'paidCoins', {
      transaction,
    })
    await queryInterface.removeColumn(DATABASE_MODELS.POSTS, 'coinsPaidBack', {
      transaction,
    })
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
