import { createBrowserRouter } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import DexPage from '@/pages/DexPage'
import PokemonDetailPage from '@/pages/PokemonDetailPage'
import MoveDexPage from '@/pages/MoveDexPage'
import AbilityDexPage from '@/pages/AbilityDexPage'
import TeamBuilderPage from '@/pages/TeamBuilderPage'
import HomeCheckerPage from '@/pages/HomeCheckerPage'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <DexPage /> },
        { path: 'pokemon/:id', element: <PokemonDetailPage /> },
        { path: 'moves', element: <MoveDexPage /> },
        { path: 'abilities', element: <AbilityDexPage /> },
        { path: 'team', element: <TeamBuilderPage /> },
        { path: 'home-checker', element: <HomeCheckerPage /> },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  },
)
