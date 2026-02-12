import { io, Socket } from 'socket.io-client';

import { CORE_ROOT_URL } from '@/services/core/api-client';

export const createNotificationsSocket = (token: string): Socket => {
  // Parse the URL to get the origin (protocol + host)
  // e.g. https://kawn.net/api -> https://kawn.net
  let baseUrl = CORE_ROOT_URL;
  let path = '/socket.io';

  try {
    const url = new URL(CORE_ROOT_URL);
    baseUrl = `${url.protocol}//${url.host}`;
    
    // If we are in production (kawn.net) and CORE_ROOT_URL includes /api, 
    // we should likely use /api/socket.io as the path to ensure it goes through the Nginx proxy to the backend
    if (url.pathname.includes('/api') && !url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1')) {
      path = '/api/socket.io';
    }
  } catch (e) {
    // Fallback to original URL if parsing fails (e.g. localhost with port only? usually valid URL though)
  }

  return io(`${baseUrl}/notifications`, {
    auth: {
      token,
    },
    path, 
    transports: ['websocket', 'polling'], // Allow polling as fallback
  });
};

export const createChatSocket = (token: string): Socket => {
  // Same logic for chat socket
  let baseUrl = CORE_ROOT_URL;
  let path = '/socket.io';

  try {
    const url = new URL(CORE_ROOT_URL);
    baseUrl = `${url.protocol}//${url.host}`;
    if (url.pathname.includes('/api') && !url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1')) {
      path = '/api/socket.io';
    }
  } catch (e) {
    // Ignore error
  }

  return io(`${baseUrl}/chat`, {
    auth: {
      token,
    },
    path,
    transports: ['websocket', 'polling'], // Allow polling as fallback
  });
};
