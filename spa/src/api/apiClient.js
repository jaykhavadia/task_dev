const API_BASE = 'http://localhost:8080/api'; // Change to your backend URL

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.message || 'API Error');
    error.status = res.status;
    throw error;
  }
  if (res.status === 204) return null;
  return res.json();
}
