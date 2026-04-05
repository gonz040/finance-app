import SyncBadge from './SyncBadge'
import useStore from '../store/useStore'

export default function Header({ title }) {
  const user = useStore(s => s.user)

  return (
    <header className="sticky top-0 z-20 bg-white px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #D9B99F50' }}>
      <div>
        <h1 className="text-lg font-bold" style={{ color: '#292421' }}>{title}</h1>
        {user && (
          <p className="text-xs" style={{ color: '#A75F37' }}>{user.name}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <SyncBadge />
        {user?.picture && (
          <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" style={{ border: '2px solid #CA8E82' }} />
        )}
      </div>
    </header>
  )
}
