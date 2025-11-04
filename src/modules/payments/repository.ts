import { Transaction } from 'sequelize'
import { config } from '../../config.js'
import { DEFAULT_VAT, PAYMENT_NUMBER_CONFIG } from '../../constants/index.js'
import { DatabaseConnection } from '../../database/index.js'
import { GenericRepository } from '../../lib/base-repository.js'
import { Account } from '../accounts/model.js'
import { Payment } from './model.js'
import { WebPaymentProductsRepository } from '../web-payment-products/repository.js'

interface PaymentMetadata {
  product_id: string
  purchased_at_ms: number
  environment: string
  transaction_id: string
  app_user_id: string
  currency: string
  price: number
  price_in_purchased_currency: number
  store: string
  type: string
}

class PaymentsRepository extends GenericRepository<Payment> {
  constructor() {
    super(Payment)
  }

  public async getByTransactionId(transactionId: string) {
    return await Payment.findOne({
      where: { transactionId },
    })
  }

  public async handleProviderPayment(payment: {
    transactionId: string
    accountId: string
    paidAmount: number
    productId: string
    currencyId: string
    createdAt: Date
    store?: string
  }) {
    const {
      accountId,
      transactionId,
      paidAmount,
      createdAt,
      productId,
      currencyId,
      store = 'stripe',
    } = payment

    const alreadyExists = await this.getByTransactionId(transactionId)
    if (alreadyExists) {
      console.log('Payment already exists')
      return
    }

    const account = await Account.findByPk(accountId)
    if (!account) {
      throw new Error(`Triggered stripe payment for non-existing account: ${accountId}`)
    }

    const realAmount = paidAmount

    const product = await WebPaymentProductsRepository.getById(productId)
    if (!product) {
      throw new Error(`Stripe product not found: ${productId}`)
    }

    const totalVatRon = this.calculateVatFromTotal(realAmount, DEFAULT_VAT)

    return await DatabaseConnection.getInstance().transaction(async (transaction: Transaction) => {
      const lastPayment = await Payment.findOne({
        order: [['number', 'DESC']],
        attributes: ['number'],
        transaction,
      })

      await Payment.create(
        {
          ...this.generateInvoiceNumber(lastPayment?.number),
          store,
          email: account.email,
          name: account.name,
          accountId: account.id,
          transactionId,
          purchasedAt: createdAt,
          amount: parseFloat((realAmount - totalVatRon).toFixed(2)),
          vatAmount: totalVatRon,
          totalAmount: parseFloat(realAmount.toFixed(2)),
          boughtPackage: productId,
          paidInCurrencyId: currencyId,
        },
        { transaction }
      )

      account.coins += product.coinsNo
      await account.save({ transaction })
    })
  }

  public async handlePayment(payment: PaymentMetadata) {
    const {
      app_user_id,
      product_id,
      transaction_id,
      price_in_purchased_currency,
      purchased_at_ms,
      type,
      store,
    } = payment

    if (type !== 'NON_RENEWING_PURCHASE') {
      throw new Error(`Payment type not supported: ${type}`)
    }

    const account = await Account.findByPk(app_user_id)
    if (!account) {
      throw new Error(`Triggered payment for non-existing account: ${app_user_id}`)
    }

    const product = config.PAYMENT_PRODUCTS.find((product) =>
      product.products.some((el) => el === product_id)
    )
    if (!product) {
      throw new Error(`Product not found: ${product_id}`)
    }

    const paymentAlreadyExists = await Payment.findOne({
      where: { transactionId: transaction_id },
    })

    if (paymentAlreadyExists) {
      throw new Error(`Payment already exists: ${transaction_id}`)
    }

    const totalVatRon = this.calculateVatFromTotal(price_in_purchased_currency, DEFAULT_VAT)

    const purchaseDate = new Date(purchased_at_ms)

    return await DatabaseConnection.getInstance().transaction(async (transaction: Transaction) => {
      const lastPayment = await Payment.findOne({
        order: [['number', 'DESC']],
        attributes: ['number'],
        transaction,
      })

      await Payment.create(
        {
          ...this.generateInvoiceNumber(lastPayment?.number),
          store,
          email: account.email,
          name: account.name,
          accountId: account.id,
          transactionId: transaction_id,
          purchasedAt: purchaseDate,
          amount: parseFloat((price_in_purchased_currency - totalVatRon).toFixed(2)),
          vatAmount: totalVatRon,
          totalAmount: parseFloat(price_in_purchased_currency.toFixed(2)),
          boughtPackage: product_id,
        },
        { transaction }
      )

      account.coins += product.coins
      await account.save({ transaction })
    })
  }

  private calculateVatFromTotal = (amount: number, vatRate: number) =>
    parseFloat((amount - amount / (1 + vatRate / 100)).toFixed(2))

  private generateInvoiceNumber = (lastNr) => {
    const { NUMBER_MIN_LENGTH, STARTING_NUMBER } = PAYMENT_NUMBER_CONFIG
    let seriesNumber = STARTING_NUMBER

    if (lastNr) {
      seriesNumber = lastNr + 1
    }

    const invoiceNumber = String(seriesNumber).padStart(NUMBER_MIN_LENGTH, '0')

    return {
      number: seriesNumber,
      invoiceNumber,
    }
  }
}

const paymentsRepositoryInstance = new PaymentsRepository()
Object.freeze(paymentsRepositoryInstance)

export { paymentsRepositoryInstance as PaymentsRepository }
