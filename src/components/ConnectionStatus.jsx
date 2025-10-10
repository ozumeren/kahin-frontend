import { Wifi, WifiOff } from 'lucide-react'

export default function ConnectionStatus({ isConnected }) {
  if (isConnected) {
    return (
      <div className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-yes text-white rounded-lg shadow-lg text-sm">
        <Wifi className="w-4 h-4 animate-pulse" />
        <span>Canlı</span>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg shadow-lg text-sm">
      <WifiOff className="w-4 h-4" />
      <span>Bağlantı koptu</span>
    </div>
  )
}