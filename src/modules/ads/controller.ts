import { Request, Response } from 'express'
import { GENERAL } from '../../constants/errors.js'
import { RewardAdRepository } from './repository.js'
import { WebSocketInstance } from '../../ws/instance.js'
import { WebsocketEvents } from '../../ws/socket-module.js'

export class RewardAdController {
  public static async storeStartedAd(req: Request, res: Response) {
    const { account } = res.locals
    const { adUnitId, hashCode } = req.body

    if (!adUnitId || !hashCode) {
      return res.status(400).send({ error: GENERAL.BAD_REQUEST })
    }

    try {
      const rewardAd = await RewardAdRepository.create({
        accountId: account.id,
        adHashCode: hashCode,
        adUnitId,
      })
      return res.status(200).send({ rewardAdId: rewardAd.id })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async giveReward(req: Request, res: Response) {
    const { account } = res.locals
    const { rewardAdId } = req.body

    if (!rewardAdId) {
      return res.status(400).send({ error: GENERAL.BAD_REQUEST })
    }

    try {
      const rewardAd = await RewardAdRepository.getOneById(rewardAdId)
      if (!rewardAd || rewardAd.accountId !== account.id) {
        return res.status(404).send({ error: GENERAL.NOT_FOUND })
      }

      const newAccountCoins = await RewardAdRepository.giveReward(rewardAdId)

      const socketInstance = WebSocketInstance.getInstance()
      socketInstance.sendEventToAccount(
        account.id,
        WebsocketEvents.COINS_UPDATED,
        { coins: newAccountCoins }
      )
      return res.status(200).send({ success: true })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }
}
