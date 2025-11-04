import { Options } from 'sequelize'
import { config } from '../config.js'

const {
  POSTGRES_USER,
  POSTGRES_SERVER,
  SEQUELIZE_DEBUG,
  POSTGRES_CONNECTION_MAX_POOL,
  POSTGRES_DB,
} = config.DATABASE

export const sequalizeDbConfig: Options = {
  database: POSTGRES_DB,
  username: POSTGRES_USER,
  host: POSTGRES_SERVER,
  dialect: 'postgres',
  ssl: config.APP_ENV === 'production' ? true : false,
  // eslint-disable-next-line no-console
  logging: SEQUELIZE_DEBUG ? console.log : false,
  pool: {
    min: 0,
    max: POSTGRES_CONNECTION_MAX_POOL,
  },
  dialectOptions: {
    connectTimeout: 30000,
    charset: 'utf8',
    ...(config.APP_ENV === 'production'
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {}),
  },
}
