import { DataTypes, Model } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import sequelize from 'sequelize'
import { getModelConfig } from '../../utils/db.js'

export class TranslationCache extends Model {
  declare id: number
  declare fromLanguage: string
  declare toLanguage: string
  declare initialText: string
  declare translatedText: string

  declare createdAt: Date
  declare updatedAt: Date

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.TRANSLATIONS_CACHE)
  TranslationCache.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      fromLanguage: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      toLanguage: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      initialText: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      translatedText: {
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
    modelConfig
  )
}

function initAssociations() {}
