// app.js - Core logic for Online Attendance Management System
// Simple in-memory demo data and UI wiring for login, students, attendance, charts, and export.

// ---- Demo data ----
const demoStudents = [
  { id: "STU001", name: "Alice Johnson", className: "10-A", email: "alice@example.com" },
  { id: "STU002", name: "Brian Lee", className: "10-A", email: "brian@example.com" },
  { id: "STU003", name: "Chandni Patel", className: "10-B", email: "chandni@example.com" },
  { id: "STU004", name: "David Kim", className: "10-B", email: "david@example.com" }
];

// attendanceRecords: array of { date: 'YYYY-MM-DD', studentId, name, className, status }
let attendanceRecords = [];

// Load demo data from localStorage if present, otherwise seed with defaults.
(function bootstrapData() {
  try {
    const storedStudents = JSON.parse(localStorage.getItem("attendance_students"));
    const storedRecords = JSON.parse(localStorage.getItem("attendance_records"));
    if (Array.isArray(storedStudents) && storedStudents.length) {
      studentsState = storedStudents;
    } else {
      studentsState = [...demoStudents];
    }
    if (Array.isArray(storedRecords)) {
      attendanceRecords = storedRecords;
    }
  } catch (e) {
    studentsState = [...demoStudents];
  }
})();

let studentsState = studentsState || [...demoStudents];

function persistState() {
  localStorage.setItem("attendance_students", JSON.stringify(studentsState));
  localStorage.setItem("attendance_records", JSON.stringify(attendanceRecords));
}

// Utility: get current user from localStorage
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("attendance_user"));
  } catch {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem("attendance_user", JSON.stringify(user));
}

// Format date for display
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString();
}

// Simple CSV export (Excel-compatible)
function exportTableToCSV(table, filename) {
  const rows = Array.from(table.querySelectorAll("tr"));
  const csv = rows
    .map(row => {
      return Array.from(row.querySelectorAll("th,td"))
        .map(cell => '"' + cell.innerText.replace(/"/g, '""') + '"')
        .join(",");
    })
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Very small PDF-like export using a new window and print dialog.
function exportTableToPDF(table, title) {
  const win = window.open("", "_blank");
  if (!win) return;
  const html = `<!DOCTYPE html>
<html><head><title>${title}</title>
<style>
  body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 16px; }
  h1 { font-size: 18px; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  thead { background: #f3f4f6; }
</style>
</head><body>
<h1>${title}</h1>
${table.outerHTML}
</body></html>`;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

// Render user name in headers if available
function renderUserHeader(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const user = getCurrentUser();
  if (!user) {
    el.textContent = "Guest";
  } else {
    el.textContent = `${user.role.toUpperCase()} • ${user.username}`;
  }
}

// ---- Page initializers ----

document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;
  if (path.endsWith("login.html")) {
    initLoginPage();
  } else if (path.endsWith("dashboard.html")) {
    initDashboardPage();
  } else if (path.endsWith("add-student.html")) {
    initAddStudentPage();
  } else if (path.endsWith("mark-attendance.html")) {
    initMarkAttendancePage();
  } else if (path.endsWith("view-attendance.html")) {
    initViewAttendancePage();
  } else {
    renderUserHeader("currentUser");
  }
});

// Login: mock validation, then redirect to dashboard
function initLoginPage() {
  const form = document.getElementById("loginForm");
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const role = document.getElementById("role").value;
    const username = document.getElementById("username").value.trim() || "User";
    setCurrentUser({ role, username });
    window.location.href = "dashboard.html";
  });
}

// Dashboard: stats + chart
function initDashboardPage() {
  renderUserHeader("dashboardUser");
  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = attendanceRecords.filter(r => r.date === today);

  const totalStudents = studentsState.length;
  const present = todayRecords.filter(r => r.status === "Present").length;
  const absent = todayRecords.filter(r => r.status === "Absent").length;
  const totalMarked = todayRecords.length || 1;
  const avg = Math.round((present / totalMarked) * 100);

  const totalEl = document.getElementById("statTotalStudents");
  const presentEl = document.getElementById("statTodayPresent");
  const absentEl = document.getElementById("statTodayAbsent");
  const avgEl = document.getElementById("statAverage");
  if (totalEl) totalEl.textContent = String(totalStudents);
  if (presentEl) presentEl.textContent = String(present);
  if (absentEl) absentEl.textContent = String(absent);
  if (avgEl) avgEl.textContent = `${avg}%`;

  // chart
  const dailyMap = {};
  attendanceRecords.forEach(r => {
    if (!dailyMap[r.date]) dailyMap[r.date] = { Present: 0, Absent: 0 };
    dailyMap[r.date][r.status]++;
  });
  const labels = Object.keys(dailyMap).sort();
  const presentData = labels.map(d => dailyMap[d].Present);
  const absentData = labels.map(d => dailyMap[d].Absent);

  if (typeof renderAttendanceChart === "function") {
    renderAttendanceChart(
      document.getElementById("attendanceChart"),
      labels,
      presentData,
      absentData
    );
  }
}

// Add Student page
function initAddStudentPage() {
  renderUserHeader("addStudentUser");
  const form = document.getElementById("addStudentForm");
  const tableBody = document.querySelector("#studentsTable tbody");

  function renderStudents() {
    if (!tableBody) return;
    tableBody.innerHTML = "";
    studentsState.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${s.id}</td><td>${s.name}</td><td>${s.className}</td><td>${s.email || ""}</td>`;
      tableBody.appendChild(tr);
    });
  }

  renderStudents();

  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const id = document.getElementById("studentId").value.trim();
      const name = document.getElementById("studentName").value.trim();
      const className = document.getElementById("studentClass").value.trim();
      const email = document.getElementById("studentEmail").value.trim();
      if (!id || !name || !className) return;
      studentsState.push({ id, name, className, email });
      persistState();
      form.reset();
      renderStudents();
    });
  }
}

// Mark Attendance page
function initMarkAttendancePage() {
  renderUserHeader("markAttendanceUser");
  const dateForm = document.getElementById("attendanceDateForm");
  const tableBody = document.querySelector("#attendanceTable tbody");
  const markForm = document.getElementById("markAttendanceForm");

  let currentDate = new Date().toISOString().slice(0, 10);
  const dateInput = document.getElementById("attendanceDate");
  if (dateInput) dateInput.value = currentDate;

  function renderRows() {
    if (!tableBody) return;
    tableBody.innerHTML = "";
    studentsState.forEach(s => {
      const existing = attendanceRecords.find(r => r.date === currentDate && r.studentId === s.id);
      const status = existing ? existing.status : "Present";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.id}</td>
        <td>${s.name}</td>
        <td>${s.className}</td>
        <td>
          <select name="status_${s.id}" class="form-input">
            <option value="Present" ${status === "Present" ? "selected" : ""}>Present</option>
            <option value="Absent" ${status === "Absent" ? "selected" : ""}>Absent</option>
          </select>
        </td>`;
      tableBody.appendChild(tr);
    });
  }

  renderRows();

  if (dateForm) {
    dateForm.addEventListener("submit", e => {
      e.preventDefault();
      currentDate = dateInput.value;
      renderRows();
    });
  }

  if (markForm) {
    markForm.addEventListener("submit", e => {
      e.preventDefault();
      // remove existing records for that date
      attendanceRecords = attendanceRecords.filter(r => r.date !== currentDate);
      studentsState.forEach(s => {
        const statusSelect = document.querySelector(`select[name="status_${s.id}"]`);
        const status = statusSelect ? statusSelect.value : "Present";
        attendanceRecords.push({
          date: currentDate,
          studentId: s.id,
          name: s.name,
          className: s.className,
          status
        });
      });
      persistState();
      alert("Attendance saved for " + formatDate(currentDate));
    });
  }
}

// View Attendance page
function initViewAttendancePage() {
  renderUserHeader("viewAttendanceUser");
  const form = document.getElementById("filterForm");
  const resetBtn = document.getElementById("resetFilters");
  const tableBody = document.querySelector("#recordsTable tbody");
  const exportExcelBtn = document.getElementById("exportExcel");
  const exportPdfBtn = document.getElementById("exportPdf");

  function applyFilters() {
    const dateVal = document.getElementById("filterDate").value;
    const studentVal = document.getElementById("filterStudent").value.trim().toLowerCase();
    const statusVal = document.getElementById("filterStatus").value;

    let filtered = [...attendanceRecords];
    if (dateVal) {
      filtered = filtered.filter(r => r.date === dateVal);
    }
    if (studentVal) {
      filtered = filtered.filter(
        r =>
          r.name.toLowerCase().includes(studentVal) ||
          r.studentId.toLowerCase().includes(studentVal)
      );
    }
    if (statusVal) {
      filtered = filtered.filter(r => r.status === statusVal);
    }

    renderRecords(filtered);
  }

  function renderRecords(records) {
    if (!tableBody) return;
    tableBody.innerHTML = "";
    records.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${formatDate(r.date)}</td>
        <td>${r.studentId}</td>
        <td>${r.name}</td>
        <td>${r.className}</td>
        <td>
          <span class="badge ${r.status === "Present" ? "present" : "absent"}">
            ${r.status}
          </span>
        </td>`;
      tableBody.appendChild(tr);
    });
  }

  renderRecords(attendanceRecords);

  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      applyFilters();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      form.reset();
      renderRecords(attendanceRecords);
    });
  }

  if (exportExcelBtn) {
    exportExcelBtn.addEventListener("click", () => {
      const table = document.getElementById("recordsTable");
      if (table) exportTableToCSV(table, "attendance-records.csv");
    });
  }

  if (exportPdfBtn) {
    exportPdfBtn.addEventListener("click", () => {
      const table = document.getElementById("recordsTable");
      if (table) exportTableToPDF(table, "Attendance Records");
    });
  }
}