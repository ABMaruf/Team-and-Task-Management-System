import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import pool from '../config/db.js';
import { isAllowedEmailDomain } from '../utils/emailValidation.js';

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    if (!isAllowedEmailDomain(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please use a Gmail, Hotmail, Outlook, or Yahoo address'
      });
    }

    // Check if user exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, normalizedEmail, hashedPassword, role || 'member']
    );

    // Get created user
    const [users] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: users[0]
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    // Check if user exists
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Remove password from response
    delete user.password;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, name, email, role, profile_picture, current_streak, longest_streak, productivity_score, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Login or register with Google
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req, res) => {
  try {
    if (!googleClient) {
      return res.status(500).json({
        success: false,
        message: 'Google auth is not configured'
      });
    }

    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const email = payload?.email?.toLowerCase().trim();
    const name = payload?.name || payload?.given_name || 'TaskFlow User';

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Unable to read Google account email'
      });
    }

    if (!isAllowedEmailDomain(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please use a Gmail, Hotmail, Outlook, or Yahoo address'
      });
    }

    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    let user = existingUsers[0];
    if (!user) {
      const randomPassword = crypto.randomBytes(24).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      const [result] = await pool.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, 'member']
      );

      const [createdUsers] = await pool.execute(
        'SELECT * FROM users WHERE id = ?',
        [result.insertId]
      );
      user = createdUsers[0];
    }

    const token = generateToken(user.id);
    delete user.password;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Error authenticating with Google'
    });
  }
};

const getGithubConfig = () => ({
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackUrl: process.env.GITHUB_CALLBACK_URL
});

// @desc    Redirect to GitHub OAuth
// @route   GET /api/auth/github
// @access  Public
export const githubAuth = (req, res) => {
  const { clientId, callbackUrl } = getGithubConfig();

  if (!clientId || !callbackUrl) {
    return res.status(500).json({
      success: false,
      message: 'GitHub auth is not configured'
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: 'user:email'
  });

  return res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
};

// @desc    Exchange GitHub code for session
// @route   POST /api/auth/github/exchange
// @access  Public
export const githubExchange = async (req, res) => {
  try {
    const { code } = req.body;
    const { clientId, clientSecret, callbackUrl } = getGithubConfig();

    if (!clientId || !clientSecret || !callbackUrl) {
      return res.status(500).json({
        success: false,
        message: 'GitHub auth is not configured'
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'GitHub code is required'
      });
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      return res.status(401).json({
        success: false,
        message: tokenData.error_description || 'Failed to authenticate with GitHub'
      });
    }

    const accessToken = tokenData.access_token;
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'TaskFlow'
      }
    });

    const githubUser = await userResponse.json();
    if (!userResponse.ok) {
      return res.status(401).json({
        success: false,
        message: 'Unable to fetch GitHub user profile'
      });
    }

    let email = githubUser.email?.toLowerCase().trim();
    if (!email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'TaskFlow'
        }
      });

      const emails = await emailResponse.json();
      if (Array.isArray(emails)) {
        const primary = emails.find((entry) => entry.primary && entry.verified);
        const verified = emails.find((entry) => entry.verified);
        email = primary?.email?.toLowerCase().trim() || verified?.email?.toLowerCase().trim();
      }
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'No verified email found in GitHub account'
      });
    }

    if (!isAllowedEmailDomain(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please use a Gmail, Hotmail, Outlook, or Yahoo address'
      });
    }

    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    let user = existingUsers[0];
    if (!user) {
      const randomPassword = crypto.randomBytes(24).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      const [result] = await pool.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [githubUser.name || githubUser.login || 'GitHub User', email, hashedPassword, 'member']
      );

      const [createdUsers] = await pool.execute(
        'SELECT * FROM users WHERE id = ?',
        [result.insertId]
      );
      user = createdUsers[0];
    }

    const token = generateToken(user.id);
    delete user.password;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    console.error('GitHub auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Error authenticating with GitHub'
    });
  }
};

// @desc    GitHub OAuth callback handler (redirects to frontend)
// @route   GET /api/auth/github/callback
// @access  Public
export const githubCallback = (req, res) => {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const target = new URL(`${baseUrl}/oauth/github`);
  if (req.query.code) {
    target.searchParams.set('code', req.query.code);
  }
  if (req.query.error) {
    target.searchParams.set('error', req.query.error);
  }
  if (req.query.error_description) {
    target.searchParams.set('error_description', req.query.error_description);
  }
  return res.redirect(target.toString());
};
