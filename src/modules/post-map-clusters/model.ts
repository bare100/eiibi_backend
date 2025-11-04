import { Model, DataTypes, literal } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { getModelConfig } from '../../utils/db.js'

export class PostMapCluster extends Model {
  declare id: string
  declare locationLat: number
  declare locationLong: number
  declare meta: Record<string, unknown>
  declare expiresAt: Date

  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.POST_MAP_CLUSTERS)

  PostMapCluster.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: literal('gen_random_uuid()'),
        primaryKey: true,
      },
      locationLat: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      locationLong: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      meta: {
        type: DataTypes.JSONB,
        allowNull: false,
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

function initAssociations() {}
