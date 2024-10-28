const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const env = require('dotenv').config();
const {passwordEmail} = require('./passwordEmail');


const jwtSecret = process.env.JWT_SECRET;
const usersFile = path.join(__dirname, '../api/users.json');
const tokensFilePath = path.join(__dirname, '../api/tokens.json');

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) return res.status(401).send('Access denied');

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).send('Invalid token');

      req.user = user; 
      next();
  });
}

async function readUsers() {
    try {
      const data = await fs.readFile(usersFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading users.json:', error);
      return [];
    }
  }
  
  async function writeUsers(users) {
    try {
      await fs.writeFile(usersFile, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error('Error writing to users.json:', error);
    }
  }


async function register(req, res) {
    const { email, password } = req.body;
    const users = await readUsers();
  
    if (users.find(user => user.email === email)) {
      return res.status(409).send('User already exists'); /// 409 = Conflict
    }
  
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ email, password: hashedPassword });
    await writeUsers(users);
  
    res.status(201).send('User registered successfully');
  }


async function login(req, res) {
    const { email, password } = req.body;
    const users = await readUsers();
    const user = users.find(u => u.email === email);
  
    if (!user) return res.status(404).send('User not found');
  
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).send('Invalid credentials');
  
    const token = jwt.sign({ email: user.email }, jwtSecret, { expiresIn: '1h' });
    res.json({ token });
  }

async function readTokens() {
  try {
      const data = await fs.readFile(tokensFilePath, 'utf-8');
      return JSON.parse(data);
  } catch (error) {
      return [];
  }
}

async function saveTokens(tokens) {
    await fs.writeFile(tokensFilePath, JSON.stringify(tokens, null, 2));
}


async function resetPassword(req, res) {
  const { email } = req.params;
    const users = await readUsers();
    const user = users.find(u => u.email === email);

    console.log('email:', email);
  
    if (!user) return res.status(404).send('User not found');

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day

    const tokens = await readTokens();

    tokens.push({ email, token, expiration: expirationDate });

    await saveTokens(tokens);

    passwordEmail(email, token);
  
    res.status(200).send('Password reset successfully');
  }
  



  
  module.exports = { register, login, authenticateToken, resetPassword };