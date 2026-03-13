import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getToken, setToken, removeToken, getCurrentUser } from '../services/api';

export interface UserData {
    id?: string;
    name: string;
    email: string;
    picture: string;
    sub?: string;
    // Extended fields from backend
    user_type?: string;
    is_verified?: boolean;
    profile_completed?: boolean;
}

interface UserContextType {
    user: UserData | null;
    token: string | null;
    isLoading: boolean;
    setUser: (user: UserData | null, token?: string) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUserState] = useState<UserData | null>(null);
    const [token, setTokenState] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const initAuth = async () => {
            const savedToken = getToken();
            const savedUser = localStorage.getItem('campaia_user');

            if (savedToken && savedUser) {
                try {
                    setTokenState(savedToken);
                    setUserState(JSON.parse(savedUser));

                    // Optionally refresh user data from backend
                    // const freshUser = await getCurrentUser();
                    // setUserState(prev => ({ ...prev, ...freshUser }));
                } catch (e) {
                    console.error("Failed to restore session", e);
                    // Clear invalid data
                    removeToken();
                    localStorage.removeItem('campaia_user');
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const setUser = (userData: UserData | null, accessToken?: string) => {
        setUserState(userData);

        if (userData) {
            localStorage.setItem('campaia_user', JSON.stringify(userData));
            if (accessToken) {
                setToken(accessToken);
                setTokenState(accessToken);
            }
        } else {
            localStorage.removeItem('campaia_user');
            removeToken();
            setTokenState(null);
        }
    };

    const logout = () => {
        setUser(null);
        removeToken();
        setTokenState(null);
        localStorage.removeItem('campaia_user');
        window.location.href = '/';
    };

    const refreshUser = async () => {
        if (!token) return;

        try {
            const freshUser = await getCurrentUser();
            setUserState(prev => prev ? {
                ...prev,
                ...freshUser,
                name: freshUser.full_name,
                picture: freshUser.picture_url || prev.picture,
            } : null);
        } catch (e) {
            console.error("Failed to refresh user", e);
            // Token might be invalid
            logout();
        }
    };

    return (
        <UserContext.Provider value={{ user, token, isLoading, setUser, logout, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within a UserProvider');
    return context;
};