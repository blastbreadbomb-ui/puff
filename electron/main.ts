import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { spawn, ChildProcess } from 'child_process'

let mainWindow: BrowserWindow | null = null
let backendProcess: ChildProcess | null = null

const BACKEND_PORT = 8899

function getBackendPath(): string {
  // In development, backend is in the project root
  if (process.env.NODE_ENV !== 'production') {
    return path.join(__dirname, '..', 'backend')
  }
  // In production, backend is in extraResources
  return path.join(process.resourcesPath, 'backend')
}

function startBackend(): void {
  const backendPath = getBackendPath()
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'

  console.log(`Starting backend from: ${backendPath}`)

  backendProcess = spawn(pythonCmd, ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', String(BACKEND_PORT)], {
    cwd: backendPath,
    env: {
      ...process.env,
      BACKEND_PORT: String(BACKEND_PORT),
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  backendProcess.stdout?.on('data', (data) => {
    console.log(`[Backend] ${data}`)
  })

  backendProcess.stderr?.on('data', (data) => {
    console.error(`[Backend Error] ${data}`)
  })

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err)
  })

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`)
  })
}

function stopBackend(): void {
  if (backendProcess) {
    console.log('Stopping backend...')
    backendProcess.kill()
    backendProcess = null
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    title: 'AI 知心大姐姐 — 晓语',
    icon: path.join(__dirname, '..', 'resources', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    frame: true,
    show: false,
  })

  // Load the app
  if (process.env.NODE_ENV !== 'production') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC handlers
ipcMain.handle('get-backend-port', () => BACKEND_PORT)

ipcMain.handle('get-backend-url', () => `http://127.0.0.1:${BACKEND_PORT}`)

// App lifecycle
app.whenReady().then(() => {
  startBackend()

  // Give backend a moment to start, then create window
  setTimeout(() => {
    createWindow()
  }, 1500)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  stopBackend()
  app.quit()
})

app.on('before-quit', () => {
  stopBackend()
})
