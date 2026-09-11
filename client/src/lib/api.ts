export interface ApiErrorBody {
  success: boolean;
  error?: string;
  details?: { path: string; message: string }[];
}

const API_BASE: string = import.meta.env.VITE_API_BASE ?? '/api';

const TOKEN_KEY = 'fundpath_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is it running on port 4000?');
  }

  const json = (await res.json().catch(() => null)) as (ApiErrorBody & { data?: T }) | null;

  if (!res.ok) {
    const detailMessage = json?.details?.map((d) => `${d.path}: ${d.message}`).join('; ');
    throw new ApiError(res.status, detailMessage ?? json?.error ?? `Request failed (${res.status})`);
  }

  if (!json?.success) {
    throw new ApiError(res.status, json?.error ?? 'Request failed');
  }

  return json.data as T;
}