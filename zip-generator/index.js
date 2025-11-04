const express = require('express')
const fs = require('fs')
const path = require('path')
const cors = require('cors')
const { exec } = require('child_process')
const { spawn } = require('child_process')
const requireFromString = require('require-from-string')
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

let shutdownTimer = null

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
      scheduleShutdown()
    } else {
      res.write(`data: {"error": "❌ Failed with exit code ${code}"}\n\n`)
    }
    res.end()
  })
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
