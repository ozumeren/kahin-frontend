import React from 'react'

// Base Skeleton component
export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`skeleton ${className}`}
      {...props}
    />
  )
}

// Market Card Skeleton
export function MarketCardSkeleton() {
  return (
    <div className="market-card p-5 animate-fade-in">
      <div className="flex items-start gap-3 mb-4">
        <div className="skeleton w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-5 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="skeleton h-10 rounded-lg" />
        <div className="skeleton h-10 rounded-lg" />
      </div>
      <div className="flex justify-between pt-3" style={{ borderTop: '1px solid #333' }}>
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-4 w-16" />
      </div>
    </div>
  )
}

// Market Cards Grid Skeleton
export function MarketGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MarketCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Profile Skeleton
export function ProfileSkeleton() {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-6 mb-8">
        <div className="skeleton w-24 h-24 rounded-full" />
        <div className="flex-1 space-y-3">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-64" />
          <div className="skeleton h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// Leaderboard Skeleton
export function LeaderboardSkeleton() {
  return (
    <div className="space-y-3 animate-fade-in">
      {/* Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-40 rounded-xl" />
        ))}
      </div>
      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #333' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4" style={{ borderBottom: '1px solid #333' }}>
            <div className="skeleton w-8 h-8 rounded-full" />
            <div className="skeleton w-10 h-10 rounded-full" />
            <div className="flex-1 skeleton h-5" />
            <div className="skeleton h-5 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Message List Skeleton
export function MessageListSkeleton() {
  return (
    <div className="space-y-2 animate-fade-in">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid #333' }}>
          <div className="skeleton w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-3 w-48" />
          </div>
          <div className="skeleton h-3 w-12" />
        </div>
      ))}
    </div>
  )
}

// Table Row Skeleton
export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr className="animate-fade-in">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="skeleton h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

// Wallet Card Skeleton
export function WalletSkeleton() {
  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-32 rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-64 rounded-xl" />
    </div>
  )
}

export default Skeleton
