import sequelize, { DataTypes } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.createTable(
      DATABASE_MODELS.ASSETS,
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: sequelize.literal('gen_random_uuid()'),
          primaryKey: true,
        },
        path: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        size: {
          type: sequelize.DataTypes.INTEGER,
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

    await queryInterface.createTable(
      DATABASE_MODELS.ACCOUNTS,
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: sequelize.literal('gen_random_uuid()'),
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        email: {
          type: DataTypes.STRING(100),
          unique: true,
          allowNull: true,
          validate: {
            isEmail: true,
          },
        },
        authId: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        isAnonymous: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        identities: DataTypes.JSON,
        deviceFCMToken: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        picture: DataTypes.TEXT,
        acceptedTermsAndCondition: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        introDone: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        introSkipped: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        assetId: {
          type: DataTypes.UUID,
          references: {
            model: DATABASE_MODELS.ASSETS,
            key: 'id',
          },
          allowNull: true,
        },
        meta: {
          type: DataTypes.JSONB,
          defaultValue: {},
        },
        allowedNotifications: {
          type: DataTypes.JSONB,
          defaultValue: {
            NEW_MESSAGE: true,
            SYSTEM: true,
            NEW_FOLLOWER: true,
            NEW_POST_FROM_FOLLOWING: true,
            POST_ADDED_TO_FAVOURITES: true,
            FAVOURITE_POST_PRICE_CHANGE: true,
          },
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

    await queryInterface.createTable(
      DATABASE_MODELS.NOTIFICATIONS,
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: sequelize.literal('gen_random_uuid()'),
          primaryKey: true,
        },
        accountId: {
          type: DataTypes.UUID,
          references: {
            model: DATABASE_MODELS.ACCOUNTS,
            key: 'id',
          },
        },
        title: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        description: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        type: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        initiatedByAccountId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        entityId: {
          type: DataTypes.UUID,
        },
        read: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        readAt: {
          type: DataTypes.DATE,
          allowNull: true,
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

    await queryInterface.createTable(
      DATABASE_MODELS.LOCATIONS,
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: sequelize.literal('gen_random_uuid()'),
        },
        name: {
          type: DataTypes.STRING,
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

    await queryInterface.createTable(
      DATABASE_MODELS.CATEGORIES,
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: sequelize.literal('gen_random_uuid()'),
        },
        parentCategoryId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: DATABASE_MODELS.CATEGORIES,
            key: 'id',
          },
        },
        name: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        icon: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        details: {
          type: DataTypes.JSONB,
          allowNull: true,
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

    await queryInterface.createTable(
      DATABASE_MODELS.POSTS,
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: sequelize.literal('gen_random_uuid()'),
          primaryKey: true,
        },
        accountId: {
          type: DataTypes.UUID,
          references: {
            model: DATABASE_MODELS.ACCOUNTS,
            key: 'id',
          },
        },
        locationId: {
          type: DataTypes.UUID,
          references: {
            model: DATABASE_MODELS.LOCATIONS,
            key: 'id',
          },
        },
        locationPretty: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        locationLat: {
          type: DataTypes.DOUBLE,
          allowNull: false,
        },
        locationLong: {
          type: DataTypes.DOUBLE,
          allowNull: false,
        },
        mainCategoryId: {
          type: DataTypes.UUID,
          references: {
            model: DATABASE_MODELS.CATEGORIES,
            key: 'id',
          },
        },
        subCategoryId: {
          type: DataTypes.UUID,
          references: {
            model: DATABASE_MODELS.CATEGORIES,
            key: 'id',
          },
        },
        title: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        description: {
          type: DataTypes.STRING(1000),
        },
        isNewItem: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        views: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        price: {
          type: DataTypes.DOUBLE,
          allowNull: false,
        },
        hasCustomPrice: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
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

    await queryInterface.createTable(
      DATABASE_MODELS.ACCOUNT_FAVOURITES,
      {
        accountId: {
          type: DataTypes.UUID,
          references: {
            model: DATABASE_MODELS.ACCOUNTS,
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

    await queryInterface.createTable(
      DATABASE_MODELS.POST_ASSETS,
      {
        postId: {
          type: DataTypes.UUID,
          primaryKey: true,
          references: {
            model: DATABASE_MODELS.POSTS,
            key: 'id',
          },
        },
        assetId: {
          type: DataTypes.UUID,
          primaryKey: true,
          references: {
            model: DATABASE_MODELS.ASSETS,
            key: 'id',
          },
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

    await queryInterface.createTable(
      DATABASE_MODELS.SEARCH_HISTORY,
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: sequelize.literal('gen_random_uuid()'),
          primaryKey: true,
        },
        accountId: {
          type: DataTypes.UUID,
          references: {
            model: DATABASE_MODELS.ACCOUNTS,
            key: 'id',
          },
        },
        searchKey: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        type: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        entityId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        data: {
          type: DataTypes.TEXT,
          allowNull: true,
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

    await queryInterface.createTable(
      DATABASE_MODELS.CHAT_GROUPS,
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: sequelize.literal('gen_random_uuid()'),
          primaryKey: true,
        },
        firstAccountId: {
          type: DataTypes.UUID,
          references: {
            model: DATABASE_MODELS.ACCOUNTS,
            key: 'id',
          },
          allowNull: false,
        },
        secondAccountId: {
          type: DataTypes.UUID,
          references: {
            model: DATABASE_MODELS.ACCOUNTS,
            key: 'id',
          },
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
      {
        transaction,
        uniqueKeys: {
          action_unique: { fields: ['firstAccountId', 'secondAccountId'] },
        },
      }
    )

    await queryInterface.createTable(
      DATABASE_MODELS.CHAT_MESSAGES,
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: sequelize.literal('gen_random_uuid()'),
          primaryKey: true,
        },
        chatGroupId: {
          type: DataTypes.UUID,
          references: {
            model: DATABASE_MODELS.CHAT_GROUPS,
            key: 'id',
          },
          allowNull: false,
        },
        fromAccountId: {
          type: DataTypes.UUID,
          references: {
            model: DATABASE_MODELS.ACCOUNTS,
            key: 'id',
          },
          allowNull: false,
        },
        message: {
          type: DataTypes.TEXT,
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

    await queryInterface.createTable(
      DATABASE_MODELS.FOLLOWERS,
      {
        followerId: {
          type: DataTypes.UUID,
          references: {
            model: DATABASE_MODELS.ACCOUNTS,
            key: 'id',
          },
          allowNull: false,
          primaryKey: true,
        },
        followingId: {
          type: DataTypes.UUID,
          references: {
            model: DATABASE_MODELS.ACCOUNTS,
            key: 'id',
          },
          allowNull: false,
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
      {
        transaction,
        uniqueKeys: {
          action_unique: { fields: ['followerId', 'followingId'] },
        },
      }
    )

    await queryInterface.createTable(
      DATABASE_MODELS.REPORTS,
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: sequelize.literal('gen_random_uuid()'),
          primaryKey: true,
        },
        reportedBy: {
          type: DataTypes.UUID,
          references: {
            model: DATABASE_MODELS.ACCOUNTS,
            key: 'id',
          },
        },
        entityName: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        entityId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        reason: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
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

    await queryInterface.createTable(
      DATABASE_MODELS.LAST_SEEN_POSTS,
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: sequelize.literal('gen_random_uuid()'),
          primaryKey: true,
        },
        accountId: {
          type: DataTypes.UUID,
          references: {
            model: DATABASE_MODELS.ACCOUNTS,
            key: 'id',
          },
        },
        postId: {
          type: DataTypes.UUID,
          references: {
            model: DATABASE_MODELS.POSTS,
            key: 'id',
          },
        },
        lastSeenAt: {
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

    await queryInterface.createTable(
      DATABASE_MODELS.FILTERS,
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: sequelize.literal('gen_random_uuid()'),
          primaryKey: true,
        },
        accountId: {
          type: DataTypes.UUID,
          references: {
            model: DATABASE_MODELS.ACCOUNTS,
            key: 'id',
          },
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        type: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        data: {
          type: DataTypes.JSONB,
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

    await queryInterface.addIndex(DATABASE_MODELS.ACCOUNTS, ['email'], {
      transaction,
      name: 'account_email',
    })
    await queryInterface.addIndex(DATABASE_MODELS.ACCOUNTS, ['name'], {
      transaction,
      name: 'account_name',
    })
    await queryInterface.addIndex(DATABASE_MODELS.POSTS, ['accountId'], {
      transaction,
      name: 'post_accountId',
    })
    await queryInterface.addIndex(DATABASE_MODELS.CHAT_GROUPS, ['firstAccountId'], {
      transaction,
      name: 'chat_group_firstAccountId',
    })
    await queryInterface.addIndex(DATABASE_MODELS.CHAT_GROUPS, ['secondAccountId'], {
      transaction,
      name: 'chat_group_secondAccountId',
    })

    await queryInterface.addIndex(DATABASE_MODELS.SEARCH_HISTORY, ['accountId'], {
      transaction,
      name: 'search_accountId',
    })

    await queryInterface.addIndex(DATABASE_MODELS.LAST_SEEN_POSTS, ['accountId'], {
      transaction,
      name: 'last_seen_accountId',
    })

    await queryInterface.addIndex(DATABASE_MODELS.FILTERS, ['accountId'], {
      transaction,
      name: 'filter_accountId',
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
    await queryInterface.dropTable(DATABASE_MODELS.FOLLOWERS, { transaction })
    await queryInterface.dropTable(DATABASE_MODELS.CHAT_MESSAGES, {
      transaction,
    })
    await queryInterface.dropTable(DATABASE_MODELS.CHAT_GROUPS, { transaction })
    await queryInterface.dropTable(DATABASE_MODELS.SEARCH_HISTORY, {
      transaction,
    })
    await queryInterface.dropTable(DATABASE_MODELS.POST_ASSETS, {
      transaction,
    })
    await queryInterface.dropTable(DATABASE_MODELS.ACCOUNT_FAVOURITES, {
      transaction,
    })
    await queryInterface.dropTable(DATABASE_MODELS.POSTS, { transaction })
    await queryInterface.dropTable(DATABASE_MODELS.NOTIFICATIONS, {
      transaction,
    })
    await queryInterface.dropTable(DATABASE_MODELS.ASSETS, { transaction })
    await queryInterface.dropTable(DATABASE_MODELS.ACCOUNTS, { transaction })
    await queryInterface.dropTable(DATABASE_MODELS.LOCATIONS, { transaction })
    await queryInterface.dropTable(DATABASE_MODELS.CATEGORIES, { transaction })
    await queryInterface.dropTable(DATABASE_MODELS.REPORTS, { transaction })
    await queryInterface.dropTable(DATABASE_MODELS.LAST_SEEN_POSTS, {
      transaction,
    })
    await queryInterface.dropTable(DATABASE_MODELS.FILTERS, { transaction })

    await queryInterface.removeIndex(DATABASE_MODELS.ACCOUNTS, 'account_email', {
      transaction,
    })
    await queryInterface.removeIndex(DATABASE_MODELS.ACCOUNTS, 'account_name', {
      transaction,
    })
    await queryInterface.removeIndex(DATABASE_MODELS.POSTS, 'post_accountId', {
      transaction,
    })
    await queryInterface.removeIndex(DATABASE_MODELS.CHAT_GROUPS, 'chat_group_firstAccountId', {
      transaction,
    })
    await queryInterface.removeIndex(DATABASE_MODELS.CHAT_GROUPS, 'chat_group_secondAccountId', {
      transaction,
    })
    await queryInterface.removeIndex(DATABASE_MODELS.SEARCH_HISTORY, 'search_accountId', {
      transaction,
    })

    await queryInterface.removeIndex(DATABASE_MODELS.LAST_SEEN_POSTS, 'last_seen_accountId', {
      transaction,
    })

    await queryInterface.removeIndex(DATABASE_MODELS.FILTERS, 'filter_accountId', { transaction })

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
