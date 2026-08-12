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

// Dropdown hover stabilization for nav menus
(function () {
    // Small delay to avoid flicker when moving between button and menu
    const HIDE_DELAY = 150;

    function showMenu(menu) {
        menu.classList.remove('hidden');
        menu.classList.add('block');
    }

    function hideMenu(menu) {
        menu.classList.remove('block');
        menu.classList.add('hidden');
    }

    document.addEventListener('DOMContentLoaded', () => {
        const dropdownWrappers = document.querySelectorAll('.relative.group');
        dropdownWrappers.forEach(wrapper => {
            const button = wrapper.querySelector('button');
            const menu = wrapper.querySelector('div[role="menu"], div');
            if (!button || !menu) return;

            // Ensure menu starts hidden if it has 'hidden' class handled in markup
            let hideTimeout = null;

            wrapper.addEventListener('mouseenter', () => {
                if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
                showMenu(menu);
            });

            wrapper.addEventListener('mouseleave', () => {
                hideTimeout = setTimeout(() => hideMenu(menu), HIDE_DELAY);
            });

            // Keep open when focusing with keyboard
            button.addEventListener('focus', () => showMenu(menu));
            button.addEventListener('blur', () => {
                hideTimeout = setTimeout(() => hideMenu(menu), HIDE_DELAY);
            });

            // Also allow hovering the menu itself to keep it open
            menu.addEventListener('mouseenter', () => {
                if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
                showMenu(menu);
            });
            menu.addEventListener('mouseleave', () => {
                hideTimeout = setTimeout(() => hideMenu(menu), HIDE_DELAY);
            });
        });
    });
})();