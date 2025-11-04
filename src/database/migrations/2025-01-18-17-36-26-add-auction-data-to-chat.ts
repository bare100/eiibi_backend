import sequelize, { DataTypes } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.addColumn(
      DATABASE_MODELS.CHAT_GROUPS,
      'initiatedBy',
      {
        type: DataTypes.UUID,
        allowNull: true,
      },
      { transaction }
    )

    await queryInterface.createTable(
      DATABASE_MODELS.CHAT_GROUP_POSTS,
      {
        chatGroupId: {
          type: DataTypes.UUID,
          references: {
            model: DATABASE_MODELS.CHAT_GROUPS,
            key: 'id',
          },
          primaryKey: true,
        },
        postId: {
          type: DataTypes.UUID,
          references: {
            model: DATABASE_MODELS.POSTS,
            key: 'id',
          },
          primaryKey: true,
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
    await queryInterface.removeColumn(DATABASE_MODELS.CHAT_GROUPS, 'initiatedBy', { transaction })
    await queryInterface.dropTable(DATABASE_MODELS.CHAT_GROUP_POSTS, { transaction })

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
