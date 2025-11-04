import { Model, DataTypes, literal } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { getModelConfig } from '../../utils/db.js'

export class Asset extends Model {
  declare id: string
  declare path: string
  declare size: number
  declare initialName: string | null

  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.ASSETS)
  Asset.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: literal('gen_random_uuid()'),
        primaryKey: true,
      },
      path: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      initialName: {
        type: DataTypes.STRING,
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
  return
}
