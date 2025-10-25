"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes - cache data longer to reduce queries
        gcTime: 10 * 60 * 1000, // 10 minutes - keep unused data in cache
        refetchOnWindowFocus: false,
        refetchOnMount: false, // Don't refetch if data is fresh
        retry: 1, // Reduce retry attempts for faster error handling
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
