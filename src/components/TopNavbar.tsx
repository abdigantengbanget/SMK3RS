import {
  Menu,
  ChevronRight,
  LogOut,
  Loader2,
} from 'lucide-react';
import { useK3 } from '../context/K3Context';
import { OFFICIAL_SIDEBAR_MENUS } from '../data/menuConfig';

const GoogleGLogo: React.FC = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const TopNavbar: React.FC = () => {
  const {
    activeModuleId,
    setActiveModuleId,
    setIsMobileSidebarOpen,
    currentUser,
    isLoggedIn,
    isLoggingIn,
    handleGoogleLogin,
    handleGoogleLogout,
  } = useK3();

  const isRingkasan = activeModuleId === 'RINGKASAN';
  const currentMenu =
    OFFICIAL_SIDEBAR_MENUS.find((m) => m.id === activeModuleId) || OFFICIAL_SIDEBAR_MENUS[0];

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md lg:px-8">
      {/* Breadcrumb matching Image 1 & Image 3 */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Buka Menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          {isRingkasan ? (
            <span className="text-slate-800 font-semibold">Dashboard</span>
          ) : (
            <>
              <button
                onClick={() => setActiveModuleId('RINGKASAN')}
                className="hover:text-slate-900 transition-colors"
              >
                Dashboard
              </button>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              <span>Modul</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-teal-700 font-bold uppercase truncate max-w-[180px] sm:max-w-none">
                {currentMenu.id}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Google Account Connection Status */}
        {isLoggedIn && currentUser ? (
          <div className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-xs shadow-2xs">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'Google'}
                className="h-6 w-6 rounded-full border border-emerald-300 object-cover"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white uppercase">
                {currentUser.displayName?.[0] || currentUser.email?.[0] || 'U'}
              </div>
            )}
            <span className="hidden md:inline font-semibold text-slate-800 truncate max-w-[140px]">
              {currentUser.displayName || currentUser.email}
            </span>
            <button
              onClick={() => handleGoogleLogout()}
              className="p-1 rounded-full text-slate-400 hover:text-rose-600 transition-colors"
              title="Keluar dari Akun Google"
            >
              <LogOut className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleGoogleLogin()}
            disabled={isLoggingIn}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-300 bg-white hover:bg-teal-50 text-xs font-semibold text-teal-800 shadow-2xs transition-all disabled:opacity-75"
            title="Hubungkan Google Drive agar berkas otomatis tersimpan ke cloud Google Drive"
          >
            {isLoggingIn ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
            ) : (
              <GoogleGLogo />
            )}
            <span className="hidden sm:inline">
              {isLoggingIn ? 'Menghubungkan...' : 'Hubungkan Drive'}
            </span>
          </button>
        )}
      </div>
    </header>
  );
};
