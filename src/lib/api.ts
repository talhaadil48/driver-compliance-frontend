// API Client for Staff-Only Drivers Compliance System

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("staff_access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== "undefined") {
    // Only clear if on client
    localStorage.removeItem("staff_access_token");
    localStorage.removeItem("staff_user");
    // Trigger custom event for auth listeners
    window.dispatchEvent(new Event("auth_unauthorized"));
  }

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function apiUpload<T>(endpoint: string, formData: FormData): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    ...getAuthHeader(),
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = `Upload failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function apiReplaceUpload<T>(documentId: number, formData: FormData): Promise<T> {
  const url = `${API_BASE_URL}/documents/${documentId}/replace`;
  const headers = {
    ...getAuthHeader(),
  };

  const response = await fetch(url, {
    method: "PUT",
    headers,
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = `Replace failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export function getDocumentViewUrl(documentId: number): string {
  const token = typeof window !== "undefined" ? localStorage.getItem("staff_access_token") : null;
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${API_BASE_URL}/documents/${documentId}/view${query}`;
}

export function getDocumentDownloadUrl(documentId: number): string {
  const token = typeof window !== "undefined" ? localStorage.getItem("staff_access_token") : null;
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${API_BASE_URL}/documents/${documentId}/download${query}`;
}

export function formatDateUK(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const clean = dateStr.split("T")[0];
  const parts = clean.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}
