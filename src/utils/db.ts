import { InitOptions } from 'sequelize'
import { DatabaseConnection } from '../database/index.js'

export const getModelConfig = (modelName: string): InitOptions => {
  const sequelize = DatabaseConnection.getInstance()

  return {
    sequelize,
    modelName,
  }
}
