const { useState, useEffect } = React

function App() {
  const [envValues, setEnvValues] = useState({
    POSTGRES_SERVER: '',
    POSTGRES_PORT_EXTERNAL: '',
    POSTGRES_USER: '',
    POSTGRES_PASSWORD: '',
    POSTGRES_DB: '',
    POSTGRES_CONNECTION_MAX_POOL: '',
    SEQUELIZE_DEBUG: '',
    PAYMENT_AUTH_KEY: '',
    PAYMENT_PRODUCT_50_COINS: '',
    PAYMENT_PRODUCT_200_COINS: '',
    PAYMENT_PRODUCT_500_COINS: '',
    ADMIN_ENABLED: 'true',
    ADMIN_EMAIL: 'admin@bazaryo.com',
    ADMIN_PASSWORD: 'password',
    ADMIN_COOKIE_PASSWORD: 'mycustomwebhooksecret1',
    READONLY_EMAIL: 'test@bazaryo.com',
    READONLY_PASSWORD: 'password',
    VAPID_PUBLIC_KEY: '',
    VAPID_PRIVATE_KEY: '',
    SUPPORT_EMAIL: '',
    STRIPE_SECRET_KEY: '',
    STRIPE_WEBHOOK_SIGNING_SECRET: '',
    STRIPE_PRODUCT_50_COINS: '',
    STRIPE_PRODUCT_200_COINS: '',
    STRIPE_PRODUCT_500_COINS: '',
    GOOGLE_MAPS_API_KEY: '',
    AWS_ACCESS_KEY_ID: '',
    AWS_SECRET_ACCESS_KEY: '',
    AWS_STORAGE_BUCKET: '',
    AWS_STORAGE_REGION: '',
  })
  const [status, setStatus] = useState('')
  const [expandedSections, setExpandedSections] = useState({ 'Database Configuration': true })
  const [isLoading, setIsLoading] = useState(false)

  const [progress, setProgress] = useState(0)
  const [remainingTime, setRemainingTime] = useState(0)
  const [isDone, setIsDone] = useState(false)

  const sections = [
    {
      title: 'Database Configuration',
      keys: [
        'POSTGRES_SERVER',
        'POSTGRES_PORT_EXTERNAL',
        'POSTGRES_USER',
        'POSTGRES_PASSWORD',
        'POSTGRES_DB',
        'POSTGRES_CONNECTION_MAX_POOL',
        'SEQUELIZE_DEBUG',
      ],
    },
    {
      title: 'Storage Configuration',
      keys: [
        'GOOGLE_MAPS_API_KEY',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_STORAGE_BUCKET',
        'AWS_STORAGE_REGION',
      ],
    },
    {
      title: 'Admin Panel',
      keys: [
        'ADMIN_ENABLED',
        'ADMIN_EMAIL',
        'ADMIN_PASSWORD',
        'ADMIN_COOKIE_PASSWORD',
        'READONLY_EMAIL',
        'READONLY_PASSWORD',
      ],
      options: { ADMIN_ENABLED: ['true', 'false'] },
    },
    {
      title: 'In-App Purchases',
      keys: [
        'PAYMENT_AUTH_KEY',
        'PAYMENT_PRODUCT_50_COINS',
        'PAYMENT_PRODUCT_200_COINS',
        'PAYMENT_PRODUCT_500_COINS',
      ],
    },
    {
      title: 'Stripe Integration',
      keys: [
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SIGNING_SECRET',
        'STRIPE_PRODUCT_50_COINS',
        'STRIPE_PRODUCT_200_COINS',
        'STRIPE_PRODUCT_500_COINS',
      ],
    },
    {
      title: 'Web Push Notifications',
      keys: ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'SUPPORT_EMAIL'],
    },
  ]

  useEffect(() => {
    async function fetchEnv() {
      const response = await fetch('/read-env')
      const content = await response.text()
      const parsedEnv = Object.fromEntries(
        content
          .split('\n')
          .filter((line) => line.includes('='))
          .map((line) => line.split('='))
      )

      // Remove all lines that start with #
      const filteredEnv = Object.fromEntries(
        Object.entries(parsedEnv).filter(([key]) => !key.startsWith('#'))
      )
      setEnvValues({ ...filteredEnv })
    }
    fetchEnv()
  }, [])

  function handleChange(e) {
    setEnvValues({ ...envValues, [e.target.name]: e.target.value })
  }

  function toggleSection(title) {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  async function saveEnv() {
    setStatus('📂 Writing .env file...')
    await fetch('/save-env', {
      method: 'POST',
      body: JSON.stringify({
        content: Object.entries(envValues)
          .map(([k, v]) => `${k}=${v}`)
          .join('\n'),
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    setStatus('✅ .env file updated!')
  }

  async function saveEcosystem() {
    setStatus('📂 Writing ecosystem.config.cjs file...')
    await fetch('/save-ecosystem', {
      method: 'POST',
      body: JSON.stringify(envValues),
      headers: { 'Content-Type': 'application/json' },
    })
    setStatus('✅ ecosystem.config.cjs file updated!')
  }

  async function installAndBuild() {
    setStatus('📦 Starting installation and build...')
    setProgress(0)
    setRemainingTime(0)

    return new Promise((resolve, reject) => {
      const eventSource = new EventSource('/install-and-build')

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        setStatus(data.message)
        setProgress(data.progress)
        setRemainingTime(data.remainingTime)

        // ✅ Only resolve when the build is actually done
        if (data.progress === 100) {
          eventSource.close()
          resolve()
        }
        if (data.error) {
          eventSource.close()
          reject(new Error(data.error))
        }
      }

      eventSource.onerror = (error) => {
        eventSource.close()
        reject(new Error('❌ Connection error with install-and-build'))
      }
    })
  }

  async function packageProject() {
    setStatus('📦 Creating ZIP file...')
    setProgress(0)
    setRemainingTime(0)

    return new Promise((resolve, reject) => {
      const eventSource = new EventSource('/package-project')

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        setStatus(data.message)
        setProgress(data.progress)
        setRemainingTime(data.remainingTime)

        // ✅ Only mark "Done" when server truly finishes
        if (data.progress === 100 || data.error) {
          eventSource.close()
          resolve()
        }
        if (data.error) {
          eventSource.close()
          reject(new Error(data.error))
        }
      }

      eventSource.onerror = (error) => {
        eventSource.close()
        reject(new Error('❌ Connection error with package-project'))
      }
    })
  }

  async function allInOne() {
    if (isLoading) {
      return
    }
    setIsLoading(true)
    try {
      await saveEnv()
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await saveEcosystem()
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await installAndBuild()
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await packageProject()

      setIsDone(true)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">ZIP Generator</h1>

      {sections.map((section) => (
        <div key={section.title} className="card mb-3">
          <div
            className="card-header d-flex justify-content-between align-items-center"
            onClick={() => toggleSection(section.title)}
          >
            <strong>{section.title}</strong>
            <button className="btn btn-outline-secondary btn-sm">
              {expandedSections[section.title] ? '▼' : '▶'}
            </button>
          </div>
          {expandedSections[section.title] && (
            <div className="card-body">
              {section.keys.map((key) => (
                <div key={key} className="mb-3">
                  <label className="form-label">{key.replace(/_/g, ' ')}</label>
                  {section.options && section.options[key] ? (
                    <select
                      className="form-select"
                      name={key}
                      value={envValues[key] || ''}
                      onChange={handleChange}
                    >
                      {section.options[key].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-control"
                      name={key}
                      value={envValues[key] || ''}
                      onChange={handleChange}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {status && <div className="alert alert-info text-center">{status}</div>}

      {progress > 0 && (
        <div className="progress mt-3">
          <div
            className="progress-bar progress-bar-striped bg-success"
            role="progressbar"
            style={{ width: `${progress}%` }}
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            {progress.toFixed(2)}%
          </div>
        </div>
      )}
      {remainingTime > 0 && (
        <p className="text-center mt-2">Estimated time left: {remainingTime}s</p>
      )}

      <div className="d-grid gap-2 mt-4">
        {isDone ? (
          <div>
            <p>
              The zip was created successfully! You can close this tab now and send the zip to your
              server.
            </p>
            <span>This application will be closed automatically in 30 seconds.</span>
          </div>
        ) : (
          <button className="btn btn-success" onClick={allInOne}>
            {isLoading ? 'Creating ZIP...' : 'Create Deployable ZIP'}
          </button>
        )}
      </div>

      <div style={{ height: 100 }}></div>
    </div>
  )
}

// Render React App
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App))
