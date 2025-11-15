# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands and tooling

- This project is a static front-end application (HTML/CSS/JS) with **no build, lint, or automated test tooling configured** in the repository.
- There is no `package.json`, Python project file, or other build configuration; all behavior runs directly in the browser.

### Local development / preview

Use any static file server to serve the repository root and open `index.html` or `login.html` in a browser.

Examples (only if the corresponding tools are installed on the machine; these are not project-specific dependencies):

- Python (3.x):
  - `python -m http.server 8000`
  - Then open `http://localhost:8000/index.html` in a browser.
- Node.js with `npx` available:
  - `npx serve .`
  - Then open the served URL (typically `http://localhost:3000/` or similar) and navigate to `/index.html`.

### Tests

- There is no test runner or test configuration in this repository, and no existing automated tests.
- If you introduce a test framework (e.g. Jest/Vitest for JS), update this section with the appropriate commands (e.g. how to run all tests and a single test file).

## High-level architecture

### Overview

- The application is a **multi-page static UI** implementing an "Online Attendance Management System".
- All state is handled **entirely in the browser** using JavaScript and `localStorage`; there is **no backend** and **no real authentication**.
- Core files:
  - HTML pages at the root (`index.html`, `login.html`, `dashboard.html`, `add-student.html`, `mark-attendance.html`, `view-attendance.html`).
  - Shared styling in `css/styles.css`.
  - Main application logic in `js/app.js`.
  - Chart rendering helper in `js/charts.js`.
  - Sample data in `data/sample-data.json`.

### Navigation and layout

- Each HTML page includes a **sidebar + topbar layout** with repeated markup rather than a single SPA shell.
- Navigation is done with normal `<a href="...">` links between separate HTML files (no client-side router).
- The sidebar links:
  - `dashboard.html` (Dashboard)
  - `add-student.html` (Add Student)
  - `mark-attendance.html` (Mark Attendance)
  - `view-attendance.html` (View Attendance)
  - `login.html` is used for logout / re-login.

### Client-side state model

All domain state is held in memory and persisted to `localStorage`:

- **Students**
  - In-memory array `studentsState` with objects: `{ id, name, className, email }`.
  - Bootstrapped from:
    - `localStorage["attendance_students"]` if present and valid, otherwise
    - A hard-coded `demoStudents` array in `js/app.js`.
- **Attendance records**
  - In-memory array `attendanceRecords` with objects: `{ date: 'YYYY-MM-DD', studentId, name, className, status }`.
  - Bootstrapped from `localStorage["attendance_records"]` if present.
- **Current user**
  - Stored in `localStorage["attendance_user"]` as `{ role, username }`.
  - Used only for display (role label and username); there is no server-side auth.

The helper `persistState()` in `js/app.js` writes `studentsState` and `attendanceRecords` back to `localStorage` after mutations.

### Page initialization pattern

`js/app.js` wires all pages via a single `DOMContentLoaded` handler:

- On load, it inspects `window.location.pathname` and dispatches to one of:
  - `initLoginPage()` if path ends with `login.html`.
  - `initDashboardPage()` if path ends with `dashboard.html`.
  - `initAddStudentPage()` if path ends with `add-student.html`.
  - `initMarkAttendancePage()` if path ends with `mark-attendance.html`.
  - `initViewAttendancePage()` if path ends with `view-attendance.html`.
  - Otherwise, it calls `renderUserHeader("currentUser")` for `index.html`.

Each initializer function is responsible for:

- Selecting its page-specific DOM elements.
- Attaching event listeners to forms/buttons.
- Rendering tables and statistics from `studentsState` and `attendanceRecords`.

### Per-page behavior

#### `login.html` / `initLoginPage`

- Implements a **mock login** form.
- Any username/password is accepted; the selected role (`admin`, `teacher`, `student`) and username are stored in `localStorage["attendance_user"]`.
- On submit, redirects to `dashboard.html`.

#### `dashboard.html` / `initDashboardPage`

- Displays:
  - Total number of students.
  - Number present/absent **for today**.
  - Average attendance percentage for today (present / total marked for today).
- Derives "today" as `new Date().toISOString().slice(0, 10)` and filters `attendanceRecords` for that date.
- Aggregates **per-day attendance totals** into a map and passes them to `renderAttendanceChart(...)` (from `js/charts.js`) to render a custom canvas bar chart.

#### `add-student.html` / `initAddStudentPage`

- Renders the current student list into the `#studentsTable` body.
- Handles the Add Student form:
  - Reads `studentId`, `studentName`, `studentClass`, and `studentEmail` from inputs.
  - Appends a new student object to `studentsState`.
  - Calls `persistState()` to save to `localStorage`.
  - Re-renders the table.

#### `mark-attendance.html` / `initMarkAttendancePage`

- Manages attendance **per date**:
  - Maintains a `currentDate` (default today) synced with the `#attendanceDate` input.
  - For the selected date, renders a row per student with a `<select>` for status (`Present` or `Absent`).
- On "Load Students" (date form submit):
  - Updates `currentDate` and re-renders rows, pre-filling status from any existing `attendanceRecords` for that date.
- On "Save Attendance":
  - Removes prior records for `currentDate` from `attendanceRecords`.
  - Pushes new records for each student, using the selected status.
  - Calls `persistState()` and shows a simple `alert` confirmation.

#### `view-attendance.html` / `initViewAttendancePage`

- Provides filtering and export over all `attendanceRecords`:
  - Filters by date, student (name or ID substring, case-insensitive), and status.
  - Renders results into `#recordsTable` with a status badge (`Present` / `Absent`).
- Export helpers:
  - **Export Excel**: calls `exportTableToCSV(table, "attendance-records.csv")` to generate a CSV file compatible with Excel.
  - **Export PDF**: calls `exportTableToPDF(table, "Attendance Records")`, which opens a new window containing a styled HTML table and triggers the print dialog.

### Utility functions and cross-cutting concerns

All of the following live in `js/app.js` and are used across multiple pages:

- `getCurrentUser()` / `setCurrentUser(user)`
  - Wrap `localStorage` access for the current user object.
- `renderUserHeader(elementId)`
  - Populates header elements like `#dashboardUser`, `#addStudentUser`, etc., with either "Guest" or `ROLE • username` based on `attendance_user`.
- `formatDate(dateStr)`
  - Formats a `YYYY-MM-DD` date string using `toLocaleDateString()` for display in tables.
- `exportTableToCSV(table, filename)`
  - Serializes an HTML table into CSV with basic escaping.
- `exportTableToPDF(table, title)`
  - Opens a new window with minimal styling and the table HTML, then calls `print()`.

### Chart rendering (`js/charts.js`)

- Defines a global function `renderAttendanceChart(canvas, labels, presentData, absentData)`; there is no module system.
- Uses the Canvas 2D context directly to draw:
  - Axes and grid lines.
  - Grouped bars for Present/Absent per date.
  - Rotated x-axis labels and a simple legend.
- `dashboard.html` includes `js/charts.js` **before** `js/app.js` so that `renderAttendanceChart` is available when `initDashboardPage()` runs.

### Data file (`data/sample-data.json`)

- Contains a JSON structure mirroring the in-code demo data:
  - `students`: initial student list.
  - `attendanceRecords`: empty array.
- Currently, this file is **not read dynamically**; it serves as a reference/example of the expected data shapes.

---

If you introduce new tooling (build, lint, tests) or significant architectural changes (e.g. converting to a SPA framework or adding a backend), update this file so future Warp agents can operate with accurate, up-to-date context.