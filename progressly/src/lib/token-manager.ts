import { db } from './db';

export const storeAuthToken = async (token: string) => {
  try {
    if (token) {
      await db.auth_token.put({
        id: 'fastapi-token',
        token: token,
        timestamp: Date.now(),
      });
    }
  } catch (error) {
    console.error('Failed to store auth token:', error);
  }
};
