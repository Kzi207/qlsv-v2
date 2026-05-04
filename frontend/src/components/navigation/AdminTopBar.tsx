import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCheck, Loader2, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuthStore } from '../../store/useAuthStore';

interface AdminSearchItem {
  id: string;
  type: 'student' | 'class' | 'subject' | 'session' | 'notification' | 'shortcut';
  title: string;
  subtitle?: string;
  route: string;
  badge?: string;
}

interface NotificationItem {
  id: number;
  title: string;
  content: string | null;
  tag: string;
  color: string;
  createdAt: string;
  isRead: boolean;
}

interface NotificationCenterResponse {
  unreadCount: number;
  items: NotificationItem[];
}

const ADMIN_ROLES = new Set(['QTV', 'BCH', 'LECTURER']);

const AdminTopBar = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const role = String(user?.role || '').toUpperCase();

  const [keyword, setKeyword] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchItems, setSearchItems] = useState<AdminSearchItem[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifCenter, setNotifCenter] = useState<NotificationCenterResponse>({
    unreadCount: 0,
    items: [],
  });

  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  const notifBoxRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const canUseAdminTopBar = useMemo(() => ADMIN_ROLES.has(role), [role]);

  useEffect(() => {
    if (!canUseAdminTopBar) return;

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (searchBoxRef.current && !searchBoxRef.current.contains(target)) {
        setSearchOpen(false);
      }

      if (notifBoxRef.current && !notifBoxRef.current.contains(target)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [canUseAdminTopBar]);

  useEffect(() => {
    if (!canUseAdminTopBar) return;

    const handleShortcuts = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleShortcuts);
    return () => document.removeEventListener('keydown', handleShortcuts);
  }, [canUseAdminTopBar]);

  useEffect(() => {
    if (!canUseAdminTopBar) return;

    const loadNotificationCenter = async () => {
      setNotifLoading(true);
      try {
        const response = await api.get<NotificationCenterResponse>('/notifications/center', {
          params: { limit: 8 },
        });
        setNotifCenter(response.data);
      } catch (error) {
        console.error('Failed to load notification center', error);
      } finally {
        setNotifLoading(false);
      }
    };

    loadNotificationCenter();
    const timer = window.setInterval(loadNotificationCenter, 30000);
    return () => window.clearInterval(timer);
  }, [canUseAdminTopBar]);

  useEffect(() => {
    if (!canUseAdminTopBar) return;

    const q = keyword.trim();
    if (q.length === 0) {
      setSearchItems([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await api.get<{ items: AdminSearchItem[] }>('/admin/search', {
          params: { q, limit: 8 },
        });
        setSearchItems(Array.isArray(response.data?.items) ? response.data.items : []);
      } catch (error) {
        console.error('Global search failed', error);
        setSearchItems([]);
      } finally {
        setSearchLoading(false);
      }
    }, 280);

    return () => window.clearTimeout(timer);
  }, [keyword, canUseAdminTopBar]);

  if (!canUseAdminTopBar) return null;

  const goToSearchResult = (item: AdminSearchItem) => {
    setSearchOpen(false);
    setKeyword('');
    navigate(item.route);
  };

  const markNotificationRead = async (notificationId: number) => {
    try {
      await api.post(`/notifications/${notificationId}/read`);
      setNotifCenter((prev) => {
        const nextItems = prev.items.map((item) =>
          item.id === notificationId ? { ...item, isRead: true } : item,
        );
        const unreadCount = nextItems.filter((item) => !item.isRead).length;
        return {
          unreadCount,
          items: nextItems,
        };
      });
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const markAllNotificationRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifCenter((prev) => ({
        unreadCount: 0,
        items: prev.items.map((item) => ({ ...item, isRead: true })),
      }));
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  };

  return (
    <div className="hidden lg:block">
      <div className="mx-auto flex w-full max-w-[1760px] items-center justify-between gap-4 px-8 py-4 xl:px-10">
        <div ref={searchBoxRef} className="relative w-full max-w-2xl">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Search size={18} className="text-slate-400" />
            <input
              ref={searchInputRef}
              value={keyword}
              onFocus={() => setSearchOpen(true)}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Global search: sinh vien, lop, mon hoc, thong bao..."
              className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
            />
            <kbd className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-500">
              Ctrl + K
            </kbd>
          </div>

          {searchOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              {searchLoading ? (
                <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-slate-500">
                  <Loader2 size={16} className="animate-spin" />
                  Dang tim kiem...
                </div>
              ) : searchItems.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-500">
                  {keyword.trim().length > 0
                    ? 'Khong tim thay ket qua phu hop.'
                    : 'Nhap tu khoa de tim kiem toan he thong.'}
                </div>
              ) : (
                <div className="max-h-[380px] overflow-y-auto">
                  {searchItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => goToSearchResult(item)}
                      className="flex w-full items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                        {item.subtitle && (
                          <p className="mt-1 text-xs text-slate-500">{item.subtitle}</p>
                        )}
                      </div>
                      {item.badge && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div ref={notifBoxRef} className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((prev) => !prev)}
            className="relative rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
            aria-label="Open admin notifications"
          >
            <Bell size={20} />
            {notifCenter.unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">
                {notifCenter.unreadCount > 99 ? '99+' : notifCenter.unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-bold text-slate-800">Thong bao admin</h3>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={markAllNotificationRead}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
                  >
                    <CheckCheck size={14} />
                    Da doc het
                  </button>
                  <Link to="/notifications" className="text-xs font-semibold text-slate-500 hover:underline">
                    Xem tat ca
                  </Link>
                </div>
              </div>

              {notifLoading ? (
                <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-slate-500">
                  <Loader2 size={16} className="animate-spin" />
                  Dang tai...
                </div>
              ) : notifCenter.items.length === 0 ? (
                <div className="px-4 py-8 text-sm text-slate-500">Chua co thong bao.</div>
              ) : (
                <div className="max-h-[420px] overflow-y-auto">
                  {notifCenter.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => markNotificationRead(item.id)}
                      className={`w-full border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                        item.isRead ? 'bg-white' : 'bg-blue-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                        {!item.isRead && (
                          <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      {item.content && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.content}</p>
                      )}
                      <p className="mt-2 text-[11px] font-medium text-slate-400">
                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTopBar;

