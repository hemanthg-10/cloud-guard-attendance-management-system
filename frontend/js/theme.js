/**
 * Theme Management for Cloud Attendance System
 * Supports light/dark mode and persists preference to localStorage
 */

(function() {
    const THEME_KEY = 'app-theme';
    const THEME_DARK = 'dark';
    const THEME_LIGHT = 'light';

    // Apply theme on load
    const savedTheme = localStorage.getItem(THEME_KEY) || THEME_LIGHT;
    document.documentElement.setAttribute('data-bs-theme', savedTheme);

    // Function to toggle theme
    window.toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
        
        document.documentElement.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
        updateThemeIcon(newTheme);
        
        // Dispatch event for components like Charts to re-render
        window.dispatchEvent(new Event('themeChanged'));
    };

    // Update icon based on theme
    function updateThemeIcon(theme) {
        const icon = document.querySelector('.theme-toggle i');
        if (icon) {
            if (theme === THEME_DARK) {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        }
    }

    // Initialize icon on DOM completion
    document.addEventListener('DOMContentLoaded', () => {
        updateThemeIcon(savedTheme);
    });
})();
