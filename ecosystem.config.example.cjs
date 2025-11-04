module.exports = {
  apps: [
    {
      name: 'suuqfuran',
      script: './dist/index.js',
      env: {
        APP_ENV: 'production',
        NODE_ENV: 'production',
        PORT: 7777,
        APP_VERSION: '1.0.0',
        POSTGRES_SERVER: 'localhost',
        POSTGRES_PORT_EXTERNAL: '5432',
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'yourpassword',
        POSTGRES_DB: 'suuqfuran',
        POSTGRES_CONNECTION_MAX_POOL: '90',
        SEQUELIZE_DEBUG: '0',
        GCLOUD_STORAGE_BUCKET: 'YOUR_GCLOUD_STORAGE_BUCKET_IF_USED',
        ADMIN_ENABLED: true,
        ADMIN_EMAIL: 'admin@bazaryo.com',
        ADMIN_PASSWORD: 'password',
        READONLY_EMAIL: 'test@bazaryo.com',
        READONLY_PASSWORD: 'password',
        ADMIN_COOKIE_PASSWORD: 'mycustomwebhooksecret1',
        RUN_IN_DEMO_MODE: false, // If this is true, the server will automatically create posts, for demo purposes. More info in the `src/crons/default-posts` file
        DEMO_MAIN_ACCOUNT_EMAIL: 'test@test.com',
        SUPPORT_EMAIL: '', // Replace this with your support email
        GOOGLE_MAPS_API_KEY: '', // Replace this with your Google Maps API key
        PAYPAL_CLIENT_ID: '',
        PAYPAL_CLIENT_SECRET: '',
        FORCE_PAYPAL_SANDBOX: 'false',
        STRIPE_SECRET_KEY: '',
        STRIPE_WEBHOOK_SIGNING_SECRET: '',
        VAPID_PUBLIC_KEY: '',
        VAPID_PRIVATE_KEY: '',
        RAZORPAY_KEY_ID: '',
        RAZORPAY_SECRET_KEY: '',
        RAZORPAY_WEBHOOK_SECRET: '',
        WEB_APP_URL: '',
        OPENAI_API_KEY: '',
      },
    },
  ],
}

