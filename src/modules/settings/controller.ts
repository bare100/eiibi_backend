import { Request, Response } from 'express'
import { GENERAL } from '../../constants/errors.js'
import { SettingsRepository } from './repository.js'
import { config } from '../../config.js'

export class SettingsController {
  public static async get(req: Request, res: Response) {
    try {
      const settings = (await SettingsRepository.get()) as any
      if (!settings) {
        return res.status(404).send({ error: GENERAL.NOT_FOUND })
      }

      const result = { ...settings }
      result.androidAdsCredentials = {
        banner: settings.androidAdsBannerId,
        interstitial: settings.androidAdsInterstitialId,
        rewarded: settings.androidAdsRewardedId,
      }

      result.iosAdsCredentials = {
        banner: settings.iosAdsBannerId,
        interstitial: settings.iosAdsInterstitialId,
        rewarded: settings.iosAdsRewardedId,
      }

      const keysToDelete = [
        'vapidPrivateKey',
        'stripeSecretKey',
        'stripeWehookSigningSecret',
        'paypalClientId',
        'paypalClientSecret',
        'razorpayKeyId',
        'razorpaySecretKey',
        'razorpayWebhookSecret',
        'googleCloudStorageBucket',
        'awsAccessKeyId',
        'awsSecretAccessKey',
        'awsStorageBucket',
        'awsStorageRegion',
        'googleMapsApiKey',
        'openAiApiKey',
      ]

      keysToDelete.forEach((key) => {
        delete result[key]
      })

      const aiEnabled = settings.openAiApiKey !== '' || config.OPENAI.API_KEY !== ''
      return res.status(200).json({ ...result, aiEnabled })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }
}
