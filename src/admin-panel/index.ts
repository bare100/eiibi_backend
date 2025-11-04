import AdminJS from 'adminjs'
import AdminJSExpress from '@adminjs/express'
import Connect from 'connect-pg-simple'
import session from 'express-session'
// @ts-ignore
import * as AdminJSSequelize from '@adminjs/sequelize'
import { config } from '../config.js'
import componentLoader, { customComponents } from './component-loader.js'
import { Location } from '../modules/auxiliary-models/location.js'
import { createCategoryResource } from './resources/category.js'
import { createAssetResource } from './resources/asset.js'
import { createAccountResource } from './resources/account.js'
import { createPostResource } from './resources/post.js'
import { createNotificationResource } from './resources/notification.js'
import { createFilterItemResource } from './resources/filter-item.js'
import { createSearchHistoryItemResource } from './resources/search-history-item.js'
import { createPaymentResource } from './resources/payment.js'
import { getCustomStyles } from './styles/custom.js'
import { loadDashboardData } from './utils/loaders.js'
import { createSettingsResource } from './resources/settings.js'
import { createNotificationsContentResource } from './resources/notifications-content.js'
import { createUserMessageResource } from './resources/user-messages.js'
import { createCurrenciesResource } from './resources/currencies.js'
import { createExchangeRatesResource } from './resources/exchange-rates.js'
import { createWebPaymentProductResource } from './resources/web-payment-products.js'

const DEFAULT_ADMIN = {
  email: config.ADMIN.ADMIN_EMAIL,
  password: config.ADMIN.ADMIN_PASSWORD,
  role: 'admin',
}

const DEFAULT_READONLY_ADMIN = {
  email: config.ADMIN.READONLY_EMAIL,
  password: config.ADMIN.READONLY_PASSWORD,
  role: 'readonly',
}

class AdminPanel {
  init(app) {
    app.set('trust proxy', 1)

    app.use((req, res, next) => {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
      res.set('Pragma', 'no-cache')
      res.set('Expires', '0')
      next()
    })

    app.get('/styles.css', async (req, res) => {
      res.setHeader('Content-Type', 'text/css')
      const styles = getCustomStyles()
      res.send(styles)
    })

    AdminJS.registerAdapter({
      Resource: AdminJSSequelize.Resource,
      Database: AdminJSSequelize.Database,
    })

    const adminJS = new AdminJS({
      dashboard: {
        component: customComponents.DashboardPage,
        handler: loadDashboardData,
      },
      branding: {
        companyName: 'Bazaryo',
        withMadeWithLove: false,
        logo: 'https://cdn.tanna.app/bazaryo/Group%20321%20(1).png',
        favicon: 'https://cdn.tanna.app/bazaryo/bazaryo_logo1.png',
      },
      assets: {
        styles: [
          '/styles.css',
          'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
        ],
      },
      locale: {
        language: 'en',
        availableLanguages: ['en'],
        translations: {
          en: {
            resources: {
              accounts: {
                properties: {
                  acceptedTermsAndCondition: 'Accepted Terms',
                },
              },
              web_payment_products: {
                name: 'Web Payment Products',
                properties: {
                  priceInUSD: 'Price in current currency',
                  priceInDollars: 'Price in dollars',
                },
              },
              post: {
                properties: {
                  initialPriceInDollars: 'Initial price in current currency',
                },
              },
            },
          },
        },
      },
      componentLoader,
      resources: [
        {
          resource: Location,
          options: {
            navigation: false,
          },
        },
        createSettingsResource(),
        createNotificationsContentResource(),
        createAssetResource(),
        createAccountResource(),
        createPostResource(),
        createCategoryResource(),
        createNotificationResource(),
        createFilterItemResource(),
        createSearchHistoryItemResource(),
        createPaymentResource(),
        createUserMessageResource(),
        createCurrenciesResource(),
        createExchangeRatesResource(),
        createWebPaymentProductResource(),
      ],
    })

    if (process.env.NODE_ENV !== 'production') {
      adminJS.watch()
    }

    // @ts-ignore - Ignoring type mismatch between session versions
    const ConnectSession = Connect(session)
    const sessionStore = new ConnectSession({
      conObject: {
        user: config.DATABASE.POSTGRES_USER,
        host: config.DATABASE.POSTGRES_SERVER,
        database: config.DATABASE.POSTGRES_DB,
        password: config.DATABASE.POSTGRES_PASSWORD,
        ...(config.DATABASE.ALLOW_ADMIN_SSL?.toString()?.toLowerCase() === 'true'
          ? { ssl: process.env.NODE_ENV === 'production' ? true : false }
          : {}),
      },
      tableName: 'session',
      createTableIfMissing: true,
    })

    const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
      adminJS,
      {
        authenticate: async (email, password) => {
          if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
            return { email, role: DEFAULT_ADMIN.role }
          }

          if (
            email === DEFAULT_READONLY_ADMIN.email &&
            password === DEFAULT_READONLY_ADMIN.password
          ) {
            return { email, role: DEFAULT_READONLY_ADMIN.role }
          }

          return null
        },
        cookiePassword: config.ADMIN.COOKIE_PASSWORD,
      },
      null,
      {
        store: sessionStore,
        resave: true,
        saveUninitialized: true,
        secret: config.ADMIN.COOKIE_PASSWORD,
        name: 'Bazaryo Admin',
      }
    )
    app.use(adminJS.options.rootPath, adminRouter)
  }
}

const adminPanelInstance = new AdminPanel()
export { adminPanelInstance as AdminPanel }
