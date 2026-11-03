const AUTH_STORAGE_KEY = "wfx-auth-session";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function authHeaders() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Authentication is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
  return {
    apikey: supabaseAnonKey,
    "Content-Type": "application/json",
  };
}

async function request(path, body) {
  const response = await fetch(`${supabaseUrl}/auth/v1/${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.msg || data.error_description || data.message || "Authentication request failed.");
  return data;
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return getSession()?.access_token || null;
}

export async function signIn(email, password) {
  const session = await request("token?grant_type=password", { email, password });
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export async function signUp(email, password) {
  const data = await request("signup", { email, password });
  if (data.access_token) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  return data;
}

export function signOut() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
