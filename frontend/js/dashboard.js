const BACKEND_URL = "http://localhost:3000";

// Redirect if not logged in
var userData = JSON.parse(localStorage.getItem("era_user"));
if (!userData) {
  window.location.href = "index.html";
}

var fullName   = userData.first_name + " " + userData.last_name;
var studentId  = userData.student_id;

// Show name in navbar
var dashboardUser = document.getElementById("dashboard-user");
if (dashboardUser) {
  dashboardUser.textContent = "👤 " + fullName;
}

// Personalize welcome heading
var welcomeHeading = document.getElementById("welcome-heading");
if (welcomeHeading) {
  welcomeHeading.textContent = "Welcome back, " + userData.first_name + "!";
}

// Fetch student profile to show grade level
if (studentId) {
  fetch(BACKEND_URL + "/students/" + studentId)
    .then(function (response) { return response.json(); })
    .then(function (data) {
      var gradeEl = document.getElementById("student-grade");
      if (gradeEl && data.grade_level) {
        gradeEl.textContent = "Grade Level: " + data.grade_level;
      }
    })
    .catch(function () {});
}

// Load all tabs on page load
loadClasses();
loadGrades();
loadAssignments();
loadAttendance();

// ── TAB SWITCHING ─────────────────────────────────────────────────────────────

function switchTab(tabName, btn) {
  document.querySelectorAll(".tab-content").forEach(function (c) {
    c.classList.remove("active");
  });
  document.querySelectorAll(".tab-btn").forEach(function (b) {
    b.classList.remove("active");
  });
  document.getElementById("tab-" + tabName).classList.add("active");
  btn.classList.add("active");
}

// ── MY CLASSES ────────────────────────────────────────────────────────────────

function loadClasses() {
  fetch(BACKEND_URL + "/enrollments")
    .then(function (response) { return response.json(); })
    .then(function (data) {
      var userClasses = data.filter(function (e) {
        return e.first_name === userData.first_name && e.last_name === userData.last_name;
      });

      var content = document.getElementById("classes-content");

      if (userClasses.length === 0) {
        content.innerHTML = '<p class="no-classes">No classes found. Please contact the school office.</p>';
        return;
      }

      var html = '<table class="classes-table"><thead><tr><th>Class</th><th>Teacher</th></tr></thead><tbody>';
      userClasses.forEach(function (cls) {
        html += "<tr><td>" + cls.class_name + "</td><td>" + cls.teacher_name + "</td></tr>";
      });
      html += "</tbody></table>";
      content.innerHTML = html;
    })
    .catch(function () {
      document.getElementById("classes-content").innerHTML =
        '<p class="error-text">Could not load classes. Make sure the server is running.</p>';
    });
}

// ── MY GRADES ─────────────────────────────────────────────────────────────────

function loadGrades() {
  if (!studentId) {
    document.getElementById("grades-content").innerHTML =
      '<p class="no-classes">No student ID linked to this account. Please contact the school office.</p>';
    return;
  }

  fetch(BACKEND_URL + "/students/" + studentId + "/grades")
    .then(function (response) { return response.json(); })
    .then(function (data) {
      var content = document.getElementById("grades-content");

      if (data.length === 0) {
        content.innerHTML = '<p class="no-classes">No grades recorded yet.</p>';
        return;
      }

      var html = '<table class="classes-table"><thead><tr><th>Class</th><th>Grade</th></tr></thead><tbody>';
      data.forEach(function (g) {
        html += "<tr><td>" + g.class_name +
          "</td><td><span class='grade-badge'>" + g.grade_value + "</span></td></tr>";
      });
      html += "</tbody></table>";
      content.innerHTML = html;
    })
    .catch(function () {
      document.getElementById("grades-content").innerHTML =
        '<p class="error-text">Could not load grades. Make sure the server is running.</p>';
    });
}

// ── MY ASSIGNMENTS ────────────────────────────────────────────────────────────

function loadAssignments() {
  if (!studentId) {
    document.getElementById("assignments-content").innerHTML =
      '<p class="no-classes">No student ID linked to this account. Please contact the school office.</p>';
    return;
  }

  fetch(BACKEND_URL + "/students/" + studentId + "/assignments")
    .then(function (response) { return response.json(); })
    .then(function (data) {
      var content = document.getElementById("assignments-content");

      if (data.length === 0) {
        content.innerHTML = '<p class="no-classes">No assignments found.</p>';
        return;
      }

      var html = '<table class="classes-table"><thead><tr><th>Class</th><th>Assignment</th><th>Due Date</th><th>Score</th></tr></thead><tbody>';
      data.forEach(function (a) {
        var score = a.score !== null
          ? a.score + " / " + a.max_points
          : "<span class='pending-badge'>Pending</span>";
        html += "<tr><td>" + a.class_name + "</td><td>" + a.assignment_name +
          "</td><td>" + formatDate(a.due_date) + "</td><td>" + score + "</td></tr>";
      });
      html += "</tbody></table>";
      content.innerHTML = html;
    })
    .catch(function () {
      document.getElementById("assignments-content").innerHTML =
        '<p class="error-text">Could not load assignments. Make sure the server is running.</p>';
    });
}

// ── MY ATTENDANCE ─────────────────────────────────────────────────────────────

function loadAttendance() {
  if (!studentId) {
    document.getElementById("attendance-content").innerHTML =
      '<p class="no-classes">No student ID linked to this account. Please contact the school office.</p>';
    return;
  }

  fetch(BACKEND_URL + "/students/" + studentId + "/attendance")
    .then(function (response) { return response.json(); })
    .then(function (data) {
      var content = document.getElementById("attendance-content");

      if (data.length === 0) {
        content.innerHTML = '<p class="no-classes">No attendance records found.</p>';
        return;
      }

      var html = '<table class="classes-table"><thead><tr><th>Class</th><th>Date</th><th>Status</th></tr></thead><tbody>';
      data.forEach(function (a) {
        var statusClass = "status-" + a.status.toLowerCase();
        html += "<tr><td>" + a.class_name + "</td><td>" + formatDate(a.date) +
          "</td><td><span class='status-badge " + statusClass + "'>" + a.status + "</span></td></tr>";
      });
      html += "</tbody></table>";
      content.innerHTML = html;
    })
    .catch(function () {
      document.getElementById("attendance-content").innerHTML =
        '<p class="error-text">Could not load attendance. Make sure the server is running.</p>';
    });
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return "—";
  var d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function logout() {
  localStorage.removeItem("era_user");
  window.location.href = "index.html";
}
