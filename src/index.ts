import express, { Response } from 'express'
import http from 'http'
import cors from 'cors'
import { config } from './config.js'
import { accountRouter } from './api/routes/account.js'
import { postRouter } from './api/routes/post.js'
import { sequalizeDbConfig } from './database/config.js'
import { DatabaseConnection } from './database/index.js'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { DatabaseMigrator } from './database/migrator.js'
import { WebSocketModule as WebSocketModule } from './ws/socket-module.js'
import { Server } from 'socket.io'
import { initializeApp, ServiceAccount, cert } from 'firebase-admin/app'
import { FIREBASE_CREDENTIALS } from './service-account/firebase.js'
import { favouriteRouter } from './api/routes/favourite.js'
import { reportRouter } from './api/routes/report.js'
import { followersRouter } from './api/routes/follow.js'
import { searchHistoryRouter } from './api/routes/search-history.js'
import { notificationRouter } from './api/routes/notification.js'
import { categoriesRouter } from './api/routes/categories.js'
import { lastSeenPostsRouter } from './api/routes/last-seen-posts.js'
import { filtersRouter } from './api/routes/filters.js'
import { locationsRouter } from './api/routes/locations.js'
import { chatGroupRouter } from './api/routes/chat-group.js'
import { WebSocketInstance } from './ws/instance.js'
import { VectorsManager } from './lib/vectors-manager.js'
import { postSimilaritiesRouter } from './api/routes/post-similarities.js'
import { paymentsRouter } from './api/routes/payments.js'
import { AdminPanel } from './admin-panel/index.js'
import { settingsRouter } from './api/routes/settings.js'
import { adsRouter } from './api/routes/ads.js'
import { WebSubscriptions } from './web-subscriptions.js'
import { runAppCrons } from './crons/index.js'
import { postMapClusterRouter } from './api/routes/post-map-cluster.js'
import { DatabaseHooksManager } from './database-hooks/index.js'
import { googleMapsRouter } from './api/routes/google-maps.js'
import { AssetStorageHandler } from './lib/storage/index.js'
import { commentsRouter } from './api/routes/comments.js'
import { userMessageRouter } from './api/routes/user-message.js'
import { exchangeRatesRouter } from './api/routes/exchange-rates.js'
import { currenciesRouter } from './api/routes/currencies.js'
import { webPaymentProductsRouter } from './api/routes/web-payment-products.js'
import { aiRouter } from './api/routes/ai.js'
import { OpenAIService } from './lib/openai-service.js'

const app = express()
const server = http.createServer(app)

let wssModule

try {
  await VectorsManager.init()
} catch (error) {
  console.error('Could not initialize string tokenizer', error)
}

try {
  const sequalizeConfig = {
    ...sequalizeDbConfig,
    ...{ password: config.DATABASE.POSTGRES_PASSWORD },
    timezone: '+00:00',
  }
  DatabaseConnection.init(sequalizeConfig)
  DatabaseConnection.initializeModels()

  const migrationsGlob = path.join(
    dirname(fileURLToPath(import.meta.url)),
    './database/migrations/*.js'
  )
  DatabaseMigrator.init(migrationsGlob, 'sequelize_migrations')
  await DatabaseMigrator.migrateChanges()

  const seedersGlob = path.join(dirname(fileURLToPath(import.meta.url)), './database/seeders/*.js')
  DatabaseMigrator.init(seedersGlob, 'sequelize_seeds')
  await DatabaseMigrator.migrateChanges()

  DatabaseHooksManager.init()

  const io = new Server(server)
  wssModule = new WebSocketModule(io)

  WebSocketInstance.setInstance(wssModule)

  if (config.ADMIN.ENABLED) {
    AdminPanel.init(app)
  }
} catch (error) {
  console.error(error)

  process.exit(1)
}

try {
  await runAppCrons()
} catch (error) {
  console.error('Could not run app crons', error)
}

app.disable('x-powered-by')

// stripe webhook requires having raw body
app.use('/payment/stripe-webhook', express.raw({ type: '*/*' }))
app.use('/payment/razorpay-webhook', express.json({ type: 'application/json' }))

app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(
  cors({
    methods: config.ALLOW_METHODS,
    allowedHeaders: config.ALLOW_HEADERS,
    origin: config.ALLOW_ORIGIN,
  })
)

app.use('/account', accountRouter)
app.use('/post', postRouter)
app.use('/category', categoriesRouter)
app.use('/favourites', favouriteRouter)
app.use('/follow', followersRouter)
app.use('/notification', notificationRouter)
app.use('/report', reportRouter)
app.use('/searchHistory', searchHistoryRouter)
app.use('/lastSeen', lastSeenPostsRouter)
app.use('/filters', filtersRouter)
app.use('/location', locationsRouter)
app.use('/chat-group', chatGroupRouter)
app.use('/post-similarities', postSimilaritiesRouter)
app.use('/payment', paymentsRouter)
app.use('/settings', settingsRouter)
app.use('/ad', adsRouter)
app.use('/post-map', postMapClusterRouter)
app.use('/google-maps', googleMapsRouter)
app.use('/comment', commentsRouter)
app.use('/user-message', userMessageRouter)
app.use('/exchange-rate', exchangeRatesRouter)
app.use('/currency', currenciesRouter)
app.use('/web-payment-product', webPaymentProductsRouter)
app.use('/ai', aiRouter)

WebSubscriptions.init(app)

app.use('/assets/:path', (req, res) => {
  const { path } = req.params
  AssetStorageHandler.serveFile(path, res)
})

app.get('/', async (req, res: Response) => {
  res.send(`BAZARYO API HTTP SERVER ${config.APP_VERSION}`)
})

server.listen(config.PORT, () => {
  // eslint-disable-next-line no-console
  console.info(`Server listen on : ${config.PORT}`)
})

// quit properly on docker stop
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

try {
  initializeApp({
    credential: cert(FIREBASE_CREDENTIALS as ServiceAccount),
  })
} catch (error) {
  console.error('Could not initialize firebase', error)
}

try {
  OpenAIService.init()
} catch (error) {
  console.error('Could not initialize openai', error)
}

function shutdown() {
  server.close((err) => {
    if (err) {
      console.error(err)
      process.exitCode = 1
    }
    process.exit()
  })

  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down')
    process.exit(1)
  }, 10000)

  wssModule.closeWSServer()
}
