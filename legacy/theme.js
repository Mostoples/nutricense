/* ============================================
   Nutricense Theme Toggle
   Light / Dark mode with persistence
   ============================================ */

(function () {
    'use strict';

    var KEY = 'nutricense-theme';

    /* ── helpers ── */
    function getStored() {
        try { return localStorage.getItem(KEY); } catch (e) { return null; }
    }

    function setStored(theme) {
        try { localStorage.setItem(KEY, theme); } catch (e) { /* quota / private-mode */ }
    }

    function getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    /* ── core ── */
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        setStored(theme);

        // Update any toggle-icon elements on the page
        var icons = document.querySelectorAll('[data-theme-icon]');
        icons.forEach(function (el) {
            if (theme === 'dark') {
                el.classList.remove('fa-moon');
                el.classList.add('fa-sun');
            } else {
                el.classList.remove('fa-sun');
                el.classList.add('fa-moon');
            }
        });
    }

    function toggleTheme() {
        var current = document.documentElement.getAttribute('data-theme') || getSystemTheme();
        var next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
    }

    /* ── init ── */
    function init() {
        var stored = getStored();
        var theme = stored || getSystemTheme();
        applyTheme(theme);

        // Delegate click on any [data-theme-toggle] button / link
        document.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-theme-toggle]');
            if (btn) {
                e.preventDefault();
                toggleTheme();
            }
        });

        // Listen to system preference changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
                if (!getStored()) {
                    applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    // Run as early as possible – DOMContentLoaded or immediately if DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
