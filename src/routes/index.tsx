import { createBrowserRouter } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import DexPage from '@/pages/DexPage'
import PokemonDetailPage from '@/pages/PokemonDetailPage'
import MoveDexPage from '@/pages/MoveDexPage'
import AbilityDexPage from '@/pages/AbilityDexPage'
import TeamBuilderPage from '@/pages/TeamBuilderPage'
import HomeCheckerPage from '@/pages/HomeCheckerPage'
import VPPlannerPage from '@/pages/VPPlannerPage'

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
        { path: 'vp-planner', element: <VPPlannerPage /> },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  },
)
