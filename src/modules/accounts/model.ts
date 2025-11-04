import sequelize from 'sequelize'
import { DataTypes, Model } from 'sequelize'
import { getModelConfig } from '../../utils/db.js'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { Notification } from '../notifications/model.js'
import { SearchHistoryItem } from '../search-history/model.js'
import { Post } from '../posts/model.js'
import { NotificationTypes } from '../../lib/notifications/types.js'
import { Asset } from '../assets/model.js'
import { Category } from '../categories/model.js'
import { Payment } from '../payments/model.js'
import { Currency } from '../currencies/model.js'

export class Account extends Model {
  declare id: string
  declare name: string
  declare authId: string
  declare email: string
  declare rawEmail: string
  declare picture: string
  declare isAnonymous: boolean
  declare acceptedTermsAndCondition: boolean
  declare deviceFCMToken?: string
  declare identities: Record<string, string[]>
  declare allowedNotifications: Record<NotificationTypes, boolean>
  declare meta: Record<string, unknown>
  declare assetId?: string
  declare coins: number
  declare phone?: string

  declare locationPretty: string
  declare locationLat: number
  declare locationLong: number

  declare preferredCategoriesIds: string[]
  declare categoriesSetupDone: boolean

  declare blockedAccounts?: string[]

  declare introDone: boolean
  declare introSkipped: boolean
  declare selectedCurrencyId: string

  declare verified: boolean
  declare verifiedAt?: Date
  declare verificationRequestedAt?: Date

  declare aiResponsesCount: number

  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  declare readonly notifications: Notification[]
  declare readonly searchHistory: SearchHistoryItem[]
  declare readonly payments: Payment[]
  declare readonly posts: Post[]
  declare readonly accountFavourites: Post[]
  declare readonly preferredCategories: Category[]

  declare readonly asset: Asset
  declare readonly selectedCurrency?: Currency

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.ACCOUNTS)

  Account.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
        get() {
          const name = this.getDataValue('name')
          if (name) {
            return name
          }

          const rawEmail = this.getDataValue('email')
          const [localPart] = (rawEmail ?? '').split('@')
          return localPart
        },
      },
      email: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: true,
        validate: {
          isEmail: true,
        },
        get() {
          return `${'*'.repeat(7)}`
        },
      },
      authId: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      identities: DataTypes.JSON,
      rawEmail: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('email')
        },
      },
      phone: {
        type: sequelize.STRING,
        allowNull: true,
      },
      blockedAccounts: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
      },
      deviceFCMToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      introDone: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      introSkipped: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isAnonymous: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      picture: DataTypes.TEXT,
      assetId: {
        type: DataTypes.UUID,
        references: {
          model: DATABASE_MODELS.ASSETS,
          key: 'id',
        },
        allowNull: true,
      },
      acceptedTermsAndCondition: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      meta: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      preferredCategoriesIds: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        allowNull: true,
        defaultValue: [],
      },
      aiResponsesCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      selectedCurrencyId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: DATABASE_MODELS.CURRENCIES,
          key: 'id',
        },
      },
      categoriesSetupDone: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      coins: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      locationPretty: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      locationLat: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      locationLong: {
        type: DataTypes.DOUBLE,
        allowNull: true,
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
      verified: {
        type: sequelize.DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      verifiedAt: {
        type: sequelize.DataTypes.DATE,
        allowNull: true,
      },
      verificationRequestedAt: {
        type: sequelize.DataTypes.DATE,
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
    modelConfig
  )
}

function initAssociations() {
  Account.hasOne(Asset, {
    foreignKey: 'id',
    as: 'asset',
    sourceKey: 'assetId',
  })

  Account.hasOne(Currency, {
    foreignKey: 'id',
    sourceKey: 'selectedCurrencyId',
    as: 'selectedCurrency',
    onDelete: 'cascade',
  })

  Account.hasMany(Notification, {
    foreignKey: 'accountId',
    as: 'notifications',
    onDelete: 'cascade',
  })

  Account.hasMany(Category, {
    foreignKey: 'id',
    as: 'preferredCategories',
    sourceKey: 'preferredCategoriesIds',
  })

  Account.hasMany(SearchHistoryItem, {
    foreignKey: 'accountId',
    as: 'searchHistory',
    onDelete: 'cascade',
  })

  Account.hasMany(Post, {
    foreignKey: 'accountId',
    as: 'posts',
    onDelete: 'cascade',
  })

  Account.belongsToMany(Post, {
    through: { model: DATABASE_MODELS.ACCOUNT_FAVOURITES },
    foreignKey: 'accountId',
    otherKey: 'postId',
    as: 'accountFavourites',
  })

  Account.hasMany(Payment, {
    as: 'payments',
    foreignKey: 'accountId',
  })
}
