import Razorpay from 'razorpay'
import { config } from '../../config.js'
import { Currency } from '../currencies/model.js'
import { CurrenciesRepository } from '../currencies/repository.js'
import { WebPaymentProductsRepository } from '../web-payment-products/repository.js'
import { Account } from '../accounts/model.js'
import { PaymentsRepository } from './repository.js'
import { SettingsRepository } from '../settings/repository.js'

class RazorpayInstance {
  async getRazorpay() {
    const settings = await SettingsRepository.get()
    const razorpayKeyId = settings?.razorpayKeyId || config.RAZORPAY.KEY_ID
    const razorpaySecretKey = settings?.razorpaySecretKey || config.RAZORPAY.SECRET_KEY
    if (!razorpayKeyId || !razorpaySecretKey) {
      console.error('Razorpay key id and secret key are not provided')
      return null
    }

    return new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpaySecretKey,
    })
  }

  async createPayment(accountId: string, productId: string, currencyId: string) {
    const razorpay = await this.getRazorpay()
    if (!razorpay) {
      console.error('Razorpay instance is not initialized')
      throw new Error('Razorpay instance is not initialized')
    }

    try {
      const product = await WebPaymentProductsRepository.getById(productId)
      if (!product) {
        throw new Error('Product not found')
      }

      const currency = await Currency.findByPk(currencyId)
      if (!currency) {
        throw new Error('Currency not found')
      }

      const priceInPurchasedCurrency = await CurrenciesRepository.getPriceInCurrency(
        product.priceInUSD,
        currencyId
      )

      const integerPrice = Math.floor(priceInPurchasedCurrency)

      const order = await razorpay.orders.create({
        amount: integerPrice * 100,
        currency: currency.code,
        receipt: `order_rcptid_${Date.now()}`,
        payment_capture: true,
        notes: {
          accountId,
          productId,
          currencyId,
        },
      })

      return order.id
    } catch (error) {
      console.error(error)
      throw new Error('Failed to create Razorpay order')
    }
  }

  async handleRazorpaySuccessfulPayment(
    paymentId: string,
    accountId: string,
    productId: string,
    currencyId: string,
    amount: number
  ) {
    const account = await Account.findByPk(accountId)
    if (!account) {
      throw new Error('Account not found')
    }

    const product = await WebPaymentProductsRepository.getById(productId)
    if (!product) {
      throw new Error('Product not found')
    }

    const currency = await Currency.findByPk(currencyId)
    if (!currency) {
      throw new Error('Currency not found')
    }

    await PaymentsRepository.handleProviderPayment({
      accountId,
      productId,
      currencyId,
      store: 'razorpay',
      transactionId: paymentId,
      paidAmount: amount,
      createdAt: new Date(),
    })
  }
}

const razorpayInstance = new RazorpayInstance()
export { razorpayInstance as RazorpayInstance }
