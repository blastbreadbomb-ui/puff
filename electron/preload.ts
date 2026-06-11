import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  getBackendPort: () => ipcRenderer.invoke('get-backend-port'),
  getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),
})

// Type declaration for the exposed API
export interface ElectronAPI {
  getBackendPort: () => Promise<number>
  getBackendUrl: () => Promise<string>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
