import sequelize, { DataTypes } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'webAppUrl',
      {
        type: DataTypes.STRING,
        allowNull: true,
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'googleMapsApiKey',
      {
        type: DataTypes.STRING,
        allowNull: true,
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'vapidPrivateKey',
      {
        type: DataTypes.STRING,
        allowNull: true,
      },
      { transaction }
    )
    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'vapidPublicKey',
      {
        type: DataTypes.STRING,
        allowNull: true,
      },
      { transaction }
    )
    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'vapidSupportEmail',
      {
        type: DataTypes.STRING,
        allowNull: true,
      },
      { transaction }
    )
    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'stripeSecretKey',
      {
        type: DataTypes.STRING,
        allowNull: true,
      },
      { transaction }
    )
    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'stripeWehookSigningSecret',
      {
        type: DataTypes.STRING,
        allowNull: true,
      },
      { transaction }
    )
    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'paypalClientId',
      {
        type: DataTypes.STRING,
        allowNull: true,
      },
      { transaction }
    )
    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'paypalClientSecret',
      {
        type: DataTypes.STRING,
        allowNull: true,
      },
      { transaction }
    )
    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'razorpayKeyId',
      {
        type: DataTypes.STRING,
        allowNull: true,
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'razorpaySecretKey',
      {
        type: DataTypes.STRING,
        allowNull: true,
      },
      { transaction }
    )
    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'razorpayWebhookSecret',
      {
        type: DataTypes.STRING,
        allowNull: true,
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'googleCloudStorageBucket',
      {
        type: DataTypes.STRING,
        allowNull: true,
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'awsAccessKeyId',
      {
        type: DataTypes.STRING,
        allowNull: true,
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'awsSecretAccessKey',
      {
        type: DataTypes.STRING,
        allowNull: true,
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'awsStorageBucket',
      {
        type: DataTypes.STRING,
        allowNull: true,
      },
      { transaction }
    )

    await queryInterface.addColumn(
      DATABASE_MODELS.SETTINGS,
      'awsStorageRegion',
      {
        type: DataTypes.STRING,
        allowNull: true,
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
    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'webAppUrl', { transaction })

    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'vapidPrivateKey', { transaction })

    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'vapidPublicKey', { transaction })

    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'vapidSupportEmail', {
      transaction,
    })

    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'stripeSecretKey', { transaction })

    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'stripeWehookSigningSecret', {
      transaction,
    })

    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'paypalClientId', { transaction })

    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'paypalClientSecret', {
      transaction,
    })

    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'razorpayKeyId', { transaction })

    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'razorpaySecretKey', {
      transaction,
    })

    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'razorpayWebhookSecret', {
      transaction,
    })

    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'googleCloudStorageBucket', {
      transaction,
    })

    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'awsAccessKeyId', { transaction })
    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'awsSecretAccessKey', {
      transaction,
    })
    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'awsStorageBucket', { transaction })
    await queryInterface.removeColumn(DATABASE_MODELS.SETTINGS, 'awsStorageRegion', { transaction })

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
