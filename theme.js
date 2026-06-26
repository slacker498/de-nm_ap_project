(function () {
    // 1. Storage Helpers
    function lsGet(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }
    function lsSet(key, val) {
        try { localStorage.setItem(key, val); } catch (e) { }
    }

    // 2. Theme Application Logic
    function applyTheme(theme) {
        if (theme === 'light') {
            document.documentElement.classList.add('light');
        } else {
            document.documentElement.classList.remove('light');
        }
    }

    function toggleTheme() {
        const isLight = document.documentElement.classList.toggle('light');
        lsSet('theme', isLight ? 'light' : 'dark');
    }

    // 3. Initial Execution (Prevent Flash)
    const storedTheme = lsGet('theme');
    const systemPrefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    
    if (storedTheme) {
        applyTheme(storedTheme);
    } else if (systemPrefersLight) {
        applyTheme('light');
    }

    // 4. Single Event Listener (Delegation)
    // We use a standard click listener. No need for Capture phase (true).
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.theme-toggle-btn');
        if (btn) {
            e.preventDefault();
            toggleTheme();
        }
    });
})();