const express = require('express')
const fs = require('fs')
const path = require('path')
const cors = require('cors')
const { exec } = require('child_process')
const { spawn } = require('child_process')
const requireFromString = require('require-from-string')
const { Client } = require('ssh2')
const { Client: ScpClient } = require('node-scp')
const { spawnSync } = require('child_process')

const app = express()
app.use(express.json())
app.use(cors())
app.use(express.static(path.join(__dirname, 'public'))) // Serve static files

const PROJECT_ROOT = path.join(__dirname, '..')
const ENV_FILE_PATH = path.join(PROJECT_ROOT, '.env')
const ECOSYSTEM_FILE_PATH = path.join(PROJECT_ROOT, 'ecosystem.config.cjs')

const DEFAULT_ECOSYSTEM = `
  module.exports = {
  apps: [
    {
      name: 'Bazaryo',
      script: './dist/index.js',
      env: {
        NODE_ENV: 'production',
        APP_ENV: 'production',
      },
    },
  ],
}
`

let shutdownTimer = null

function ensureAdminJSBuilt() {
  console.log('🚀 Ensuring AdminJS is built...')
  const adminPath = path.join(PROJECT_ROOT, '.adminjs')
  const adminBundle = path.join(adminPath, 'components.bundle.js')
  const renamedBundle = path.join(adminPath, 'bundle.js')

  if (!fs.existsSync(adminPath) || !fs.existsSync(adminBundle)) {
    console.log(
      '⚠️  `.adminjs` folder or bundle not found! Running `../scripts/bundle-adminjs.js`...'
    )

    // Run `scripts/bundle-adminjs.js`
    const buildProcess = spawnSync('node', ['scripts/bundle-adminjs.js'], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    })

    if (buildProcess.error) {
      console.error('❌ AdminJS build failed:', buildProcess.error)
      return false
    }

    // ✅ Rename components.bundle.js → bundle.js
    if (fs.existsSync(adminBundle)) {
      fs.renameSync(adminBundle, renamedBundle)
      console.log('✅ Renamed `components.bundle.js` to `bundle.js`.')
    } else {
      console.warn('⚠️ `components.bundle.js` not found. Rename step skipped.')
    }
  }
  return true
}

function scheduleShutdown() {
  if (shutdownTimer) clearTimeout(shutdownTimer) // Cancel any existing shutdown
  shutdownTimer = setTimeout(() => {
    console.log('🚀 Server shutting down...')
    process.exit(0) // Exit process
  }, 30000) // 30 seconds
}

// Serve `index.html` when the root URL is accessed
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// Read `.env` file
app.get('/read-env', (req, res) => {
  if (fs.existsSync(ENV_FILE_PATH)) {
    res.send(fs.readFileSync(ENV_FILE_PATH, 'utf-8'))
  } else {
    res.send('')
  }
})

// Write `.env` file
app.post('/save-env', (req, res) => {
  fs.writeFileSync(ENV_FILE_PATH, req.body.content, 'utf-8')
  res.send({ message: '✅ .env file updated!' })
})

app.post('/test-ssh', (req, res) => {
  const { username, password, port, host } = req.body
  const conn = new Client()
  conn
    .on('ready', () => {
      console.log('🚀 SSH Connection Successful!')
      res.send({ success: true, message: '✅ SSH Connection Successful!' })
      conn.end()
    })
    .on('error', (err) => {
      console.log('🚀 SSH Connection Failed!', err)
      res
        .status(400)
        .send({ success: false, message: '❌ SSH Connection Failed!', error: err.message })
    })
    .connect({
      host,
      port,
      username,
      password,
    })
})

app.post('/save-ecosystem', (req, res) => {
  const ecosystemString = readEcosystemOrCreateDefault()
  try {
    const ecosystem = requireFromString(ecosystemString)
    Object.keys(req.body).forEach((key) => {
      ecosystem.apps[0].env[key] = req.body[key]
    })

    fs.writeFileSync(ECOSYSTEM_FILE_PATH, `module.exports = ${JSON.stringify(ecosystem)}`, 'utf-8')
    res.send({ message: '✅ ecosystem.config.cjs file updated!' })
  } catch (error) {
    console.log('ce error', error)
    res.send({ message: '❌ Failed to parse ecosystem.config.cjs' })
  }
})

// **1️⃣ Install dependencies and run `npm run build`**
app.get('/install-and-build', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  function sendProgress(message, progress, remainingTime = null) {
    res.write(
      `data: {"message": "${message}", "progress": ${progress}, "remainingTime": ${remainingTime}}\n\n`
    )
  }

  let startTime = Date.now()
  sendProgress('📦 Installing dependencies...', 0)

  const installProcess = spawn('yarn', ['install'], { cwd: PROJECT_ROOT })
  installProcess.stdout.on('data', () => {
    const elapsed = (Date.now() - startTime) / 1000
    sendProgress('📦 Installing dependencies...', 50, elapsed * 2) // Estimate 50% done at midpoint
  })

  installProcess.on('close', (code) => {
    if (code !== 0) {
      sendProgress('❌ Failed to install dependencies!', 0)
      res.end()
      return
    }

    sendProgress('✅ Dependencies installed!', 50)
    startTime = Date.now()

    const buildProcess = spawn('npm', ['run', 'build'], { cwd: PROJECT_ROOT })
    buildProcess.stdout.on('data', () => {
      const elapsed = (Date.now() - startTime) / 1000
      sendProgress('🛠️ Building project...', 75, elapsed * 1.5)
    })

    buildProcess.on('close', (buildCode) => {
      if (buildCode !== 0) {
        sendProgress('❌ Build failed!', 0)
      } else {
        sendProgress('✅ Build completed!', 100)
      }
      res.end()
    })
  })
})

app.get('/package-project', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  ensureAdminJSBuilt()

  const outputPath = path.join(PROJECT_ROOT, 'server.zip')
  const filesToInclude = [
    'dist',
    'node_modules',
    '.env',
    '.adminjs',
    'package.json',
    'package-lock.json',
    'yarn.lock',
    'ecosystem.config.cjs',
    'service-account.json',
  ]
  const zipArgs = ['-r', outputPath, ...filesToInclude]

  const totalFiles = await countFiles(filesToInclude.map((f) => path.join(PROJECT_ROOT, f)))
  if (totalFiles === 0) {
    res.write(`data: {"error": "❌ No files found to zip!"}\n\n`)
    res.end()
    return
  }

  let processedFiles = 0
  const startTime = Date.now()
  const zipProcess = spawn('zip', zipArgs, { cwd: PROJECT_ROOT })

  zipProcess.stdout.on('data', (data) => {
    const line = data.toString()
    console.log(line)

    if (line.startsWith('  adding:')) {
      processedFiles++
      let progress = (processedFiles / totalFiles) * 100
      progress = Math.min(99, Math.max(0, progress)) // Keep progress under 100%

      const elapsedTime = (Date.now() - startTime) / 1000
      const estimatedTotalTime = (elapsedTime / processedFiles) * totalFiles
      const remainingTime = Math.max(0, estimatedTotalTime - elapsedTime).toFixed(2)

      res.write(
        `data: {"message": "📦 Creating ZIP file...", "progress": ${progress.toFixed(
          2
        )}, "remainingTime": ${remainingTime}}\n\n`
      )
    }
  })

  zipProcess.stderr.on('data', (data) => console.error(`stderr: ${data}`))

  zipProcess.on('close', (code) => {
    if (code === 0) {
      res.write(
        `data: {"message": "✅ ZIP file created successfully!", "progress": 100, "remainingTime": 0}\n\n`
      )
    } else {
      res.write(`data: {"error": "❌ Failed with exit code ${code}"}\n\n`)
    }
    res.end()
  })
})

app.post('/deploy-to-vps', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const { username, password, port, host } = req.body
  const conn = new Client()
  const zipPath = path.join(PROJECT_ROOT, 'server.zip')
  const remoteZipPath = `/home/server.zip`
  const remoteDir = `/home/node_server`

  function sendProgress(message, progress) {
    res.write(`${JSON.stringify({ message, progress })}`)
  }

  async function uploadZipFile() {
    sendProgress('📤 Uploading ZIP file to VPS...Please wait, as it might take a while...', 10)
    const client = await ScpClient({
      host,
      port,
      username,
      password,
    })
    await client.uploadFile(zipPath, remoteZipPath)
    sendProgress('✅ ZIP file uploaded!', 20)
  }

  function executeCommand(command, message, progress) {
    return new Promise((resolve, reject) => {
      conn.exec(command, (err, stream) => {
        if (err) {
          console.log('🚀 Error executing command: ', err)
          return reject(`❌ Failed: ${err.message}`)
        }
        stream
          .on('data', (data) => {
            sendProgress(`💻 VPS Output: ${data.toString().trim()}`, progress)
          })
          .on('close', () => {
            console.log('🚀 Command executed: ', command)
            sendProgress(message, progress)
            resolve()
          })
      })
    })
  }

  // 3️⃣ Deploy to VPS
  async function deployToVPS() {
    try {
      conn
        .on('ready', async () => {
          try {
            await uploadZipFile()

            // Install Node.js
            await executeCommand(
              `
              if ! command -v node &> /dev/null; then 
                echo "⚡ Node.js is not installed. Installing latest version...";
                curl -fsSL https://deb.nodesource.com/setup_current.x | sudo -E bash -;
                sudo apt-get install -y nodejs;
              else 
                NODE_VERSION=$(node -v | grep -oP '[0-9]+');
                echo "🔍 Current Node.js version: $NODE_VERSION";
                
                if [ "$NODE_VERSION" -lt 18 ]; then 
                  echo "🔄 Upgrading Node.js to the latest version...";
                  sudo apt remove -y nodejs;
                  sudo apt autoremove -y;

                  echo "🌍 Adding NodeSource repository for latest Node.js...";
                  curl -fsSL https://deb.nodesource.com/setup_current.x | sudo -E bash -;

                  echo "🚀 Installing latest Node.js version...";
                  sudo apt install -y nodejs;
                else 
                  echo "✅ Node.js is already at version 18 or higher. No update needed.";
                fi
              fi
              echo "✅ Final Node.js version: $(node -v)";
              `,
              '✅ Node.js is installed!',
              30
            )

            // Install unzip
            await executeCommand(
              `if ! command -v unzip &> /dev/null; then sudo apt update && sudo apt install unzip -y; fi`,
              '✅ unzip is installed!',
              40
            )

            // Install NPM
            await executeCommand(
              `if ! command -v npm &> /dev/null; then 
                sudo apt update && sudo apt install -y npm;
              fi`,
              '✅ NPM is installed!',
              50
            )

            // Install Yarn
            await executeCommand(
              `if ! command -v yarn &> /dev/null; then curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add - && echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list && sudo apt update && sudo apt install yarn -y; fi`,
              '✅ Yarn is installed!',
              60
            )

            // Install PM2
            await executeCommand(
              `if ! command -v pm2 &> /dev/null; then sudo npm install -g pm2; fi`,
              '✅ PM2 is installed!',
              70
            )

            // Extract ZIP
            await executeCommand(
              `rm -rf ${remoteDir} && mkdir ${remoteDir} && unzip ${remoteZipPath} -d ${remoteDir}`,
              '✅ ZIP file extracted!',
              80
            )

            // Stop the process if it's already running
            await executeCommand(
              `
              APP_NAME=$(grep -Po "(?<=name: ')[^']*" ${remoteDir}/ecosystem.config.cjs);
              if [ ! -z "$APP_NAME" ] && pm2 list | grep -q "$APP_NAME"; then 
                echo "🔄 Restarting PM2 process ($APP_NAME)...";
                pm2 delete "$APP_NAME";
              fi
              cd ${remoteDir} && pm2 start ecosystem.config.cjs --env production
              `,
              '✅ PM2 restarted successfully!',
              90
            )

            // Start Application
            await executeCommand(
              `cd ${remoteDir} && pm2 startOrReload ecosystem.config.cjs --node-args="--experimental-specifier-resolution=node"`,
              '✅ Application started successfully!',
              100
            )
            res.end()

            scheduleShutdown()
          } catch (error) {
            console.log('🚀 Error deploying to VPS: ', error)
            sendProgress(error, 0)
            res.end()
          }
        })
        .connect({
          host,
          port,
          username,
          password,
        })
    } catch (error) {
      console.log('🚀 Error deploying to VPS: ', error)
      sendProgress(error, 0)
      res.end()
    }
  }

  deployToVPS()
})

app.delete('/remove-zip', (req, res) => {
  const ZIP_FILE_PATH = path.join(PROJECT_ROOT, 'server.zip')
  try {
    if (fs.existsSync(ZIP_FILE_PATH)) {
      fs.unlink(ZIP_FILE_PATH, (err) => {
        if (err) {
          console.error('❌ Failed to delete ZIP:', err)
          return
        }

        console.log('✅ ZIP file deleted successfully!')
      })
    }
  } catch (error) {
    console.error('❌ Failed to delete ZIP:', error)
  }

  return res.status(200).json({ success: true })
})

function readEcosystemOrCreateDefault() {
  createEcosystemIfItDoesNotExist()
  if (fs.existsSync(ECOSYSTEM_FILE_PATH)) {
    return fs.readFileSync(ECOSYSTEM_FILE_PATH, 'utf-8')
  }
  return DEFAULT_ECOSYSTEM
}

function createEcosystemIfItDoesNotExist() {
  if (fs.existsSync(ECOSYSTEM_FILE_PATH)) {
    return
  }
  fs.writeFileSync(ECOSYSTEM_FILE_PATH, DEFAULT_ECOSYSTEM, 'utf-8')
}

// Function to count the number of files in a directory
async function countFiles(paths) {
  let fileCount = 0
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return
    if (fs.statSync(dir).isFile()) {
      fileCount++
      return
    }
    const files = fs.readdirSync(dir)
    for (const file of files) {
      const fullPath = path.join(dir, file)
      if (fs.statSync(fullPath).isDirectory()) {
        scanDir(fullPath)
      } else {
        fileCount++
      }
    }
  }
  paths.forEach(scanDir)
  return fileCount
}

// Start server and open browser
const PORT = 8888
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`)

  // Open browser
  const start =
    process.platform == 'darwin'
      ? 'open' // macOS
      : process.platform == 'win32'
        ? 'start' // Windows
        : 'xdg-open' // Linux
  exec(`${start} http://localhost:${PORT}`)
})
