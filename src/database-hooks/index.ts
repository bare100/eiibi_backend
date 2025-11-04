import { Account } from '../modules/accounts/model.js'
import { WebSocketInstance } from '../ws/instance.js'
import { WebsocketEvents } from '../ws/socket-module.js'

class DatabaseHooksManager {
  init = () => {
    Account.afterUpdate((account) => {
      this.sendCoinsUpdatedEvent(account.dataValues)
    })
  }

  private sendCoinsUpdatedEvent = async (account: Account) => {
    try {
      const socketInstance = WebSocketInstance.getInstance()
      socketInstance.sendEventToAccount(
        account.id,
        WebsocketEvents.COINS_UPDATED,
        { coins: account.coins }
      )
    } catch (error) {
      console.error(
        `Could not send coins updated event for account ${account.id}`,
        error
      )
    }
  }
}

const databaseHooksManager = new DatabaseHooksManager()
export { databaseHooksManager as DatabaseHooksManager }
