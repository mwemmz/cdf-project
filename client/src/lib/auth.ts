import { api, getToken, setToken } from './api';
import type { User } from './types';

export interface AuthPayload {
  token: string;
  user: User;
}

const USER_KEY = 'fundpath_user';

function loadUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  try {
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function persist(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(USER_KEY);
  setToken(null);
}

export async function requestLogin(email: string, password: string): Promise<AuthPayload> {
  const data = await api<AuthPayload>('/auth/login', { method: 'POST', body: { email, password } });
  setToken(data.token);
  persist(data.user);
  return data;
}

export async function requestRegister(input: {
  name: string;
  email: string;
  password: string;
  role: 'APPLICANT' | 'ADVISOR';
}): Promise<AuthPayload> {
  const data = await api<AuthPayload>('/auth/register', { method: 'POST', body: input });
  setToken(data.token);
  persist(data.user);
  return data;
}

export async function fetchMe(): Promise<User> {
  const user = await api<User>('/auth/me');
  persist(user);
  return user;
}

export function hasSessionToken(): boolean {
  return Boolean(getToken());
}

export { loadUser };