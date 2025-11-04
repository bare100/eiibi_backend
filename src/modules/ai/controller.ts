import { Request, Response } from 'express'
import { AI_ERRORS, GENERAL } from '../../constants/errors.js'
import { config } from '../../config.js'
import { AssetStorageHandler } from '../../lib/storage/index.js'
import { CategoriesRepository } from '../categories/repository.js'
import { SettingsRepository } from '../settings/repository.js'
import { Account } from '../accounts/model.js'
import { OpenAIService } from '../../lib/openai-service.js'
import { AiResponse } from '../auxiliary-models/ai-responses.js'

export class AiController {
  public static async aiIsEnabled(req: Request, res: Response) {
    try {
      const settings = await SettingsRepository.get()
      const storageType = await AssetStorageHandler.getStorageType()

      const enabled =
        (settings.openAiApiKey !== '' || config.OPENAI.API_KEY !== '') && storageType !== 'disk'
      return res.status(200).json({ enabled })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async generateFromImages(req: Request, res: Response) {
    const settings = await SettingsRepository.get()
    if (settings.openAiApiKey === '' && config.OPENAI.API_KEY === '') {
      return res.status(400).send({ error: GENERAL.AI_NOT_ENABLED })
    }

    const storageType = await AssetStorageHandler.getStorageType()
    if (storageType === 'disk') {
      console.info(`[AI] Genetate from image functionality not available for disk storage`)
      return res.status(400).send({ error: AI_ERRORS.FUNCTIONALITY_NOT_AVAILABLE })
    }

    const account = res.locals.account as Account
    if (!account?.id) {
      console.info(`[AI] Account not found`)
      return res.status(400).send({ error: GENERAL.FORBIDDEN })
    }

    const accountReachedMaxAiResponses = account.aiResponsesCount >= settings.maxAiResponsesPerUser
    if (accountReachedMaxAiResponses) {
      console.info(`[AI] Account ${account.id} reached max ai responses`)
      return res.status(400).send({ error: AI_ERRORS.MAX_AI_RESPONSES_REACHED })
    }

    const accountReachedFreeAiResponses = account.aiResponsesCount >= settings.freeAiResponses
    if (accountReachedFreeAiResponses) {
      if (account.coins < settings.aiResponsesPriceInCoins) {
        console.info(`[AI] Account ${account.id} reached free ai responses`)
        return res.status(400).send({ error: GENERAL.NOT_ENOUGH_COINS })
      }
    }

    try {
      const { currency } = req.body
      const files = req.files as Express.Multer.File[]
      if (!files || files.length === 0) {
        return res.status(400).send({ error: GENERAL.NO_FILES_UPLOADED })
      }

      const uploadedFiles = await Promise.all(
        files.map((file) => {
          return AssetStorageHandler.upload(file)
        })
      )

      const fileUrls = await Promise.all(
        uploadedFiles.map((file) => {
          return AssetStorageHandler.getFileUrl(file.filename)
        })
      )

      const allCategories = await CategoriesRepository.getAllWithoutCount()
      const subCategories = allCategories
        .filter((category) => !!category.parentCategoryId)
        .map((category) => category.name['en'] ?? category.name[Object.keys(category.name)[0]])

      const result = await OpenAIService.analyzeImages(fileUrls, currency, subCategories)

      // Delete uploaded files
      await Promise.all(
        uploadedFiles.map((file) => {
          return AssetStorageHandler.delete(file.filename)
        })
      )

      const aiResponse = {
        title: result.title,
        description: result.description,
        price: result.suggestedPrice?.amount,
        category: result.category,
      }

      const paidCoins = accountReachedFreeAiResponses ? settings.aiResponsesPriceInCoins : 0

      try {
        await Account.update(
          {
            aiResponsesCount: account.aiResponsesCount + 1,
            ...(accountReachedFreeAiResponses ? { coins: account.coins - paidCoins } : {}),
          },
          { where: { id: account.id } }
        )

        await AiResponse.create({
          accountId: account.id,
          type: 'generateFromImages',
          aiResponse,
          paidCoins,
        })
      } catch (error) {
        console.error(`[AI] Error updating account or creating ai response`, error)
      }

      return res.status(200).json(aiResponse)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }
}
