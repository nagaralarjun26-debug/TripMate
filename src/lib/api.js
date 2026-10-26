// src/lib/api.js
// Standard API client helper for REST calls with automatic token and base URL handling

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;

  // Retrieve token if stored
  // Retrieve JWT token stored by AuthContext
  const token =
    localStorage.getItem('tripmate_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('sb-token') ||
    localStorage.getItem('accessToken');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData) {
        if (errorData.message) errorMessage = errorData.message;
        else if (errorData.error) errorMessage = errorData.error;
        else if (Array.isArray(errorData.errors) && errorData.errors[0]?.msg) {
          errorMessage = errorData.errors[0].msg;
        }
      }
    } catch {
      // Non-JSON response, keep default message
    }
    throw new Error(errorMessage);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  get: async (url) => request(url, { method: 'GET' }),
  post: async (url, data) => request(url, { method: 'POST', body: JSON.stringify(data) }),
  put: async (url, data) => request(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: async (url) => request(url, { method: 'DELETE' }),
};
