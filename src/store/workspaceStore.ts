import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WorkspaceState {
  pins: number[]
  recents: number[]
  team: (number | null)[]
  compareSet: number[]

  // Pin actions
  togglePin: (id: number) => void

  // Recents
  addRecent: (id: number) => void

  // Team actions
  setTeamSlot: (slot: number, id: number) => void
  clearTeamSlot: (slot: number) => void
  clearTeam: () => void
  /** Adds to first empty slot. Returns true on success, false if team full. */
  addToTeam: (id: number) => boolean

  // Compare actions
  addToCompare: (id: number) => void
  removeFromCompare: (id: number) => void
  clearCompare: () => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      pins: [],
      recents: [],
      team: [null, null, null, null, null, null],
      compareSet: [],

      togglePin: (id) =>
        set((s) => ({
          pins: s.pins.includes(id) ? s.pins.filter((x) => x !== id) : [...s.pins, id],
        })),

      addRecent: (id) =>
        set((s) => ({
          recents: [id, ...s.recents.filter((x) => x !== id)].slice(0, 10),
        })),

      setTeamSlot: (slot, id) =>
        set((s) => {
          const team = [...s.team]
          team[slot] = id
          return { team }
        }),

      clearTeamSlot: (slot) =>
        set((s) => {
          const team = [...s.team]
          team[slot] = null
          return { team }
        }),

      clearTeam: () => set({ team: [null, null, null, null, null, null] }),

      addToTeam: (id) => {
        const { team } = get()
        const emptySlot = team.findIndex((x) => x === null)
        if (emptySlot === -1) return false
        set((s) => {
          const t = [...s.team]
          t[emptySlot] = id
          return { team: t }
        })
        return true
      },

      addToCompare: (id) =>
        set((s) => {
          if (s.compareSet.includes(id) || s.compareSet.length >= 6) return s
          return { compareSet: [...s.compareSet, id] }
        }),

      removeFromCompare: (id) =>
        set((s) => ({ compareSet: s.compareSet.filter((x) => x !== id) })),

      clearCompare: () => set({ compareSet: [] }),
    }),
    {
      name: 'workspace',
      partialize: (state) => ({
        pins: state.pins,
        recents: state.recents,
        team: state.team,
        compareSet: state.compareSet,
      }),
    },
  ),
)
