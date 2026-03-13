export const safeStorage = {
    getItem: (key: string) => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                return localStorage.getItem(key);
            }
        } catch (e) {
            console.warn('Storage access failed', e);
        }
        return null;
    },
    setItem: (key: string, value: string) => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(key, value);
            }
        } catch (e) {
            console.warn('Storage write failed', e);
        }
    }
};