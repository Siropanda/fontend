import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as loginApi, logout as logoutApi, getCurrentUser } from '../services/auth.service';
import { LoginCredentials, User } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    loginDemo: () => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    // We can initialize isAuthenticated based on token presence, 
    // but it's better to verify user profile or just check token existence initially.
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));

    // Note: We don't have access to useNavigate here because AuthProvider 
    // is often placed inside BrowserRouter but we might place it outside or pass navigate.
    // Ideally, AuthProvider should be inside BrowserRouter.

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            console.log("AuthContext: Initializing, token present:", !!token);
            if (token) {
                try {
                    // Verify token by fetching user profile
                    // Note: If you don't have a /me endpoint that returns user details, 
                    // you might need to decode the token or just assume validity until 401.
                    // For now let's try to get current user if possible, or just trusting the token.

                    // If your backend doesn't support /me yet, you can skip this call 
                    // and just set isAuthenticated = true.
                    // const userData = await getCurrentUser(); 
                    // setUser(userData);
                    setIsAuthenticated(true);
                    console.log("AuthContext: Token found, setting authenticated=true");
                } catch (error) {
                    console.error("AuthContext: Token verification failed", error);
                    // Do NOT logout here automatically on network error.
                    // Let the API interceptor handle 401s.
                    // logoutApi(); 
                    // setUser(null);
                    // setIsAuthenticated(false);

                    // If we want to be safe, we can keep isAuthenticated=true if we have a token,
                    // and let subsequent API calls fail if it's invalid.
                }
            } else {
                console.log("AuthContext: No token found");
                setIsAuthenticated(false);
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (credentials: LoginCredentials) => {
        try {
            const data = await loginApi(credentials);
            localStorage.setItem('token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            setIsAuthenticated(true);

            // Optionally fetch user details immediately
            // const userData = await getCurrentUser();
            // setUser(userData);

        } catch (error: any) {
            console.error("Login failed", error);

            // Fallback: If network error (backend down), allow mock login for demonstration
            if (!error.response) {
                console.warn("Backend unreachable. Logging in with MOCK token.");
                localStorage.setItem('token', 'mock-token-12345');
                setIsAuthenticated(true);
                return;
            }

            throw error;
        }
    };

    const loginDemo = async () => {
        // Bypass backend entirely
        console.log("AuthContext: Logging in as Demo User");
        localStorage.setItem('token', 'demo-token-bypass');
        setIsAuthenticated(true);
        setUser({
            id: 'demo-user',
            username: 'Demo User',
            email: 'demo@example.com',
            role: 'admin'
        });
    };

    const logout = () => {
        logoutApi();
        setUser(null);
        setIsAuthenticated(false);
        // You might want to redirect here, but context often just updates state
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, login, loginDemo, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
