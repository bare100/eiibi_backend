import { Request, Response } from 'express'
import { config } from '../../config.js'
import { GENERAL } from '../../constants/errors.js'
import { PaymentsRepository } from './repository.js'
import { WebSocketInstance } from '../../ws/instance.js'
import { WebsocketEvents } from '../../ws/socket-module.js'
import { Account } from '../accounts/model.js'
import { StripeInstance } from './stripe-instance.js'
import crypto from 'crypto'
import { SettingsRepository } from '../settings/repository.js'
import { RazorpayInstance } from './razorpay-instance.js'
import { PaypalInstance } from './paypal-instance.js'

export class PaymentsController {
  public static async createPaymentSession(req: Request, res: Response) {
    const { account } = res.locals
    try {
      const { productId, currencyId } = req.body

      const paymentIntent = await StripeInstance.createPaymentSession(
        account.id,
        productId,
        currencyId
      )
      return res.status(200).json(paymentIntent)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async handlePaypalCapture(req: Request, res: Response) {
    const { orderId } = req.body
    try {
      if (!orderId) {
        return res.status(400).send({ error: GENERAL.BAD_REQUEST })
      }
      await PaypalInstance.capturePayment(orderId)
      return res.status(200).json({ success: true })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async createPaypalPaymentSession(req: Request, res: Response) {
    const { account } = res.locals
    try {
      const { productId, currencyId } = req.body
      const approvalUrl = await PaypalInstance.createPaymentSession(
        account.id,
        productId,
        currencyId
      )
      return res.status(200).json(approvalUrl)
    } catch (error) {
      console.log('error', error)
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async createRazorpayOrder(req: Request, res: Response) {
    const { account } = res.locals
    try {
      const { productId, currencyId } = req.body
      const orderId = await RazorpayInstance.createPayment(account.id, productId, currencyId)
      return res.status(200).json({ orderId })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async handleRazorpayWebhook(req: Request, res: Response) {
    try {
      if (req.body.event !== 'payment.authorized') {
        return res.status(200).json({ success: true })
      }

      const settings = await SettingsRepository.get()
      const webhookSecret = settings?.razorpayWebhookSecret || config.RAZORPAY.WEBHOOK_SECRET

      const signature = req.headers['x-razorpay-signature'] as string
      const hmac = crypto.createHmac('sha256', webhookSecret)
      hmac.update(JSON.stringify(req.body))
      const digest = hmac.digest('hex')

      if (digest !== signature) {
        console.error(`Razorpay webhook signature mismatch`)
        return res.status(400).json({ error: GENERAL.BAD_REQUEST })
      }

      const payment = req.body.payload.payment.entity
      const { accountId, productId, currencyId } = payment.notes
      await RazorpayInstance.handleRazorpaySuccessfulPayment(
        payment.id,
        accountId,
        productId,
        currencyId,
        payment.amount / 100
      )
      return res.status(200).json({ success: true })
    } catch (error) {
      console.error(`Could not verify razorpay webhook: ${error}`)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async getAvailablePayments(req: Request, res: Response) {
    const payments = []
    const settings = await SettingsRepository.get()
    const paypalClientId = settings?.paypalClientId || config.PAYPAL.CLIENT_ID
    const paypalClientSecret = settings?.paypalClientSecret || config.PAYPAL.CLIENT_SECRET
    const stripeSecretKey = settings?.stripeSecretKey || config.STRIPE.SECRET_KEY
    const razorpaySecretKey = settings?.razorpaySecretKey || config.RAZORPAY.SECRET_KEY
    const razorpayKeyId = settings?.razorpayKeyId || config.RAZORPAY.KEY_ID

    if (paypalClientId?.length && paypalClientSecret?.length) {
      payments.push('paypal')
    }
    if (stripeSecretKey?.length) {
      payments.push('stripe')
    }
    if (razorpaySecretKey?.length && razorpayKeyId?.length) {
      payments.push('razorpay')
    }

    return res.status(200).json({ payments })
  }

  public static async getAllPaymentProducts(req: Request, res: Response) {
    try {
      const flatProducts = config.PAYMENT_PRODUCTS.reduce(
        (acc: { coins: number; productId: string }[], product) => {
          const products = product.products.map((productId) => ({
            coins: product.coins,
            productId,
          }))
          acc.push(...products)
          return acc
        },
        []
      )
      return res.status(200).json(flatProducts)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async handleStripeWebhook(req: Request, res: Response) {
    let data
    let event
    try {
      const settings = await SettingsRepository.get()
      const webhookSecret =
        settings?.stripeWehookSigningSecret || config.STRIPE.WEBHOOK_SIGNING_SECRET
      const signature = req.headers['stripe-signature']
      const stripe = await StripeInstance.getStripe()
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret)
      data = event.data
    } catch (err) {
      console.error(`[SUBSCRIPTION]: Cannot get stripe event ${err}`)
      return res.sendStatus(400)
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          const { accountId, productId, currencyId } = data.object.metadata
          if (!accountId || !productId || !currencyId) {
            console.error(`[SUBSCRIPTION]: Cannot get accountId or productId from stripe event`)
            return res.sendStatus(400)
          }

          await PaymentsRepository.handleProviderPayment({
            accountId,
            productId,
            currencyId,
            transactionId: data.object.id,
            paidAmount: data.object.amount_total / 100,
            createdAt: new Date(data.object.created * 1000),
          })

          break
        default:
          console.log(`Unhandled event type ${event.type}`)
          break
      }
      return res.status(200).json({ success: true })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async handlePayment(req: Request, res: Response) {
    try {
      if (req.headers.authorization !== config.PAYMENT_AUTH_KEY) {
        return res.status(403).json({ success: false })
      }

      await PaymentsRepository.handlePayment(req.body.event)

      const { app_user_id } = req.body.event
      if (app_user_id) {
        const socketInstance = WebSocketInstance.getInstance()
        const account = await Account.findByPk(app_user_id)

        socketInstance.sendEventToAccount(app_user_id, WebsocketEvents.COINS_UPDATED, {
          coins: account.coins,
        })
      }

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }
}
