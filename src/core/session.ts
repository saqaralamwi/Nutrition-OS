import { create, StateCreator } from 'zustand';

export interface GuestUser {
  id: string;
  isGuest: true;
  role: 'guest';
}

export interface SessionState {
  user: GuestUser;
  isAuthenticated: true;
}

const GUEST_USER: GuestUser = {
  id: 'guest',
  isGuest: true,
  role: 'guest',
};

const storeCreator: StateCreator<SessionState> = () => ({
  user: GUEST_USER,
  isAuthenticated: true,
});

export const useSession = create<SessionState>(storeCreator);

export function getCurrentUser(): GuestUser {
  return GUEST_USER;
}

export function isGuest(): boolean {
  return true;
}

export function getUserId(): string {
  return 'guest';
}
