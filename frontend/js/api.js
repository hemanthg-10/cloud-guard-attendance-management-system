/**
 * Local API utility for the attendance portal.
 * This replaces the previous AWS-based flow with a browser-only demo mode.
 */

const STORAGE_KEY = 'attendance-demo-state';

const DEFAULT_STATE = {
    stats: {
        totalStudents: 120,
        present: 88,
        absent: 24,
        late: 8,
        attendancePercentage: 73,
        sections: { A: 31, B: 29, C: 28 }
    },
    history: [
        { date: '2026-07-30', section: 'Section A', status: 'P' },
        { date: '2026-07-30', section: 'Section B', status: 'P' },
        { date: '2026-07-31', section: 'Section A', status: 'L' },
        { date: '2026-08-01', section: 'Section C', status: 'P' }
    ],
    attendanceLog: []
};

const cloneState = (value) => {
    if (typeof structuredClone === 'function') {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
};

const readDemoState = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (!stored) return cloneState(DEFAULT_STATE);

        return {
            ...cloneState(DEFAULT_STATE),
            ...stored,
            stats: {
                ...cloneState(DEFAULT_STATE).stats,
                ...(stored.stats || {})
            },
            history: Array.isArray(stored.history) ? stored.history : cloneState(DEFAULT_STATE).history,
            attendanceLog: Array.isArray(stored.attendanceLog) ? stored.attendanceLog : []
        };
    } catch (error) {
        console.warn('Unable to read local demo state:', error);
        return cloneState(DEFAULT_STATE);
    }
};

const saveDemoState = (state) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const updateStatsFromRecord = (state, record) => {
    const stats = state.stats;
    const sectionKey = (record.section || 'A').toString().toUpperCase().charAt(0);

    if (['A', 'B', 'C'].includes(sectionKey)) {
        stats.sections[sectionKey] = (stats.sections[sectionKey] || 0) + (record.status === 'P' ? 1 : 0);
    }

    stats.present = (stats.present || 0) + (record.status === 'P' ? 1 : 0);
    stats.late = (stats.late || 0) + (record.status === 'L' ? 1 : 0);
    stats.absent = Math.max(0, stats.totalStudents - stats.present - stats.late);
    stats.attendancePercentage = Math.round((stats.present / stats.totalStudents) * 100);
};

const api = {
    async post(endpoint, data) {
        const state = readDemoState();

        if (endpoint === '/attendance' && Array.isArray(data?.records)) {
            const records = data.records.map((record, index) => ({
                ...record,
                id: `${Date.now()}-${index}`
            }));

            records.forEach((record) => {
                updateStatsFromRecord(state, record);
                state.attendanceLog.push(record);
                state.history.push({
                    date: record.date,
                    section: `Section ${record.section || 'A'}`,
                    status: record.status
                });
            });

            saveDemoState(state);
            return {
                success: true,
                message: `Attendance recorded locally for ${records.length} entry${records.length > 1 ? 'ies' : 'y'}.`
            };
        }

        return { success: true, message: 'Request completed locally.' };
    },

    async get(endpoint) {
        const state = readDemoState();

        if (endpoint.startsWith('/dashboard/stats')) {
            return state.stats;
        }

        if (endpoint.startsWith('/students')) {
            const params = new URLSearchParams(endpoint.split('?')[1] || '');
            const section = params.get('section') || 'A';
            return {
                students: [
                    { name: 'Ava Brown', reg_id: 'A001', section },
                    { name: 'Noah Singh', reg_id: 'A002', section },
                    { name: 'Mia Kumar', reg_id: 'A003', section }
                ]
            };
        }

        if (endpoint.startsWith('/attendance/history')) {
            return state.history;
        }

        return { success: true, message: 'Local request completed.' };
    },

    login(email, password) {
        const normalizedEmail = (email || '').trim().toLowerCase();
        const normalizedPassword = (password || '').trim();

        if (!normalizedEmail || !normalizedPassword) {
            return Promise.reject(new Error('Please enter both email and password.'));
        }

        const role = document.getElementById('role')?.value || (normalizedEmail.includes('admin') ? 'admin' : 'teacher');
        const idToken = `local-${role}-${Date.now()}`;

        localStorage.setItem('id_token', idToken);
        localStorage.setItem('user_email', normalizedEmail);
        localStorage.setItem('user_role', role);
        localStorage.setItem('user_groups', JSON.stringify([role]));

        return Promise.resolve({ success: true, groups: [role], role });
    },

    logout() {
        localStorage.clear();
        const isSubdir = window.location.pathname.includes('/register/');
        window.location.href = isSubdir ? '../index.html' : 'index.html';
    },

    checkAuth() {
        const token = localStorage.getItem('id_token');
        if (!token) {
            window.location.href = 'index.html';
        }
    }
};

// UI Helpers
const showMessage = (containerId, message, type = 'success') => {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    }
};

/**
 * Theme Management
 */
const toggleTheme = () => {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
};

const updateThemeIcon = (theme) => {
    const icons = document.querySelectorAll('.theme-toggle i');
    icons.forEach(icon => {
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });
};

(function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    setTimeout(() => updateThemeIcon(savedTheme), 100);
})();

window.logout = () => api.logout();
window.toggleTheme = () => toggleTheme();
window.api = api;
