// assets/js/theme.js

const THEME_KEY = 'user-theme-preference';

/**
 * Initialize theme on page load
 */
function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Determine initial mode: saved preference > system preference > default (dark)
    let isLightMode = false;

    if (savedTheme === 'light') {
        isLightMode = true;
    } else if (savedTheme === 'dark') {
        isLightMode = false;
    } else {
        // Default to dark if no preference exists
        isLightMode = !prefersDark;
    }

    // Apply the mode
    if (isLightMode) {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }

    updateButtonText(isLightMode);
}

/**
 * Toggle between light and dark mode
 */
function toggleTheme() {
    const isLight = !document.body.classList.contains('light-mode');

    if (isLight) {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }

    // Save preference
    localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');

    // Update button text
    updateButtonText(isLight);
}

/**
 * Update the button text based on current state
 */
function updateButtonText(isLight) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    const textSpan = btn.querySelector('.text');
    if (textSpan) {
        textSpan.textContent = isLight ? 'Switch to Dark' : 'Switch to Light';
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleTheme);
    }
});
