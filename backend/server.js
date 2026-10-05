const express = require('express');
const db = require('./db');
const cors = require('cors');
 
const app = express();
const PORT = 3000;
 
app.use(cors());
app.use(express.json());
 
// Root route — confirms the server is running
app.get('/', (req, res) => {
  res.send('Backend is running with MySQL');
});
 
// GET /students — returns all students from MySQL
app.get('/students', (req, res) => {
  const sql = 'SELECT * FROM students';
  db.query(sql, (error, results) => {
    if (error) {
      console.error('Error getting students:', error);
      return res.status(500).json({ error: 'Failed to get students' });
    }
    res.json(results);
  });
});

// POST /students — receives new student data and inserts into MySQL
app.post('/students', (req, res) => {
  const { first_name, last_name, grade_level } = req.body;
 
  // Validation — reject if any field is missing
  if (!first_name || !last_name || !grade_level) {
    return res.status(400).json({
      error: 'first_name, last_name, and grade_level are required'
    });
  }
 
  const sql = 'INSERT INTO students (first_name, last_name, grade_level) VALUES (?, ?, ?)';
 
  db.query(sql, [first_name, last_name, grade_level], (error, results) => {
    if (error) {
      console.error('Error adding student:', error);
      return res.status(500).json({ error: 'Failed to add student' });
    }
 
    res.status(201).json({
      message: 'Student added successfully',
      studentId: results.insertId
    });
  });
});

// POST /users — creates a new user account
app.post('/users', (req, res) => {
  const { first_name, last_name, email, password } = req.body;
 
  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: 'first_name, last_name, email, and password are required' });
  }
 
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }
 
  const specialChar = /[!@#$%]/;
  if (!specialChar.test(password)) {
    return res.status(400).json({ error: 'Password must include at least one special character: ! @ # $ %' });
  }
 
  // Auto-link to students table by matching first + last name
  const findStudent = 'SELECT id FROM students WHERE first_name = ? AND last_name = ?';
  db.query(findStudent, [first_name, last_name], (err, students) => {
    if (err) return res.status(500).json({ error: 'Failed to create user' });
 
    const student_id = students.length > 0 ? students[0].id : null;
 
    const sql = 'INSERT INTO users (first_name, last_name, email, password, student_id) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [first_name, last_name, email, password, student_id], (error, results) => {
      if (error) {
        // Same email used twice — the UNIQUE rule on the email column blocked it
        if (error.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ error: 'That email is already registered' });
        }
        console.error('Error creating user:', error);
        return res.status(500).json({ error: 'Failed to create user' });
      }
 
      res.status(201).json({
        message: 'User created successfully',
        userId: results.insertId,
        student_id: student_id
      });
    });
  });
});
 
// GET /users — returns all users WITHOUT passwords
app.get('/users', (req, res) => {
  const sql = 'SELECT id, first_name, last_name, email FROM users';
  db.query(sql, (error, results) => {
    if (error) return res.status(500).json({ error: 'Failed to get users' });
    res.json(results);
  });
});

// POST /login — checks email and password against the users table
app.post('/login', (req, res) => {
  const { email, password } = req.body;
 
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
 
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }
 
  const specialChar = /[!@#$%]/;
  if (!specialChar.test(password)) {
    return res.status(400).json({ error: 'Password must include at least one special character: ! @ # $ %' });
  }
 
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (error, results) => {
    if (error) {
      console.error('Login query error:', error);
      return res.status(500).json({ error: 'Something went wrong' });
    }
 
    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
 
    const user = results[0];
 
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
 
    // Login successful — return the name and student_id for the frontend
    res.status(200).json({
      message: 'Login successful',
      first_name: user.first_name,
      last_name: user.last_name,
      student_id: user.student_id
    });
  });
});

// GET /students/:id/assignments — returns one student's assignments and scores
app.get('/students/:id/assignments', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT
      assignments.assignment_name,
      assignments.due_date,
      assignments.max_points,
      student_assignments.score,
      student_assignments.submitted_date,
      classes.class_name
    FROM assignments
    JOIN classes ON assignments.class_id = classes.id
    LEFT JOIN student_assignments
      ON student_assignments.assignment_id = assignments.id
      AND student_assignments.student_id = ?
    WHERE assignments.class_id IN (
      SELECT class_id FROM enrollments WHERE student_id = ?
    )
  `;
  db.query(sql, [id, id], (error, results) => {
    if (error) {
      console.error('Error getting assignments:', error);
      return res.status(500).json({ error: 'Failed to get assignments' });
    }
    res.json(results);
  });
});
 
// GET /classes — returns all classes from MySQL
app.get('/classes', (req, res) => {
  const sql = 'SELECT * FROM classes';
  db.query(sql, (error, results) => {
    if (error) {
      console.error('Error getting classes:', error);
      return res.status(500).json({ error: 'Failed to get classes' });
    }
    res.json(results);
  });
});
 
// GET /enrollments — returns joined data (student name + class name)
app.get('/enrollments', (req, res) => {
  const sql = `
    SELECT
      students.first_name,
      students.last_name,
      classes.class_name,
      classes.teacher_name
    FROM enrollments
    JOIN students ON enrollments.student_id = students.id
    JOIN classes ON enrollments.class_id = classes.id
  `;
  db.query(sql, (error, results) => {
    if (error) {
      console.error('Error getting enrollments:', error);
      return res.status(500).json({ error: 'Failed to get enrollments' });
    }
    res.json(results);
  });
});

// GET /students/:id — returns one student by id
app.get('/students/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM students WHERE id = ?';
  db.query(sql, [id], (error, results) => {
    if (error) {
      console.error('Error getting student:', error);
      return res.status(500).json({ error: 'Failed to get student' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(results[0]);
  });
});

// GET /students/:id/grades — returns grades for one student
app.get('/students/:id/grades', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT classes.class_name, grades.grade_value
    FROM grades
    JOIN classes ON grades.class_id = classes.id
    WHERE grades.student_id = ?
  `;
  db.query(sql, [id], (error, results) => {
    if (error) {
      console.error('Error getting grades:', error);
      return res.status(500).json({ error: 'Failed to get grades' });
    }
    res.json(results);
  });
});

// GET /students/:id/attendance — returns attendance for one student
app.get('/students/:id/attendance', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT classes.class_name, attendance.date, attendance.status
    FROM attendance
    JOIN classes ON attendance.class_id = classes.id
    WHERE attendance.student_id = ?
    ORDER BY attendance.date DESC
  `;
  db.query(sql, [id], (error, results) => {
    if (error) {
      console.error('Error getting attendance:', error);
      return res.status(500).json({ error: 'Failed to get attendance' });
    }
    res.json(results);
  });
});
 
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});