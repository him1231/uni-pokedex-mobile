import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/routes'
import { useWorkspaceStore } from '@/store/workspaceStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 24 * 60 * 60 * 1000,
      retry: 2,
    },
  },
})

function MigrationRunner() {
  const togglePin = useWorkspaceStore((s) => s.togglePin)
  const pins = useWorkspaceStore((s) => s.pins)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ufavs')
      if (!raw) return
      const favs = JSON.parse(raw) as unknown
      if (Array.isArray(favs)) {
        favs.forEach((id) => {
          if (typeof id === 'number' && !pins.includes(id)) togglePin(id)
        })
      }
      localStorage.removeItem('ufavs')
    } catch {
      // ignore corrupt data
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MigrationRunner />
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
