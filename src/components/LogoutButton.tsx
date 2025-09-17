import { useAuth } from '../contexts/AuthContext';

export default function LogoutButton() {
  const { logout } = useAuth();
  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };
  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition mb-2"
    >
      <svg width="18" height="18" fill="none" stroke="currentColor"><path d="M15 12V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-6" strokeWidth="2"/><path d="M9 15l3-3-3-3" strokeWidth="2"/></svg>
      تسجيل الخروج
    </button>
  );
}
