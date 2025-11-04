import sequelize, { DataTypes } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.createTable(
      DATABASE_MODELS.SETTINGS,
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: sequelize.literal('gen_random_uuid()'),
          primaryKey: true,
        },
        defaultCurrency: {
          allowNull: false,
          defaultValue: '$',
          type: DataTypes.STRING,
        },
        postActiveTimeInDays: {
          allowNull: false,
          defaultValue: 30,
          type: DataTypes.INTEGER,
        },
        maxProductPrice: {
          allowNull: false,
          defaultValue: 10000000,
          type: DataTypes.INTEGER,
        },
        promotionCoinsCost: {
          allowNull: false,
          defaultValue: 50,
          type: DataTypes.INTEGER,
        },
        defaultProductImageUrl: {
          allowNull: false,
          defaultValue: 'https://cdn.tanna.app/bazaryo/default-item.jpeg',
          type: DataTypes.STRING,
        },
        confidentialityLink: {
          allowNull: true,
          type: DataTypes.STRING,
        },
        revenueCatAndroidKey: {
          allowNull: true,
          type: DataTypes.STRING,
        },
        revenueCatIOSKey: {
          allowNull: true,
          type: DataTypes.STRING,
        },
        adsEnabledOnAndroid: {
          allowNull: false,
          defaultValue: true,
          type: DataTypes.BOOLEAN,
        },
        adsEnabledOnIOS: {
          allowNull: false,
          defaultValue: true,
          type: DataTypes.BOOLEAN,
        },
        rewardCoinsForWatchingAd: {
          allowNull: false,
          defaultValue: 1,
          type: DataTypes.INTEGER,
        },
        androidAdsBannerId: {
          allowNull: true,
          type: DataTypes.STRING,
          defaultValue: 'ca-app-pub-3940256099942544/6300978111',
        },
        androidAdsInterstitialId: {
          allowNull: true,
          type: DataTypes.STRING,
          defaultValue: 'ca-app-pub-3940256099942544/1033173712',
        },
        androidAdsRewardedId: {
          allowNull: true,
          type: DataTypes.STRING,
          defaultValue: 'ca-app-pub-3940256099942544/5224354917',
        },
        iosAdsBannerId: {
          allowNull: true,
          type: DataTypes.STRING,
          defaultValue: 'ca-app-pub-3940256099942544/2934735716',
        },
        iosAdsInterstitialId: {
          allowNull: true,
          type: DataTypes.STRING,
          defaultValue: 'ca-app-pub-3940256099942544/4411468910',
        },
        iosAdsRewardedId: {
          allowNull: true,
          type: DataTypes.STRING,
          defaultValue: 'ca-app-pub-3940256099942544/1712485313',
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
    await queryInterface.dropTable(DATABASE_MODELS.SETTINGS, { transaction })
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
