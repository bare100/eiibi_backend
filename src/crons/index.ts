import { runPostMapClustersCron } from './post-map-clusters.js'
import { runCoinsRefundCron } from './coins-refund.js'
import { runDemovePostsCron } from './default-posts/index.js'
import { runRemoveEmptyChatsCron } from './remove-empty-chats.js'
import { runClosePostsCron } from './close-posts.js'
import { runFetchExchangeRatesCron } from './fetch-exchange-rates.js'

export const runAppCrons = async () => {
  await runPostMapClustersCron()
  runCoinsRefundCron()
  runDemovePostsCron()
  runRemoveEmptyChatsCron()
  runClosePostsCron()
  runFetchExchangeRatesCron()
}
