/**
 * Campaia API Service
 * 
 * Handles all API communication with the backend.
 * Automatically includes JWT token in requests when available.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Token storage keys
const TOKEN_KEY = 'campaia_token';
const USER_KEY = 'campaia_user';

/**
 * Get stored JWT token
 */
export const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

/**
 * Store JWT token
 */
export const setToken = (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Remove JWT token
 */
export const removeToken = (): void => {
    localStorage.removeItem(TOKEN_KEY);
};

/**
 * API request wrapper with automatic token handling
 */
export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // Skip ngrok warning page
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
        return {} as T;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }

    return {} as T;
}

// ============================================
// Auth API
// ============================================

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: {
        id: string;
        email: string;
        name: string;
        picture: string | null;
        sub?: string;
    };
}

export interface UserData {
    id: string;
    email: string;
    full_name: string;
    picture_url: string | null;
    user_type: string;
    is_active: boolean;
    is_verified: boolean;
    profile_completed: boolean;
    created_at: string;
}

/**
 * Authenticate with Google OAuth
 */
export const authGoogle = async (accessToken: string): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/api/v1/auth/google', {
        method: 'POST',
        body: JSON.stringify({ access_token: accessToken }),
    });
};

/**
 * Register with email/password
 */
export const register = async (
    email: string,
    fullName: string,
    password: string
): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, full_name: fullName, password }),
    });
};

/**
 * Login with email/password
 */
export const login = async (email: string, password: string): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
};

/**
 * Get current user info
 */
export const getCurrentUser = async (): Promise<UserData> => {
    return apiRequest<UserData>('/api/v1/auth/me');
};

/**
 * Logout (clears local storage)
 */
export const logout = (): void => {
    removeToken();
    localStorage.removeItem(USER_KEY);
};

// ============================================
// Health Check
// ============================================

export const checkHealth = async (): Promise<{ status: string }> => {
    return apiRequest<{ status: string }>('/health');
};

export default {
    authGoogle,
    register,
    login,
    getCurrentUser,
    logout,
    getToken,
    setToken,
    removeToken,
    checkHealth,
};
