import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    socket?.disconnect();
    setSocket(null);
  }, [socket]);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    } catch (_) { return null; }
  }, []);

  // Verify token on mount
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    refreshUser().finally(() => setLoading(false));
  }, [token]); // eslint-disable-line

  // Socket.io connection
  useEffect(() => {
    if (!user?._id || !token) return;

    const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';
    const s = io(BACKEND, { auth: { token }, transports: ['websocket', 'polling'] });
    s.on('connect', () => s.emit('join', user._id));
    s.on('notification', (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((n) => n + 1);
    });
    setSocket(s);

    return () => { s.disconnect(); };
  }, [user?._id, token]); // eslint-disable-line

  // Fetch notifications
  useEffect(() => {
    if (!user) return;
    api.get('/notifications').then(({ data }) => {
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    }).catch(() => {});
  }, [user?._id]); // eslint-disable-line

  const markAllRead = useCallback(async () => {
    await api.put('/notifications/read-all');
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, loading, socket,
      notifications, unreadCount,
      login, logout, refreshUser, markAllRead,
      isAuthenticated: !!user && !!token,
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
