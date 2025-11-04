import { Sequelize } from 'sequelize'
import { config } from '../config.js'
import { Account } from '../modules/accounts/model.js'
import { Post } from '../modules/posts/model.js'
import { Asset } from '../modules/assets/model.js'
import { PostAsset } from '../modules/auxiliary-models/post-assets.js'
import { Category } from '../modules/categories/model.js'
import { Location } from '../modules/auxiliary-models/location.js'
import { Favourite } from '../modules/favourites/model.js'
import { Follower } from '../modules/followers/model.js'
import { Notification } from '../modules/notifications/model.js'
import { SearchHistoryItem } from '../modules/search-history/model.js'
import { Report } from '../modules/reports/model.js'
import { ChatGroup } from '../modules/chat/model.js'
import { ChatMessage } from '../modules/auxiliary-models/chat-message.js'
import { LastSeenPost } from '../modules/last-seen/model.js'
import { FilterItem } from '../modules/filters/model.js'
import { PostSimilarity } from '../modules/post-similarities/model.js'
import { Payment } from '../modules/payments/model.js'
import { Settings } from '../modules/settings/model.js'
import { RewardAd } from '../modules/ads/model.js'
import { NotificationContent } from '../modules/auxiliary-models/notification-content.js'
import { PushSubscription } from '../modules/auxiliary-models/push-subscription.js'
import { PostMapCluster } from '../modules/post-map-clusters/model.js'
import { ChatGroupPost } from '../modules/auxiliary-models/chat-group-posts.js'
import { PostHistoryEvent } from '../modules/auxiliary-models/post-history-events.js'
import { Comment } from '../modules/comments/entity.js'
import { UserMessage } from '../modules/user-messages/model.js'
import { Currency } from '../modules/currencies/model.js'
import { ExchangeRate } from '../modules/exchange-rates/model.js'
import { WebPaymentProduct } from '../modules/web-payment-products/model.js'
import { TranslationCache } from '../modules/auxiliary-models/translations-cache.js'
import { AiResponse } from '../modules/auxiliary-models/ai-responses.js'

let sequalizee

export const DatabaseConnection = {
  init(databaseConfig) {
    if (sequalizee) {
      throw new Error('Sequelize already initialized')
    }

    sequalizee = new Sequelize(databaseConfig)
  },

  async syncLatestModels() {
    if (config.APP_ENV !== 'test') {
      throw new Error('Use migrations when on environment different than the test one')
    }

    await sequalizee.sync()
  },

  getInstance() {
    return sequalizee
  },

  initializeModels() {
    const models = [
      Account,
      Post,
      Asset,
      PostAsset,
      Category,
      Location,
      Favourite,
      Follower,
      Notification,
      SearchHistoryItem,
      Report,
      ChatGroup,
      ChatMessage,
      LastSeenPost,
      FilterItem,
      PostSimilarity,
      Payment,
      Settings,
      RewardAd,
      NotificationContent,
      PushSubscription,
      PostMapCluster,
      ChatGroupPost,
      PostHistoryEvent,
      Comment,
      UserMessage,
      Currency,
      ExchangeRate,
      WebPaymentProduct,
      TranslationCache,
      AiResponse,
    ]
    models.forEach((model) => model.initModel())
    models.forEach((model) => model.initAssociations())
  },
}
