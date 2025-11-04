import multer from 'multer'
import { Router } from 'express'
import { Authenticator } from '../middlewares/auth.js'
import { HttpRateLimiter } from '../middlewares/rate-limiter.js'
import { ChatGroupsController } from '../../modules/chat/controller.js'
import { valdiateFilesInRequest } from '../middlewares/upload.js'

const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
})

const chatGroupRouter = Router()
chatGroupRouter.use(await Authenticator.authenticateHttp())
chatGroupRouter.use(HttpRateLimiter.limitRequestsForUser)

chatGroupRouter.get('/', ChatGroupsController.getForAccount)
chatGroupRouter.get('/:groupId', ChatGroupsController.getById)
chatGroupRouter.get('/messages/:groupId/:page/:perPage', ChatGroupsController.getMessages)
chatGroupRouter.get('/:firstAccountId/:secondAccountId', ChatGroupsController.getForTwoAccounts)
chatGroupRouter.get('/translate/:messageId/:lang', ChatGroupsController.translateMessage)

chatGroupRouter.post('/:accountId', ChatGroupsController.getOrCreateWithAccount)
chatGroupRouter.post('/message/new', ChatGroupsController.sendMessage)

chatGroupRouter.post(
  '/message/new/assets',
  // @ts-ignore
  upload.array('files'),
  valdiateFilesInRequest,
  ChatGroupsController.sendAssetsMessage
)
chatGroupRouter.post(
  '/message/new/location',
  valdiateFilesInRequest,
  ChatGroupsController.sendLocationMessage
)

chatGroupRouter.post('/delete/messages/:groupId', ChatGroupsController.deleteMessages)

chatGroupRouter.put('/seen/:groupId', ChatGroupsController.markMessagesAsSeen)
chatGroupRouter.put('/unlock/:groupId', ChatGroupsController.unlockChatGroup)

export { chatGroupRouter }
