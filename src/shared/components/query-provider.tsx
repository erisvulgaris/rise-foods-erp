'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,        // data is fresh for 30s
        gcTime: 5 * 60_000,       // garbage-collected after 5m
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }))
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
