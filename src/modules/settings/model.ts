import { Model, DataTypes } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { getModelConfig } from '../../utils/db.js'
import sequelize from 'sequelize'
import { Currency } from '../currencies/model.js'
import { deleteDataFromCache } from '../../api/middlewares/cache.js'

export const SETTINGS_CACHE_KEY = 'app_settings'

export class Settings extends Model {
  declare id: string
  declare defaultCurrencyId: string
  declare postActiveTimeInDays: number
  declare maxProductPrice: number
  declare promotionCoinsCost: number
  declare rewardCoinsForWatchingAd: number
  declare defaultProductImageUrl: string
  declare confidentialityLink: string
  declare revenueCatAndroidKey: string
  declare revenueCatIOSKey: string
  declare adsEnabledOnAndroid: boolean
  declare adsEnabledOnIOS: boolean
  declare androidAdsBannerId: string
  declare androidAdsInterstitialId: string
  declare androidAdsRewardedId: string
  declare iosAdsBannerId: string
  declare iosAdsInterstitialId: string
  declare iosAdsRewardedId: string
  declare allowValidationRequest: boolean

  declare freePostsCount: number
  declare postsCoinsCost: number

  declare appName: string

  declare allowMultipleCurrencies: boolean

  declare webAppUrl: string
  declare vapidPrivateKey: string
  declare vapidPublicKey: string
  declare vapidSupportEmail: string
  declare stripeSecretKey: string
  declare stripeWehookSigningSecret: string
  declare paypalClientId: string
  declare paypalClientSecret: string
  declare razorpayKeyId: string
  declare razorpaySecretKey: string
  declare razorpayWebhookSecret: string
  declare googleCloudStorageBucket: string
  declare awsAccessKeyId: string
  declare awsSecretAccessKey: string
  declare awsStorageBucket: string
  declare awsStorageRegion: string
  declare googleMapsApiKey: string
  declare googlePlayLink: string
  declare appStoreLink: string

  declare openAiApiKey: string
  declare allowAiResponsesOnUnvalidatedEmails: boolean
  declare freeAiResponses: number
  declare aiResponsesPriceInCoins: number
  declare maxAiResponsesPerUser: number

  declare emailValidationEnabled: boolean
  declare allowUnvalidatedUsersToCreatePosts: boolean
  declare allowAnonymousUsersToCreatePosts: boolean

  declare profilePageLayout: 'sidebar' | 'tabs'
  declare accountPageLayout: 'sidebar' | 'tabs'

  declare lockChatForSeller: boolean
  declare unlockChatCoinsCost: number
  declare readonly defaultCurrency: Currency

  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.SETTINGS)
  Settings.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      defaultCurrencyId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: DATABASE_MODELS.CURRENCIES,
          key: 'id',
        },
      },
      allowMultipleCurrencies: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
      revenueCatIOSKey: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      revenueCatAndroidKey: {
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
      androidAdsBannerId: {
        allowNull: true,
        type: DataTypes.STRING,
        defaultValue: 'ca-app-pub-3940256099942544/6300978111',
      },
      rewardCoinsForWatchingAd: {
        allowNull: false,
        defaultValue: 1,
        type: DataTypes.INTEGER,
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
      freePostsCount: {
        type: DataTypes.INTEGER,
        defaultValue: 2,
      },
      postsCoinsCost: {
        type: DataTypes.INTEGER,
        defaultValue: 25,
      },
      appName: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Bazaryo',
      },
      openAiApiKey: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      allowAiResponsesOnUnvalidatedEmails: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      freeAiResponses: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      aiResponsesPriceInCoins: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      maxAiResponsesPerUser: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2,
      },
      allowValidationRequest: {
        type: sequelize.DataTypes.BOOLEAN,
        defaultValue: true,
      },
      lockChatForSeller: {
        type: sequelize.DataTypes.BOOLEAN,
        defaultValue: false,
      },
      unlockChatCoinsCost: {
        type: sequelize.DataTypes.INTEGER,
        defaultValue: 5,
      },
      emailValidationEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      allowUnvalidatedUsersToCreatePosts: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      allowAnonymousUsersToCreatePosts: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      profilePageLayout: {
        type: DataTypes.ENUM('sidebar', 'tabs'),
        defaultValue: 'tabs',
      },
      accountPageLayout: {
        type: DataTypes.ENUM('sidebar', 'tabs'),
        defaultValue: 'tabs',
      },
      webAppUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      vapidPrivateKey: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      vapidPublicKey: {
        type: DataTypes.STRING,
      },
      vapidSupportEmail: {
        type: DataTypes.STRING,
      },
      stripeSecretKey: {
        type: DataTypes.STRING,
      },
      stripeWehookSigningSecret: {
        type: DataTypes.STRING,
      },
      paypalClientId: {
        type: DataTypes.STRING,
      },
      paypalClientSecret: {
        type: DataTypes.STRING,
      },
      razorpayKeyId: {
        type: DataTypes.STRING,
      },
      razorpaySecretKey: {
        type: DataTypes.STRING,
      },
      razorpayWebhookSecret: {
        type: DataTypes.STRING,
      },
      googleCloudStorageBucket: {
        type: DataTypes.STRING,
      },
      awsAccessKeyId: {
        type: DataTypes.STRING,
      },
      awsSecretAccessKey: {
        type: DataTypes.STRING,
      },
      awsStorageBucket: {
        type: DataTypes.STRING,
      },
      awsStorageRegion: {
        type: DataTypes.STRING,
      },
      googleMapsApiKey: {
        type: DataTypes.STRING,
      },
      googlePlayLink: {
        type: DataTypes.STRING,
      },
      appStoreLink: {
        type: DataTypes.STRING,
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
    modelConfig
  )
}

function initAssociations() {
  Settings.hasOne(Currency, {
    foreignKey: 'id',
    sourceKey: 'defaultCurrencyId',
    as: 'defaultCurrency',
    onDelete: 'cascade',
  })

  Settings.afterUpdate(() => {
    deleteDataFromCache(SETTINGS_CACHE_KEY)
  })

  Settings.afterDestroy(() => {
    deleteDataFromCache(SETTINGS_CACHE_KEY)
  })

  Settings.afterCreate(() => {
    deleteDataFromCache(SETTINGS_CACHE_KEY)
  })
}
