import { createContext, useContext, useMemo, useState } from 'react';
import defaultProfile from '../data/mockUser';

const AuthContext = createContext(null);
const CREDENTIALS_KEY = 'orca-credentials';
const SESSION_KEY = 'orca-session';

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) || fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to write to localStorage', err);
  }
}

export function computeInitials(name) {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getStoredAccounts() {
  const data = readJson(CREDENTIALS_KEY, {});
  // Handle case if previous version saved single credentials object { name, mobile, password }
  if (data && data.mobile && !data[data.mobile]) {
    const initials = computeInitials(data.name || '');
    return {
      [data.mobile]: {
        password: data.password,
        user: {
          ...defaultProfile,
          name: data.name || '',
          mobile: data.mobile,
          initials,
          avatarInitials: initials
        }
      }
    };
  }
  return typeof data === 'object' && data !== null ? data : {};
}

export function AuthProvider({ children }) {
  const storedSession = readJson(SESSION_KEY, null);
  const [user, setUser] = useState(() => (storedSession && storedSession.name ? storedSession : null));

  const register = (name, mobile, password) => {
    const trimmedName = (name || '').trim();
    const trimmedMobile = (mobile || '').trim();
    const initials = computeInitials(trimmedName);

    const newUser = {
      ...defaultProfile,
      name: trimmedName,
      mobile: trimmedMobile,
      initials,
      avatarInitials: initials,
      currentLocation: defaultProfile.currentLocation || 'Kochi, Kerala'
    };

    const accounts = getStoredAccounts();
    accounts[trimmedMobile] = {
      password,
      user: newUser
    };
    writeJson(CREDENTIALS_KEY, accounts);

    // Note: Registration stores credentials, but DOES NOT log the user in yet.
    return { success: true };
  };

  const login = (mobile, password) => {
    const trimmedMobile = (mobile || '').trim();
    const accounts = getStoredAccounts();
    const account = accounts[trimmedMobile];

    if (!account || account.password !== password) {
      return {
        success: false,
        error: 'Mobile number or password is incorrect.'
      };
    }

    const initials = computeInitials(account.user.name);
    const activeUser = {
      ...defaultProfile,
      ...account.user,
      initials,
      avatarInitials: initials,
      currentLocation: account.user.currentLocation || defaultProfile.currentLocation || 'Kochi, Kerala'
    };

    setUser(activeUser);
    writeJson(SESSION_KEY, activeUser);
    return { success: true, user: activeUser };
  };

  const logout = () => {
    setUser(null);
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch (err) {
      console.error(err);
    }
  };

  const updateUser = (updates) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      if (updates.name) {
        const initials = computeInitials(updates.name);
        updated.initials = initials;
        updated.avatarInitials = initials;
      }
      writeJson(SESSION_KEY, updated);

      if (updated.mobile) {
        const accounts = getStoredAccounts();
        if (accounts[updated.mobile]) {
          accounts[updated.mobile].user = updated;
          writeJson(CREDENTIALS_KEY, accounts);
        }
      }
      return updated;
    });
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user && user.name),
      register,
      login,
      logout,
      updateUser
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
