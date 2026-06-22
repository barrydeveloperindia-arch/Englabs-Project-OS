import { User, UserRole } from '../types/database.types';

// In-memory cache of the current custom user object
let currentUser: User | null = null;
let initialized = false;
let userListeners: ((user: User | null) => void)[] = [];

const getOrLoadUser = (): User | null => {
    if (!currentUser) {
        try {
            const savedSession = localStorage.getItem('englabs_mock_session');
            if (savedSession) {
                currentUser = JSON.parse(savedSession);
            } else if (localStorage.getItem('englabs_authenticated') === 'true') {
                currentUser = {
                    id: 'admin_test',
                    name: 'ADMIN',
                    email: 'admin@englabs.com',
                    role: (localStorage.getItem('englabs_user_role') as UserRole) || 'ADMIN',
                    status: 'Active',
                    createdAt: new Date().toISOString()
                };
            }
        } catch (e) {
            console.error("Failed to restore session", e);
        }
    }
    return currentUser;
};

const notifyListeners = () => {
    const user = getOrLoadUser();
    userListeners.forEach(listener => listener(user));
};

export const AuthService = {
    /**
     * Initializes the auth listener 
     */
    init: (onUserChanged: (user: User | null) => void) => {
        userListeners.push(onUserChanged);
        if (!initialized) {
            initialized = true;
        }
        // Immediately notify with current state
        onUserChanged(getOrLoadUser());
    },

    getCurrentUser: (): User | null => {
        return getOrLoadUser();
    },
    
    login: async (email: string, password: string): Promise<User | null> => {
        // MOCK LOGIN LOGIC
        if (password === '0001') {
            const user: User = {
                id: `admin_${Date.now()}`,
                name: email.split('@')[0].toUpperCase(),
                email: email,
                role: 'ADMIN', 
                status: 'Active',
                createdAt: new Date().toISOString()
            };
            currentUser = user;
            
            localStorage.setItem('englabs_authenticated', 'true');
            localStorage.setItem('englabs_user_role', user.role);
            localStorage.setItem('englabs_mock_session', JSON.stringify(user));
            
            notifyListeners();
            return user;
        } else {
            throw new Error("Invalid email or password. Use 0001 for Admin access.");
        }
    },
    
    logout: async () => {
        currentUser = null;
        localStorage.removeItem('englabs_authenticated');
        localStorage.removeItem('englabs_user_role');
        localStorage.removeItem('englabs_mock_session');
        notifyListeners();
    },

    resetPassword: async (email: string) => {
        // No-op for mock
        console.log("Mock reset password for", email);
    },

    hasRole: (allowedRoles: UserRole[]): boolean => {
        const user = getOrLoadUser();
        if (!user) return false;
        if (user.role === 'ADMIN') return true;
        return allowedRoles.includes(user.role);
    }
};
