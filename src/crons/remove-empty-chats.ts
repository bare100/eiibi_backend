// This cron will run every hour, checking if there are any chat groups
// that do not have any messages. If so, it will remove the chat group.
// It will remove the chat group, only if both the first and second account
// are not connected to the server. This will make sure that the chat groups
// are not removed while any of the users are trying to send a message.
import { schedule } from 'node-cron'
import { DatabaseConnection } from '../database/index.js'
import { ChatGroup } from '../modules/chat/model.js'
import { ChatMessage } from '../modules/auxiliary-models/chat-message.js'
import { WebSocketInstance } from '../ws/instance.js'
import { ChatGroupPost } from '../modules/auxiliary-models/chat-group-posts.js'

export const runRemoveEmptyChatsCron = () => {
  // Running the cleanup function only after some time to make sure that
  // if the server is restarted, all the clients that were active,
  // have enough time to connect back to the server.
  setTimeout(() => {
    removeEmptyChats()
  }, 5000)

  schedule('0 * * * *', () => {
    console.log('Running remove empty chats cron 1')
    removeEmptyChats()
  })
}

const removeEmptyChats = async () => {
  const emptyChats = await ChatGroup.findAll({
    include: [{ model: ChatMessage, as: 'messages', required: false }],
    where: {
      '$messages.id$': null,
    },
  })

  if (!emptyChats.length) {
    return
  }

  const transaction = await DatabaseConnection.getInstance().transaction()

  try {
    const socketInstance = WebSocketInstance.getInstance()

    for (const chat of emptyChats) {
      const firstAccountConnected = socketInstance.accountIsConnected(chat.firstAccountId)
      const secondAccountConnected = socketInstance.accountIsConnected(chat.secondAccountId)
      if (firstAccountConnected || secondAccountConnected) {
        continue
      }

      await ChatGroupPost.destroy({
        where: {
          chatGroupId: chat.id,
        },
        transaction,
      })

      await chat.destroy({ transaction })
    }

    await transaction.commit()
  } catch (error) {
    console.error('Error in removeEmptyChats cron', error)
    await transaction.rollback()
  }
}
