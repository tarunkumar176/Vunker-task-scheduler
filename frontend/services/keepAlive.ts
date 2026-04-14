import { API_BASE } from './api';

let intervalId: ReturnType<typeof setInterval> | null = null;

export const startKeepAlive = () => {
  if (intervalId) return; // already running

  // Ping immediately on start
  ping();

  // Then every 5 minutes
  intervalId = setInterval(ping, 5 * 60 * 1000);
};

export const stopKeepAlive = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

const ping = async () => {
  try {
    await fetch(`${API_BASE}/health`, { method: 'GET' });
  } catch (_) {
    // Silently ignore — no internet or server down
  }
};
