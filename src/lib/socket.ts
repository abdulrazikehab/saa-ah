import { io, Socket } from 'socket.io-client';

const CORE_API_URL = import.meta.env.VITE_CORE_API_URL || 'http://localhost:3002';

export const createNotificationsSocket = (token: string): Socket => {
  return io(`${CORE_API_URL}/notifications`, {
    auth: {
      token,
    },
    transports: ['websocket'],
  });
};

export const createChatSocket = (token: string): Socket => {
  return io(`${CORE_API_URL}/chat`, {
    auth: {
      token,
    },
    transports: ['websocket'],
  });
};
