import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function ConnectionStatus({ isConnected }) {
  if (!isConnected) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Bağlantı kesildi</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
        <Wifi className="w-4 h-4" />
        <span className="text-sm font-medium">Bağlı</span>
      </div>
    </div>
  );
}