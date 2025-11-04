import { Model, DataTypes, literal } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { getModelConfig } from '../../utils/db.js'
import { Post } from '../posts/model.js'
import { Asset } from '../assets/model.js'

export class Category extends Model {
  declare id: string
  declare parentCategoryId?: string
  declare name: Record<string, string>
  declare details: Record<string, string>
  declare icon: string
  declare assetId?: string
  declare remoteIconUrl?: string
  declare vector: number[]

  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  declare readonly mainCategoryPosts: Post[]
  declare readonly subCategoryPosts: Post[]
  declare readonly subCategories: Category[]
  declare readonly parentCategory?: Category
  declare readonly asset?: Asset

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.CATEGORIES)

  Category.init(
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: literal('gen_random_uuid()'),
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
      remoteIconUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      assetId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: DATABASE_MODELS.ASSETS,
          key: 'id',
        },
      },
      details: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      vector: {
        type: DataTypes.ARRAY(DataTypes.FLOAT),
        allowNull: true,
        defaultValue: [],
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
  Category.belongsTo(Category, {
    foreignKey: 'parentCategoryId',
    as: 'parentCategory',
  })

  Category.hasMany(Category, {
    foreignKey: 'parentCategoryId',
    as: 'children',
  })

  Category.hasMany(Post, {
    foreignKey: 'mainCategoryId',
    as: 'mainCategoryPosts',
  })

  Category.hasMany(Post, {
    foreignKey: 'subCategoryId',
    as: 'subCategoryPosts',
  })

  Category.hasOne(Asset, {
    foreignKey: 'id',
    as: 'asset',
    sourceKey: 'assetId',
  })

  return
}
