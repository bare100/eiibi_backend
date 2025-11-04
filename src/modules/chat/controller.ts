import { Request, Response } from 'express'
import { GENERAL } from '../../constants/errors.js'
import { ChatGroupRepository } from './repository.js'
import { Account } from '../accounts/model.js'
import { FCMNotificationService } from '../../lib/notifications/index.js'
import { WebSocketInstance } from '../../ws/instance.js'
import { WebsocketEvents } from '../../ws/socket-module.js'
import { ChatMessage } from '../auxiliary-models/chat-message.js'
import { TranslationManager } from '../../lib/translation-manager.js'
import { SettingsRepository } from '../settings/repository.js'
import { config } from '../../config.js'

export class ChatGroupsController {
  public static async sendLocationMessage(req: Request, res: Response) {
    const { account } = res.locals
    const { id, groupId, latitude, longitude } = req.body

    try {
      const chatGroupExists = await ChatGroupRepository.getOneById(groupId)
      if (!chatGroupExists) {
        return res.status(400).send({ error: GENERAL.BAD_REQUEST })
      }

      if (
        chatGroupExists.firstAccountId !== account.id &&
        chatGroupExists.secondAccountId !== account.id
      ) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      const createdMessage = await ChatGroupRepository.createMessage({
        id,
        chatGroupId: groupId,
        fromAccountId: account.id,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        type: 'location',
      })

      const otherAccountId =
        chatGroupExists.firstAccountId === account.id
          ? chatGroupExists.secondAccountId
          : chatGroupExists.firstAccountId

      FCMNotificationService.sendNewMessage(otherAccountId, account, chatGroupExists.id)

      const socketInstance = WebSocketInstance.getInstance()
      socketInstance.sendEventToAccount(otherAccountId, WebsocketEvents.NEW_MESSAGE, {
        ...createdMessage.toJSON(),
      })

      return res.status(200).send(createdMessage)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async sendAssetsMessage(req: Request, res: Response) {
    const { account } = res.locals
    const { id, groupId } = req.body

    try {
      if (!account.email) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      if (!id || !groupId) {
        return res.status(400).send({ error: GENERAL.BAD_REQUEST })
      }

      const files = req.files as Express.Multer.File[]
      if (!files || !files.length) {
        return res.status(400).send({ error: GENERAL.BAD_REQUEST })
      }

      const chatGroupExists = await ChatGroupRepository.getOneById(groupId)
      if (!chatGroupExists) {
        return res.status(400).send({ error: GENERAL.BAD_REQUEST })
      }

      if (
        chatGroupExists.firstAccountId !== account.id &&
        chatGroupExists.secondAccountId !== account.id
      ) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      const createdMessage = await ChatGroupRepository.createAssetsMessage(
        {
          id,
          chatGroupId: groupId,
          fromAccountId: account.id,
        },
        files
      )

      const otherAccountId =
        chatGroupExists.firstAccountId === account.id
          ? chatGroupExists.secondAccountId
          : chatGroupExists.firstAccountId

      FCMNotificationService.sendNewMessage(otherAccountId, account, chatGroupExists.id)

      const socketInstance = WebSocketInstance.getInstance()
      socketInstance.sendEventToAccount(otherAccountId, WebsocketEvents.NEW_MESSAGE, {
        ...createdMessage.toJSON(),
      })

      return res.status(200).send(createdMessage)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async sendMessage(req: Request, res: Response) {
    const { account } = res.locals
    const { id, message, groupId } = req.body

    try {
      if (!account.email) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      if (!id || !message || !groupId) {
        return res.status(400).send({ error: GENERAL.BAD_REQUEST })
      }

      const chatGroupExists = await ChatGroupRepository.getOneById(groupId)
      if (!chatGroupExists) {
        return res.status(400).send({ error: GENERAL.BAD_REQUEST })
      }

      if (
        chatGroupExists.firstAccountId !== account.id &&
        chatGroupExists.secondAccountId !== account.id
      ) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      const createdMessage = await ChatGroupRepository.createMessage({
        id,
        message,
        chatGroupId: groupId,
        fromAccountId: account.id,
      })

      const otherAccountId =
        chatGroupExists.firstAccountId === account.id
          ? chatGroupExists.secondAccountId
          : chatGroupExists.firstAccountId

      FCMNotificationService.sendNewMessage(otherAccountId, account, chatGroupExists.id)

      const socketInstance = WebSocketInstance.getInstance()
      socketInstance.sendEventToAccount(otherAccountId, WebsocketEvents.NEW_MESSAGE, {
        ...createdMessage.toJSON(),
      })

      return res.status(200).send(createdMessage)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async getOrCreateWithAccount(req: Request, res: Response) {
    const { account } = res.locals
    const { accountId } = req.params
    const { postId } = req.body

    try {
      if (!account.email) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      const destAccount = await Account.findByPk(accountId)
      if (!destAccount) {
        return res.status(400).send({ error: GENERAL.BAD_REQUEST })
      }

      let existingGroupChat = await ChatGroupRepository.getForAccounts(account.id, accountId)

      if (existingGroupChat) {
        let postAdded = false
        if (postId) {
          postAdded = await ChatGroupRepository.addPostToChatGroup(existingGroupChat.id, postId)
        }
        if (postAdded) {
          existingGroupChat = await ChatGroupRepository.getForAccounts(account.id, accountId)
        }
        return res.status(200).json(existingGroupChat)
      }

      const savedGroup = await ChatGroupRepository.createChatGroup(account.id, accountId, postId)
      const newChatGroupData = await ChatGroupRepository.findChatGroupById(savedGroup.id)

      const chatGroupDetails = await ChatGroupRepository.getChatGroupById(savedGroup.id)
      const socketInstance = WebSocketInstance.getInstance()
      socketInstance.sendEventToAccount(accountId, WebsocketEvents.NEW_CHAT_GROUP, {
        ...chatGroupDetails.toJSON(),
      })
      return res.status(200).json(newChatGroupData)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async getForAccount(req: Request, res: Response) {
    const { account } = res.locals

    try {
      const chatGroups = await ChatGroupRepository.getForAccount(account.id)
      return res.status(200).json(chatGroups)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async deleteMessages(req: Request, res: Response) {
    const { account } = res.locals
    const { groupId } = req.params
    const { messagesIds } = req.body

    try {
      const chatGroup = await ChatGroupRepository.getOneById(groupId)
      if (!chatGroup) {
        return res.status(404).send({ error: GENERAL.NOT_FOUND })
      }

      if (chatGroup.firstAccountId !== account.id && chatGroup.secondAccountId !== account.id) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      await ChatGroupRepository.deleteMessagesForGroup(groupId, messagesIds)

      const otherAccountId =
        chatGroup.firstAccountId === account.id
          ? chatGroup.secondAccountId
          : chatGroup.firstAccountId

      const socketInstance = WebSocketInstance.getInstance()
      socketInstance.sendEventToAccount(otherAccountId, WebsocketEvents.MESSAGES_REMOVED, {
        groupId,
        messagesIds,
      })

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async unlockChatGroup(req: Request, res: Response) {
    const { account } = res.locals
    const { groupId } = req.params

    try {
      const chatGroup = await ChatGroupRepository.getOneById(groupId)
      if (!chatGroup) {
        return res.status(404).send({ error: GENERAL.NOT_FOUND })
      }
      if (chatGroup.firstAccountId !== account.id && chatGroup.secondAccountId !== account.id) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      const settings = await SettingsRepository.get()
      const unlockCost = settings.unlockChatCoinsCost ?? config.UNLOCK_CHAT_COINS_COST

      if (account.coins - unlockCost < 0) {
        return res.status(500).send({ error: GENERAL.NOT_ENOUGH_COINS })
      }

      await ChatGroupRepository.unlockChat(groupId, account.id, unlockCost)
      return res.status(200).json({ success: true })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async markMessagesAsSeen(req: Request, res: Response) {
    const { account } = res.locals
    const { groupId } = req.params

    try {
      const chatGroup = await ChatGroupRepository.getOneById(groupId)
      if (!chatGroup) {
        return res.status(404).send({ error: GENERAL.NOT_FOUND })
      }

      if (chatGroup.firstAccountId !== account.id && chatGroup.secondAccountId !== account.id) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      await ChatGroupRepository.markMessagesAsSeen(groupId, account.id)

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async getMessages(req: Request, res: Response) {
    const { account } = res.locals
    const { groupId, page, perPage } = req.params

    try {
      const chatGroup = await ChatGroupRepository.getOneById(groupId)
      if (!chatGroup) {
        return res.status(404).send({ error: GENERAL.NOT_FOUND })
      }

      if (chatGroup.firstAccountId !== account.id && chatGroup.secondAccountId !== account.id) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      const messages = await ChatGroupRepository.getMessagesForGroup(
        groupId,
        parseInt(page.toString() ?? '0'),
        parseInt(perPage.toString() ?? '20')
      )
      return res.status(200).json(messages)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async getById(req: Request, res: Response) {
    const { account } = res.locals
    const { groupId } = req.params

    try {
      const chatGroup = await ChatGroupRepository.getChatGroupById(groupId)
      if (!chatGroup) {
        return res.status(404).send({ error: GENERAL.NOT_FOUND })
      }

      if (chatGroup.firstAccountId !== account.id && chatGroup.secondAccountId !== account.id) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      return res.status(200).json(chatGroup)
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async translateMessage(req: Request, res: Response) {
    const { messageId, lang } = req.params

    try {
      const message = await ChatMessage.findByPk(messageId)
      if (!message) {
        return res.status(404).send({ error: GENERAL.NOT_FOUND })
      }

      const translatedMessage = await TranslationManager.translate(message.message, lang)
      return res.status(200).json(translatedMessage)
    } catch (error) {
      console.error(`Cannot translate message: ${error}`)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }

  public static async getForTwoAccounts(req: Request, res: Response) {
    const { account } = res.locals
    const { firstAccountId, secondAccountId } = req.params

    try {
      if (!account.email) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      if (firstAccountId !== account.id && secondAccountId !== account.id) {
        return res.status(403).send({ error: GENERAL.FORBIDDEN })
      }

      const chatGroup = await ChatGroupRepository.getForTwoAccounts(firstAccountId, secondAccountId)

      return res.status(200).json(chatGroup)
    } catch (error) {
      console.error(`Cannot get chat group for two accounts: ${error}`)
      res.status(500).send({ error: GENERAL.SOMETHING_WENT_WRONG })
    }
  }
}
