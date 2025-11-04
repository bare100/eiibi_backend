import { GenericRepository } from '../../lib/base-repository.js'
import { UserMessage } from './model.js'

class UserMessagesRepository extends GenericRepository<UserMessage> {
  constructor() {
    super(UserMessage)
  }
}

const userMessageRepoInstance = new UserMessagesRepository()
Object.freeze(userMessageRepoInstance)

export { userMessageRepoInstance as UserMessagesRepository }
