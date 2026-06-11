import { useEffect } from 'react'
import Sidebar from './components/sidebar/Sidebar'
import ChatContainer from './components/chat/ChatContainer'
import { useChatStore } from './store/chatStore'

function App() {
  const setApiUrl = useChatStore((s) => s.setApiUrl)

  useEffect(() => {
    // Electron desktop app: get backend URL from main process
    // Web mode: apiUrl stays '' — api.ts uses relative paths (/api/...)
    if (window.electronAPI) {
      window.electronAPI.getBackendUrl().then((url: string) => {
        setApiUrl(url)
      }).catch(() => {
        setApiUrl('http://127.0.0.1:8899')
      })
    }
  }, [setApiUrl])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <ChatContainer />
      </main>
    </div>
  )
}

export default App
