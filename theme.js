(function () {
    // Storage key for theme preference
    const THEME_KEY = 'theme';
    const LIGHT_CLASS = 'light';
    
    // 1. Storage Helpers with better error handling
    function getStoredTheme() {
        try {
            return localStorage.getItem(THEME_KEY);
        } catch (e) {
            console.warn('localStorage unavailable, using system preference');
            return null;
        }
    }
    
    function saveTheme(theme) {
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (e) {
            console.warn('Failed to save theme to localStorage');
        }
    }
    
    // Get current theme from DOM
    function getCurrentTheme() {
        return document.documentElement.classList.contains(LIGHT_CLASS) ? 'light' : 'dark';
    }
    
    // Apply theme to DOM
    function applyTheme(theme) {
        const isLight = theme === 'light';
        if (isLight) {
            document.documentElement.classList.add(LIGHT_CLASS);
        } else {
            document.documentElement.classList.remove(LIGHT_CLASS);
        }
    }
    
    // Toggle between light and dark
    function toggleTheme() {
        const currentTheme = getCurrentTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
        saveTheme(newTheme);
    }
    
    // 2. Initialize theme on page load
    function initializeTheme() {
        const storedTheme = getStoredTheme();
        
        if (storedTheme) {
            // Use stored preference
            applyTheme(storedTheme);
        } else {
            // Fall back to system preference
            const systemPrefersLight = window.matchMedia && 
                                       window.matchMedia('(prefers-color-scheme: light)').matches;
            if (systemPrefersLight) {
                applyTheme('light');
            }
            // else: keep default dark theme
        }
    }
    
    // 3. Initialize theme before page renders (prevent flash)
    initializeTheme();
    
    // 4. Attach event listener for theme toggle buttons
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.theme-toggle-btn');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            toggleTheme();
        }
    }, false);
    
    // 5. Listen for system theme changes (dark/light mode toggle in OS)
    if (window.matchMedia) {
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        darkModeQuery.addEventListener('change', (e) => {
            // Only apply if user hasn't set a preference
            if (!getStoredTheme()) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
})();