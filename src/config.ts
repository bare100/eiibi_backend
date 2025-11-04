import * as dotenv from 'dotenv'
dotenv.config()

function getDomainExtension(url) {
  try {
    const { hostname } = new URL(url)

    // Split the hostname by dots
    const parts = hostname.split('.')

    // Handle cases like "www.google.com" and "google.com"
    if (parts.length > 2) {
      return parts.slice(-2).join('.')
    }

    return hostname
  } catch (error) {
    console.error('Invalid URL:', error)
    return null
  }
}

export const config = {
  APP_ENV: process.env.APP_ENV,
  APP_VERSION: process.env.APP_VERSION,
  PORT: process.env.PORT,
  POST_ACTIVE_TIME_IN_DAYS: 96,
  RATE_LIMIT_PER_SECOND: 100,
  IP_RATE_LIMIT_PER_SECOND: 20,
  MAX_ALLOWED_ASSETS: 10,
  MAX_ASSET_SIZE: 10 * 1024 * 1024, //10MB
  WEB_APP_URL: process.env.WEB_APP_URL || 'http://localhost:3000',
  ALLOW_HEADERS:
    'Authorization, Origin, sentry-trace, X-Requested-With, Content-Type, Accept, X-App-Id, X-App-Secret, X-Access-Token, Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Invitation-Token',
  ALLOW_METHODS: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  ALLOW_ORIGIN: [
    /\.now\.sh$/,
    /\.dev\.io$/,
    /\.vercel\.app$/,
    ...(process.env.APP_ENV !== 'production' ? ['http://localhost:3000'] : []),
    /\.bazaryo\.info$/,
    'https://web.bazaryo.info',
    'web.bazaryo.info',
    'https://www.bazaryo.org',
    'www.bazaryo.org',
    'https://bazaryo.org',
    'bazaryo.org',
    ...(process.env.WEB_APP_URL
      ? [process.env.WEB_APP_URL, getDomainExtension(process.env.WEB_APP_URL)]
      : []),
  ],
  PAYMENT_AUTH_KEY: process.env.PAYMENT_AUTH_KEY,
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  OPENAI: {
    API_KEY: process.env.OPENAI_API_KEY || '',
  },
  ADMIN: {
    ENABLED: process.env.ADMIN_ENABLED ?? true,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    READONLY_EMAIL: process.env.READONLY_EMAIL,
    READONLY_PASSWORD: process.env.READONLY_PASSWORD,
    COOKIE_PASSWORD: process.env.ADMIN_COOKIE_PASSWORD ?? 'mycustomcookiepassword',
  },
  PAYMENT_PRODUCTS: [
    {
      coins: 50,
      products: [].concat(process.env.PAYMENT_PRODUCT_50_COINS?.split(',')),
    },
    {
      coins: 200,
      products: [].concat(process.env.PAYMENT_PRODUCT_200_COINS?.split(',')),
    },
    {
      coins: 500,
      products: [].concat(process.env.PAYMENT_PRODUCT_500_COINS?.split(',')),
    },
  ],
  STRIPE: {
    SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    WEBHOOK_SIGNING_SECRET: process.env.STRIPE_WEBHOOK_SIGNING_SECRET,
  },
  PAYPAL: {
    CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
    CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
  },
  RAZORPAY: {
    KEY_ID: process.env.RAZORPAY_KEY_ID,
    SECRET_KEY: process.env.RAZORPAY_SECRET_KEY,
    WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  },
  UNLOCK_CHAT_COINS_COST: 5,
  PROMOTE_POST_COINS_COST: 50,
  DATABASE: {
    POSTGRES_SERVER: process.env.POSTGRES_SERVER,
    POSTGRES_USER: process.env.POSTGRES_USER,
    POSTGRES_DB: process.env.POSTGRES_DB,
    POSTGRES_PORT: process.env.POSTGRES_PORT_EXTERNAL,
    POSTGRES_CONNECTION_MAX_POOL: +process.env.POSTGRES_CONNECTION_MAX_POOL,
    SEQUELIZE_DEBUG: +process.env.SEQUELIZE_DEBUG,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    ALLOW_ADMIN_SSL: process.env.ALLOW_ADMIN_SSL ?? true,
  },
  GCLOUD_STORAGE: {
    BUCKET: process.env.GCLOUD_STORAGE_BUCKET,
  },
  AWS_STORAGE: {
    BUCKET: process.env.AWS_STORAGE_BUCKET,
    REGION: process.env.AWS_STORAGE_REGION,
    ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  },
  WEB_PUSH: {
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
  },
}
