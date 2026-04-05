import useStore from '../store/useStore'

export default function SyncBadge() {
  const syncStatus = useStore(s => s.syncStatus)
  const pendingChanges = useStore(s => s.pendingChanges)
  const syncPending = useStore(s => s.syncPending)
  const lastSync = useStore(s => s.lastSync)

  const handleTap = () => {
    if (syncStatus === 'pending' || syncStatus === 'offline') syncPending()
  }

  const config = {
    synced:  { dot: '#7A958F', text: 'Sync', textColor: '#7A958F' },
    pending: { dot: '#A75F37', text: `${pendingChanges.length} pend.`, textColor: '#A75F37' },
    syncing: { dot: '#CA8E82', text: 'Sincronizando...', textColor: '#CA8E82' },
    offline: { dot: '#CA8E82', text: 'Sin conexion', textColor: '#CA8E82' },
  }

  const c = config[syncStatus] || config.synced

  return (
    <button
      onClick={handleTap}
      className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg"
      style={{ backgroundColor: '#F2E7DD', color: c.textColor }}
      title={lastSync ? `Ultimo sync: ${new Date(lastSync).toLocaleTimeString('es-AR')}` : 'Sin sincronizar'}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.dot }} />
      <span>{c.text}</span>
    </button>
  )
}
