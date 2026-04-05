import { useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  { path: '/',        label: 'Inicio',  icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#A75F37' : '#D9B99F'}>
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  )},
  { path: '/gastos',  label: 'Gastos',  icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#A75F37' : '#D9B99F'}>
      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
    </svg>
  )},
  { path: '/casita',  label: 'Casita',  icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#A75F37' : '#D9B99F'}>
      <path d="M12 3L2 12h3v8h6v-5h2v5h6v-8h3L12 3zm0 12.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
    </svg>
  )},
  { path: '/config',  label: 'Config',  icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#A75F37' : '#D9B99F'}>
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
    </svg>
  )},
]

export default function NavBar() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white pb-safe" style={{ borderTop: '1px solid #D9B99F50' }}>
      <div className="flex max-w-md mx-auto">
        {tabs.map(tab => {
          const isActive = location.pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex-1 flex flex-col items-center justify-center py-2 transition-colors"
            >
              {tab.icon(isActive)}
              <span className="text-[10px] mt-0.5 font-semibold" style={{ color: isActive ? '#A75F37' : '#D9B99F' }}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: '#A75F37' }} />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
