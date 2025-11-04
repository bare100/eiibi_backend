import { DataTypes, Model } from 'sequelize'
import { Account } from '../accounts/model.js'
import { Location } from '../auxiliary-models/location.js'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import sequelize from 'sequelize'
import { getModelConfig } from '../../utils/db.js'
import { Asset } from '../assets/model.js'
import { PostHistoryEvent } from '../auxiliary-models/post-history-events.js'
import { Currency } from '../currencies/model.js'
import { Comment } from '../comments/entity.js'

export class Post extends Model {
  declare id: string
  declare accountId: string

  declare locationId: string
  declare locationPretty: string
  declare locationLat: number
  declare locationLong: number

  declare mainCategoryId: string
  declare subCategoryId: string

  declare title: string
  declare description: string
  declare views: number
  declare isNewItem: boolean

  declare price: number
  declare hasCustomPrice: boolean
  declare youtubeLink: string | null

  declare vectors: Record<string, number[]>

  declare paidCoins: number
  declare coinsPaidBack: boolean

  declare initialCurrencyId: string
  declare initialPriceInDollars: number

  declare expiresAt: Date | null
  declare promotedAt: Date | null
  declare markedAsClosedAt: Date | null

  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  declare readonly account: Account
  declare readonly postAssets: Asset[]
  declare readonly postHistoryEvents: PostHistoryEvent[]
  declare readonly initialCurrency: Currency
  declare readonly comments: Comment[]

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.POSTS)

  Post.init(
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
      initialPriceInDollars: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      mainCategoryId: {
        type: DataTypes.UUID,
        references: {
          model: DATABASE_MODELS.CATEGORIES,
          key: 'id',
        },
      },
      initialCurrencyId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: DATABASE_MODELS.CURRENCIES,
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
      youtubeLink: {
        type: sequelize.DataTypes.STRING(500),
        allowNull: true,
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
      promotedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      vectors: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      markedAsClosedAt: {
        allowNull: true,
        type: DataTypes.DATE,
        defaultValue: null,
      },
      paidCoins: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      coinsPaidBack: {
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
    modelConfig
  )
}

function initAssociations() {
  Post.hasOne(Currency, {
    foreignKey: 'id',
    sourceKey: 'initialCurrencyId',
    as: 'initialCurrency',
    onDelete: 'cascade',
  })

  Post.hasOne(Location, {
    foreignKey: 'id',
    sourceKey: 'locationId',
    as: 'location',
    onDelete: 'cascade',
  })

  Post.hasMany(PostHistoryEvent, {
    foreignKey: 'postId',
    onDelete: 'cascade',
    as: 'postHistoryEvents',
  })

  Post.belongsTo(Account, {
    foreignKey: 'accountId',
    onDelete: 'cascade',
  })

  Post.belongsToMany(Account, {
    through: { model: DATABASE_MODELS.ACCOUNT_FAVOURITES },
    foreignKey: 'postId',
    otherKey: 'accountId',
    as: 'postLikes',
  })

  Post.belongsToMany(Asset, {
    through: { model: DATABASE_MODELS.POST_ASSETS },
    foreignKey: 'postId',
    otherKey: 'assetId',
    as: 'postAssets',
  })
}
