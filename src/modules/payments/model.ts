import { Model, DataTypes, literal } from 'sequelize'
import { DATABASE_MODELS } from '../../constants/model-names.js'
import { Account } from '../accounts/model.js'
import { getModelConfig } from '../../utils/db.js'
import { Currency } from '../currencies/model.js'

export class Payment extends Model {
  declare id: string
  declare accountId: string
  declare number: number
  declare email: string
  declare name: string
  declare vatRate: number
  declare currency: string
  declare amount: number
  declare vatAmount: number
  declare totalAmount: number
  declare boughtPackage: string
  declare transactionId: string
  declare store: string
  declare purchasedAt: Date
  declare paidInCurrencyId: string | null

  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  declare paidInCurrency: Currency | null

  static initModel = initModel
  static initAssociations = initAssociations
}

function initModel(): void {
  const modelConfig = getModelConfig(DATABASE_MODELS.PAYMENTS)
  Payment.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: literal('gen_random_uuid()'),
        primaryKey: true,
      },
      accountId: {
        type: DataTypes.UUID,
      },
      number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(250),
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(250),
        allowNull: true,
      },
      vatRate: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 19,
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'RON',
      },
      amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      vatAmount: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      totalAmount: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      boughtPackage: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      transactionId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      store: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      purchasedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      paidInCurrencyId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: DATABASE_MODELS.CURRENCIES,
          key: 'id',
        },
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
  Payment.belongsTo(Account, {
    foreignKey: 'accountId',
    onDelete: 'cascade',
  })

  Payment.belongsTo(Currency, {
    foreignKey: 'paidInCurrencyId',
    onDelete: 'cascade',
    as: 'paidInCurrency',
  })
}
