/**
 * useStore.js
 * Store global con Zustand.
 * Persiste en localStorage para acceso offline.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { calcRestante, toNumber } from '../utils/formatters'
import {
  initSheets, setupSpreadsheet, readSheet, readConfig,
  syncPendingChanges, appendRow, updateRowById, deleteRowById, writeConfig
} from '../services/sheetsService'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sheetForUser(role) {
  return role === 'agus' ? 'gastos_agus' : 'gastos_meli'
}

// ─── Store ────────────────────────────────────────────────────────────────────

const useStore = create(
  persist(
    (set, get) => ({
      // ── Auth ────────────────────────────────────────────────────────────────
      user: null,       // { email, name, picture, role: 'agus' | 'meli' }
      token: null,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),

      logout: () => set({
        user: null,
        token: null,
        gastosAgus: [],
        gastosMeli: [],
        gastosCompartidos: [],
        pendingChanges: [],
        syncStatus: 'synced',
      }),

      // ── Datos ────────────────────────────────────────────────────────────────
      gastosAgus: [],
      gastosMeli: [],
      gastosCompartidos: [],
      categorias: [],
      config: {
        sueldoAgus: 0,
        sueldoMeli: 0,
        aporteAgus: 0,
        aporteMeli: 0,
        emailAgus: '',
        emailMeli: '',
        spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID || '',
      },

      // ── Sync ─────────────────────────────────────────────────────────────────
      syncStatus: 'synced',   // 'synced' | 'pending' | 'syncing' | 'offline'
      pendingChanges: [],     // [{ id, action, sheet, data }]
      lastSync: null,

      setSyncStatus: (status) => set({ syncStatus: status }),

      // ── Carga inicial desde Sheets ──────────────────────────────────────────
      loadFromSheets: async () => {
        const { token, config } = get()
        if (!token || !config.spreadsheetId) return

        set({ syncStatus: 'syncing' })
        try {
          initSheets(token, config.spreadsheetId)
          await setupSpreadsheet()

          const [gastosAgus, gastosMeli, gastosCompartidos, categorias, rawConfig] =
            await Promise.all([
              readSheet('gastos_agus'),
              readSheet('gastos_meli'),
              readSheet('gastos_compartidos'),
              readSheet('categorias'),
              readConfig(),
            ])

          const configUpdate = {
            sueldoAgus: toNumber(rawConfig.sueldo_agus || 0),
            sueldoMeli: toNumber(rawConfig.sueldo_meli || 0),
            aporteAgus:  toNumber(rawConfig.aporte_agus || 0),
            aporteMeli:  toNumber(rawConfig.aporte_meli || 0),
            emailAgus:   rawConfig.email_agus || '',
            emailMeli:   rawConfig.email_meli || '',
            spreadsheetId: config.spreadsheetId,
          }

          set({
            gastosAgus:        gastosAgus.filter(g => g.id),
            gastosMeli:        gastosMeli.filter(g => g.id),
            gastosCompartidos: gastosCompartidos.filter(g => g.id),
            categorias:        categorias.filter(c => c.id),
            config:            configUpdate,
            syncStatus:        'synced',
            lastSync:          new Date().toISOString(),
          })
        } catch (err) {
          console.error('Error cargando desde Sheets:', err)
          set({ syncStatus: 'offline' })
        }
      },

      // ── Sync de cambios pendientes ──────────────────────────────────────────
      syncPending: async () => {
        const { token, config, pendingChanges } = get()
        if (!pendingChanges.length) return
        if (!token || !config.spreadsheetId) {
          set({ syncStatus: 'offline' })
          return
        }

        set({ syncStatus: 'syncing' })
        try {
          initSheets(token, config.spreadsheetId)
          const errors = await syncPendingChanges(pendingChanges)
          if (errors.length === 0) {
            set({ pendingChanges: [], syncStatus: 'synced', lastSync: new Date().toISOString() })
          } else {
            // Quitar los que sí se sincronizaron
            const failedIds = new Set(errors.map(e => e.change.id))
            set(state => ({
              pendingChanges: state.pendingChanges.filter(c => failedIds.has(c.id)),
              syncStatus: 'pending',
            }))
          }
        } catch (err) {
          console.error('Error sync:', err)
          set({ syncStatus: 'offline' })
        }
      },

      // ── Gastos personales ───────────────────────────────────────────────────
      addGasto: async (gastoData) => {
        const { user, token, config } = get()
        const sheet = sheetForUser(user.role)
        const id = uuidv4()
        const restante = gastoData.tipo === 'cuota'
          ? calcRestante(gastoData.cuotas_total, gastoData.cuotas_pagadas)
          : ''

        const gasto = {
          ...gastoData,
          id,
          restante: String(restante),
          fecha: new Date().toISOString().split('T')[0],
          sync_status: 'pending',
        }

        // Actualizar estado local inmediatamente
        const key = user.role === 'agus' ? 'gastosAgus' : 'gastosMeli'
        set(state => ({
          [key]: [...state[key], gasto],
          syncStatus: 'pending',
          pendingChanges: [...state.pendingChanges, { id: uuidv4(), action: 'add', sheet, data: gasto }]
        }))

        // Intentar sync inmediato si hay conexión
        if (token && config.spreadsheetId && navigator.onLine) {
          try {
            initSheets(token, config.spreadsheetId)
            await appendRow(sheet, gasto)
            set(state => ({
              [key]: state[key].map(g => g.id === id ? { ...g, sync_status: 'synced' } : g),
              pendingChanges: state.pendingChanges.filter(c => c.data?.id !== id),
              syncStatus: state.pendingChanges.filter(c => c.data?.id !== id).length > 0 ? 'pending' : 'synced',
              lastSync: new Date().toISOString(),
            }))
          } catch (err) {
            console.warn('Gasto guardado localmente, se sincronizará luego:', err)
          }
        }
      },

      updateGasto: async (id, gastoData) => {
        const { user, token, config } = get()
        const sheet = sheetForUser(user.role)
        const key = user.role === 'agus' ? 'gastosAgus' : 'gastosMeli'

        const restante = gastoData.tipo === 'cuota'
          ? calcRestante(gastoData.cuotas_total, gastoData.cuotas_pagadas)
          : ''

        const updated = { ...gastoData, id, restante: String(restante), sync_status: 'pending' }

        set(state => ({
          [key]: state[key].map(g => g.id === id ? updated : g),
          syncStatus: 'pending',
          pendingChanges: [...state.pendingChanges, { id: uuidv4(), action: 'update', sheet, data: updated }]
        }))

        if (token && config.spreadsheetId && navigator.onLine) {
          try {
            initSheets(token, config.spreadsheetId)
            await updateRowById(sheet, id, updated)
            set(state => ({
              [key]: state[key].map(g => g.id === id ? { ...g, sync_status: 'synced' } : g),
              pendingChanges: state.pendingChanges.filter(c => c.data?.id !== id),
              syncStatus: state.pendingChanges.filter(c => c.data?.id !== id).length > 0 ? 'pending' : 'synced',
              lastSync: new Date().toISOString(),
            }))
          } catch (err) {
            console.warn('Update guardado localmente:', err)
          }
        }
      },

      deleteGasto: async (id) => {
        const { user, token, config } = get()
        const sheet = sheetForUser(user.role)
        const key = user.role === 'agus' ? 'gastosAgus' : 'gastosMeli'

        set(state => ({
          [key]: state[key].filter(g => g.id !== id),
          syncStatus: 'pending',
          pendingChanges: [...state.pendingChanges, { id: uuidv4(), action: 'delete', sheet, id_to_delete: id }]
        }))

        if (token && config.spreadsheetId && navigator.onLine) {
          try {
            initSheets(token, config.spreadsheetId)
            await deleteRowById(sheet, id)
            set(state => ({
              pendingChanges: state.pendingChanges.filter(c => c.id_to_delete !== id),
              syncStatus: state.pendingChanges.filter(c => c.id_to_delete !== id).length > 0 ? 'pending' : 'synced',
              lastSync: new Date().toISOString(),
            }))
          } catch (err) {
            console.warn('Delete guardado localmente:', err)
          }
        }
      },

      // ── Gastos compartidos ──────────────────────────────────────────────────
      addGastoCompartido: async (gastoData) => {
        const { token, config } = get()
        const sheet = 'gastos_compartidos'
        const id = uuidv4()
        const restante = gastoData.tipo === 'cuota'
          ? calcRestante(gastoData.cuotas_total, gastoData.cuotas_pagadas)
          : ''

        const gasto = {
          ...gastoData,
          id,
          restante: String(restante),
          fecha: new Date().toISOString().split('T')[0],
          sync_status: 'pending',
        }

        set(state => ({
          gastosCompartidos: [...state.gastosCompartidos, gasto],
          syncStatus: 'pending',
          pendingChanges: [...state.pendingChanges, { id: uuidv4(), action: 'add', sheet, data: gasto }]
        }))

        if (token && config.spreadsheetId && navigator.onLine) {
          try {
            initSheets(token, config.spreadsheetId)
            await appendRow(sheet, gasto)
            set(state => ({
              gastosCompartidos: state.gastosCompartidos.map(g => g.id === id ? { ...g, sync_status: 'synced' } : g),
              pendingChanges: state.pendingChanges.filter(c => c.data?.id !== id),
              syncStatus: state.pendingChanges.filter(c => c.data?.id !== id).length > 0 ? 'pending' : 'synced',
              lastSync: new Date().toISOString(),
            }))
          } catch (err) {
            console.warn('Gasto compartido guardado localmente:', err)
          }
        }
      },

      updateGastoCompartido: async (id, gastoData) => {
        const { token, config } = get()
        const sheet = 'gastos_compartidos'
        const restante = gastoData.tipo === 'cuota'
          ? calcRestante(gastoData.cuotas_total, gastoData.cuotas_pagadas)
          : ''

        const updated = { ...gastoData, id, restante: String(restante), sync_status: 'pending' }

        set(state => ({
          gastosCompartidos: state.gastosCompartidos.map(g => g.id === id ? updated : g),
          syncStatus: 'pending',
          pendingChanges: [...state.pendingChanges, { id: uuidv4(), action: 'update', sheet, data: updated }]
        }))

        if (token && config.spreadsheetId && navigator.onLine) {
          try {
            initSheets(token, config.spreadsheetId)
            await updateRowById(sheet, id, updated)
            set(state => ({
              gastosCompartidos: state.gastosCompartidos.map(g => g.id === id ? { ...g, sync_status: 'synced' } : g),
              pendingChanges: state.pendingChanges.filter(c => c.data?.id !== id),
              syncStatus: state.pendingChanges.filter(c => c.data?.id !== id).length > 0 ? 'pending' : 'synced',
              lastSync: new Date().toISOString(),
            }))
          } catch (err) {
            console.warn('Update compartido guardado localmente:', err)
          }
        }
      },

      deleteGastoCompartido: async (id) => {
        const { token, config } = get()
        const sheet = 'gastos_compartidos'

        set(state => ({
          gastosCompartidos: state.gastosCompartidos.filter(g => g.id !== id),
          syncStatus: 'pending',
          pendingChanges: [...state.pendingChanges, { id: uuidv4(), action: 'delete', sheet, id_to_delete: id }]
        }))

        if (token && config.spreadsheetId && navigator.onLine) {
          try {
            initSheets(token, config.spreadsheetId)
            await deleteRowById(sheet, id)
            set(state => ({
              pendingChanges: state.pendingChanges.filter(c => c.id_to_delete !== id),
              syncStatus: state.pendingChanges.filter(c => c.id_to_delete !== id).length > 0 ? 'pending' : 'synced',
              lastSync: new Date().toISOString(),
            }))
          } catch (err) {
            console.warn('Delete compartido guardado localmente:', err)
          }
        }
      },

      // ── Categorías ──────────────────────────────────────────────────────────
      addCategoria: async (nombre, color) => {
        const { token, config } = get()
        const id = uuidv4()
        const cat = { id, nombre, color }

        set(state => ({
          categorias: [...state.categorias, cat],
          syncStatus: 'pending',
          pendingChanges: [...state.pendingChanges, { id: uuidv4(), action: 'add', sheet: 'categorias', data: cat }]
        }))

        if (token && config.spreadsheetId && navigator.onLine) {
          try {
            initSheets(token, config.spreadsheetId)
            await appendRow('categorias', cat)
            set(state => ({
              pendingChanges: state.pendingChanges.filter(c => c.data?.id !== id),
              syncStatus: state.pendingChanges.filter(c => c.data?.id !== id).length > 0 ? 'pending' : 'synced',
              lastSync: new Date().toISOString(),
            }))
          } catch (err) { console.warn(err) }
        }
      },

      deleteCategoria: async (id) => {
        const { token, config } = get()
        set(state => ({
          categorias: state.categorias.filter(c => c.id !== id),
          syncStatus: 'pending',
          pendingChanges: [...state.pendingChanges, { id: uuidv4(), action: 'delete', sheet: 'categorias', id_to_delete: id }]
        }))

        if (token && config.spreadsheetId && navigator.onLine) {
          try {
            initSheets(token, config.spreadsheetId)
            await deleteRowById('categorias', id)
            set(state => ({
              pendingChanges: state.pendingChanges.filter(c => c.id_to_delete !== id),
              syncStatus: state.pendingChanges.filter(c => c.id_to_delete !== id).length > 0 ? 'pending' : 'synced',
              lastSync: new Date().toISOString(),
            }))
          } catch (err) { console.warn(err) }
        }
      },

      // ── Config ──────────────────────────────────────────────────────────────
      saveConfig: async (newConfig) => {
        const { token } = get()
        set(state => ({ config: { ...state.config, ...newConfig } }))

        if (token && newConfig.spreadsheetId && navigator.onLine) {
          try {
            initSheets(token, newConfig.spreadsheetId)
            const entries = {
              sueldo_agus: newConfig.sueldoAgus,
              sueldo_meli: newConfig.sueldoMeli,
              aporte_agus: newConfig.aporteAgus,
              aporte_meli: newConfig.aporteMeli,
              email_agus:  newConfig.emailAgus,
              email_meli:  newConfig.emailMeli,
            }
            await Promise.all(Object.entries(entries).map(([k, v]) => writeConfig(k, v)))
            set({ syncStatus: 'synced', lastSync: new Date().toISOString() })
          } catch (err) {
            console.warn('Config guardada localmente:', err)
            set({ syncStatus: 'pending' })
          }
        }
      },
    }),
    {
      name: 'pipitos-finance-store',
      // No persistir el token en localStorage por seguridad
      partialize: (state) => ({
        user: state.user,
        gastosAgus: state.gastosAgus,
        gastosMeli: state.gastosMeli,
        gastosCompartidos: state.gastosCompartidos,
        categorias: state.categorias,
        config: state.config,
        pendingChanges: state.pendingChanges,
        syncStatus: state.syncStatus,
        lastSync: state.lastSync,
      }),
    }
  )
)

export default useStore
