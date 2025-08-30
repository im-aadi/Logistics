const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Data file path
const usersFile = path.join(__dirname, '../data/users.json');

// Ensure data directory exists
const ensureDataDir = async () => {
  const dataDir = path.dirname(usersFile);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
};

// Load users from file
const loadUsers = async () => {
  try {
    const data = await fs.readFile(usersFile, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

// Save users to file
const saveUsers = async (users) => {
  await ensureDataDir();
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2));
};

// Initialize default admin user
const initializeDefaultUser = async () => {
  const users = await loadUsers();
  if (users.length === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const defaultUser = {
      id: uuidv4(),
      username: 'admin',
      email: 'admin@logistics.com',
      password: hashedPassword,
      role: 'admin',
      name: 'System Administrator',
      createdAt: new Date().toISOString()
    };
    users.push(defaultUser);
    await saveUsers(users);
    console.log('Default admin user created: admin / admin123');
  }
};

// Initialize on startup
initializeDefaultUser();

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const users = await loadUsers();
    const user = users.find(u => u.username === username || u.email === username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        email: user.email 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name, role = 'user' } = req.body;

    if (!username || !email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const users = await loadUsers();
    
    // Check if user already exists
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      role,
      name,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await saveUsers(users);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const users = await loadUsers();
    const user = users.find(u => u.id === decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
