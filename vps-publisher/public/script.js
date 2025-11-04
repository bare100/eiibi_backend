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
  const [currentStep, setCurrentStep] = useState(0)
  const [status, setStatus] = useState('')
  const [expandedSections, setExpandedSections] = useState({ 'Database Configuration': true })
  const [isLoading, setIsLoading] = useState(false)

  const [progress, setProgress] = useState(0)
  const [remainingTime, setRemainingTime] = useState(0)
  const [isDone, setIsDone] = useState(false)

  const [sshSuccess, setSshSuccess] = useState(false)
  const [sshConnection, setSshConnection] = useState({
    host: '',
    port: '22',
    username: 'root',
    password: '',
  })

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

  function handleSshChange(e) {
    setSshConnection({ ...sshConnection, [e.target.name]: e.target.value })
  }

  function toggleSection(title) {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  function handleSshTest() {
    setStatus('📂 Testing SSH Connection...')
    fetch('/test-ssh', {
      method: 'POST',
      body: JSON.stringify(sshConnection),
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then((data) => {
        setSshSuccess(true)
        setStatus(data.message)
      })
      .catch((err) => {
        setSshSuccess(false)
        console.log('🚀 SSH Connection Failed!', err)
        setStatus(err.message)
      })
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

  async function deployToVPS() {
    setStatus('🚀 Deploying to VPS...')
    setProgress(0)

    const response = await fetch('/deploy-to-vps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sshConnection), // Send VPS credentials
    })

    if (!response.body) {
      setStatus('❌ Deployment failed. No response from server.')
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        try {
          const data = JSON.parse(text)

          setStatus(data.message)
          setProgress(data.progress)

          if (data.progress === 100) {
            break
          }
        } catch (error) {
          console.error(`Could not parse server data: ${text}`)
        }
      }
    } catch (error) {
      setStatus('❌ Error during deployment.')
    }
  }

  async function removeZipFile() {
    try {
      await fetch('/remove-zip', { method: 'DELETE' })
    } catch (error) {
      console.error('❌ Failed to delete ZIP:', error)
    }
  }

  async function allInOne() {
    if (isLoading) {
      return
    }
    setIsLoading(true)
    // If this operation takes more than 300 seconds, we should handle it as an error
    let timer = 0
    const timerInterval = setInterval(() => {
      timer++
      if (timer > 300) {
        setStatus('❌ Operation took too long. Please try again.')
        setIsLoading(false)
        clearInterval(timerInterval)
      }
    }, 1000)

    try {
      await saveEnv()
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await saveEcosystem()
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await installAndBuild()
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await packageProject()
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await deployToVPS()
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await removeZipFile()

      setIsDone(true)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const renderFirstStep = () => {
    return (
      <div>
        <h1 className="text-center mb-4">
          <span style={{ color: '#999' }}>Step 1 of 2:</span> Configure VPS connection
        </h1>

        <div className="card mb-3">
          <div className="card-body">
            <h5 className="card-title">SSH Connection</h5>
            <p className="mb-5">
              Please enter the details of your VPS. We need to check if we can successfully connect
              to it.
            </p>

            <label>
              Username <span style={{ color: '#999' }}>(Usually root)</span>
            </label>
            <input
              type="text"
              className="form-control mb-3"
              name="username"
              value={sshConnection.username}
              onChange={handleSshChange}
            />

            <label>Password</label>
            <input
              type="text"
              name="password"
              className="form-control mb-3"
              value={sshConnection.password}
              onChange={handleSshChange}
            />

            <label>
              Host <span style={{ color: '#999' }}>(IP or domain)</span>
            </label>
            <input
              type="text"
              className="form-control mb-3"
              name="host"
              value={sshConnection.host}
              onChange={handleSshChange}
            />

            <label>
              Port{' '}
              <span style={{ color: '#999' }}>
                (Usually the port is 22, but it can be different)
              </span>
            </label>
            <input
              type="text"
              className="form-control mb-3"
              name="port"
              value={sshConnection.port}
              onChange={handleSshChange}
            />
          </div>
        </div>

        <div className="d-grid gap-2 mt-4">
          {status && <div className="alert alert-info text-center">{status}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className={`btn ${sshSuccess ? 'btn-default' : 'btn-primary'} w-100`}
              onClick={handleSshTest}
            >
              Test SSH Connection
            </button>
            {sshSuccess && (
              <button
                className="btn btn-success w-100"
                onClick={() => {
                  setCurrentStep(1)
                  setStatus('')
                }}
              >
                Next Step
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderSecondStep = () => {
    return (
      <div>
        <h1 className="text-center mb-4">
          <span style={{ color: '#999' }}>Step 2 of 2:</span> Generate Zip and Publish
        </h1>

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
                The zip was created successfully! You can close this tab now and send the zip to
                your server.
              </p>
              <span>This application will be closed automatically in 30 seconds.</span>
            </div>
          ) : (
            <div className="d-flex gap-2">
              <button
                className="btn btn-default w-100"
                disabled={isLoading}
                onClick={() => {
                  if (isLoading) {
                    return
                  }
                  setCurrentStep(0)
                  setStatus('')
                }}
              >
                Go back
              </button>
              <button className="btn btn-success w-100" onClick={allInOne} disabled={isLoading}>
                {isLoading ? 'Creating ZIP...' : 'Create Deployable ZIP'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container mt-4">
      {currentStep === 0 ? renderFirstStep() : renderSecondStep()}
      <div style={{ height: 100 }}></div>
    </div>
  )
}

// Render React App
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App))
