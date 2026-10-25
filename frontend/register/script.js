/**
 * Attendance Register Script
 * Handles student data fetching from API and UI logic
 */

const SECTIONS = ['A', 'B', 'C'];
let students = []; 
let attendanceState = {}; // { studentId: status }

/**
 * Initialize data from URL or default
 */
async function initData() {
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section');
    const date = urlParams.get('date');

    if (section && SECTIONS.includes(section)) {
        document.getElementById('class-selector').value = section;
    }
    if (date) {
        document.getElementById('attendance-date').value = date;
    }
    await fetchStudents();
}

/**
 * Fetch Students from API
 */
async function fetchStudents() {
    const selectedClass = document.getElementById('class-selector').value;
    const selectedDate = document.getElementById('attendance-date').value;
    const tableBody = document.getElementById('register-body');
    
    // Update URL without reloading
    const url = new URL(window.location);
    url.searchParams.set('section', selectedClass);
    url.searchParams.set('date', selectedDate);
    window.history.replaceState({}, '', url);

    // Initial state setup (will be populated from API)
    attendanceState = {};

    tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary"></div> Loading students...</td></tr>`;

    try {
        students = await api.get(`/students?section=${selectedClass}&date=${selectedDate}`);
        
        // Mark saved status from backend
        students.forEach(s => {
            if (s.status) {
                attendanceState[s.reg_id] = s.status;
            }
        });

        renderRegister();
    } catch (err) {
        console.error(err);
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-danger">Failed to load students: ${err.message}</td></tr>`;
    }
}

/**
 * Render Table Rows for the selected class and filters
 */
function renderRegister() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    
    const tableBody = document.getElementById('register-body');
    tableBody.innerHTML = '';

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.student_name.toLowerCase().includes(searchTerm) || s.reg_id.toLowerCase().includes(searchTerm);
        const status = attendanceState[s.reg_id] || 'unmarked';
        const matchesStatus = statusFilter === 'all' || 
                             (statusFilter === 'present' && status === 'P') ||
                             (statusFilter === 'absent' && status === 'A') ||
                             (statusFilter === 'late' && status === 'L') ||
                             (statusFilter === 'unmarked' && status === 'unmarked');
        
        return matchesSearch && matchesStatus;
    });

    if (filteredStudents.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">No students found</td></tr>`;
        return;
    }

    filteredStudents.forEach(student => {
        const status = attendanceState[student.reg_id] || '';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="fw-bold text-muted">${student.reg_id}</td>
            <td>${student.student_name}</td>
            <td class="text-center">${student.section}</td>
            <td>
                <div class="status-radio-group">
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="status-${student.reg_id}" id="p-${student.reg_id}" value="P" ${status === 'P' ? 'checked' : ''} onchange="updateStatus('${student.reg_id}', 'P')">
                        <label class="form-check-label status-label text-success" for="p-${student.reg_id}">P</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="status-${student.reg_id}" id="a-${student.reg_id}" value="A" ${status === 'A' ? 'checked' : ''} onchange="updateStatus('${student.reg_id}', 'A')">
                        <label class="form-check-label status-label text-danger" for="a-${student.reg_id}">A</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="status-${student.reg_id}" id="l-${student.reg_id}" value="L" ${status === 'L' ? 'checked' : ''} onchange="updateStatus('${student.reg_id}', 'L')">
                        <label class="form-check-label status-label text-warning" for="l-${student.reg_id}">L</label>
                    </div>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    updateSummary();
}

/**
 * Update individual status
 */
function updateStatus(id, status) {
    attendanceState[id] = status;
    updateSummary();
}

/**
 * Update Summary Counts for the current class
 */
function updateSummary() {
    let p = 0, a = 0, l = 0;
    
    students.forEach(s => {
        const status = attendanceState[s.reg_id];
        if (status === 'P') p++;
        else if (status === 'A') a++;
        else if (status === 'L') l++;
    });

    document.getElementById('total-count').textContent = students.length;
    document.getElementById('present-count').textContent = p;
    document.getElementById('absent-count').textContent = a;
    document.getElementById('late-count').textContent = l;
}

/**
 * Bulk Action Handlers
 */
function markAll(status) {
    const val = status === 'present' ? 'P' : (status === 'absent' ? 'A' : 'L');
    students.forEach(s => {
        attendanceState[s.reg_id] = val;
    });
    renderRegister();
}

function clearSelection() {
    students.forEach(s => {
        delete attendanceState[s.reg_id];
    });
    renderRegister();
}

/**
 * Save Attendance to API
 */
async function saveAttendance() {
    const btn = document.getElementById('save-btn');
    const originalText = btn.innerHTML;
    const date = document.getElementById('attendance-date').value;
    const section = document.getElementById('class-selector').value;

    if (!date) {
        alert('Please select a date');
        return;
    }

    const records = students.map(s => ({
        date: date,
        reg_id: s.reg_id,
        section: s.section,
        status: attendanceState[s.reg_id] || 'A' // Default to Absent if unmarked
    }));

    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Saving...`;
    
    try {
        await api.post('/attendance', { records });
        
        // Show professional success feedback
        btn.innerHTML = `<i class="fas fa-check me-2"></i> Attendance Saved!`;
        btn.classList.replace('btn-primary', 'btn-success');
        
        const toastEl = document.getElementById('success-toast');
        if (toastEl) {
            const toast = new bootstrap.Toast(toastEl);
            toast.show();
        }
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.replace('btn-success', 'btn-primary');
            btn.disabled = false;
        }, 3000);
    } catch (err) {
        console.error(err);
        alert('Failed to save attendance: ' + err.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

/**
 * Export Functionality
 */
function exportData() {
    const modal = new bootstrap.Modal(document.getElementById('exportModal'));
    modal.show();
}

function exportToCSV() {
    const section = document.getElementById('class-selector').value;
    const date = document.getElementById('attendance-date').value;
    
    // Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Registration ID,Student Name,Section,Status\n";
    
    // Data rows
    students.forEach(s => {
        const status = attendanceState[s.reg_id] || 'Unmarked';
        const statusFull = status === 'P' ? 'Present' : (status === 'A' ? 'Absent' : (status === 'L' ? 'Late' : 'Unmarked'));
        csvContent += `"${s.reg_id}","${s.student_name}","${s.section}","${statusFull}"\n`;
    });
    
    // Download trigger
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_Report_Section_${section}_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportToPDF() {
    // Hide modal before printing
    const modalEl = document.getElementById('exportModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
    
    // Smooth delay to ensure modal is gone
    setTimeout(() => {
        window.print();
    }, 500);
}

// Initial Setup
window.onload = () => {
    initData();
};
