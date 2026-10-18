import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

const generateToken = (userId, role, email) => {
  return jwt.sign({ id: userId, role, email }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * POST /api/auth/register
 * Customer registration with email, password, optional phone number & name
 */
export const register = async (req, res) => {
  try {
    const { email, password, phone, name } = req.body;
    const role = 'CUSTOMER'; // Force 'CUSTOMER' role on registration

    if (!email || !password || !name || !phone) {
      return res.status(400).json({ error: 'Full name, email address, mobile number, and password are all required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      return res.status(400).json({ error: 'Please provide your full name.' });
    }

    if (!trimmedPhone) {
      return res.status(400).json({ error: 'Please provide a valid Ghana mobile number.' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const existingPhone = await prisma.user.findUnique({
      where: { phone: trimmedPhone },
    });
    if (existingPhone) {
      return res.status(400).json({ error: 'An account with this mobile number already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email: trimmedEmail,
        password: hashedPassword,
        phone: trimmedPhone,
        name: trimmedName,
        role: role,
        status: 'ACTIVE',
        auth_provider: 'LOCAL',
      },
    });

    const token = generateToken(user.id, user.role, user.email);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        status: user.status,
        auth_provider: user.auth_provider,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/auth/login
 * Allows customer or admin to sign in using either email or phone number
 */
export const login = async (req, res) => {
  try {
    const { email, identifier, password } = req.body;
    const loginIdentifier = (identifier || email || '').trim();

    if (!loginIdentifier || !password) {
      return res.status(400).json({ error: 'Please provide email or phone number and password' });
    }

    // Search user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginIdentifier.toLowerCase() },
          { phone: loginIdentifier },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.password) {
      return res.status(400).json({
        error: `This account was created with ${user.auth_provider || 'Social Sign-In'}. Please use the social login button below.`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Your account is suspended. Please contact support.' });
    }

    const token = generateToken(user.id, user.role, user.email);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        status: user.status,
        auth_provider: user.auth_provider,
        avatar_url: user.avatar_url,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/auth/social-login
 * Signs in or creates a customer using Social Sign-In (Google, Apple)
 */
export const socialLogin = async (req, res) => {
  try {
    let { provider, email, name, avatarUrl, credential } = req.body;

    // Decode Google JWT ID token if provided directly from Google Identity Services
    if (credential && (!email || !provider)) {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload.email) {
            email = payload.email;
            name = name || payload.name;
            avatarUrl = avatarUrl || payload.picture;
            provider = 'GOOGLE';
          }
        }
      } catch (tokenErr) {
        console.warn('Could not parse Google ID token:', tokenErr);
      }
    }

    if (!email || !provider) {
      return res.status(400).json({ error: 'Email and provider are required for social login' });
    }

    const normalizedProvider = provider.toUpperCase();
    const trimmedEmail = email.trim().toLowerCase();

    let user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (user) {
      if (user.status === 'SUSPENDED') {
        return res.status(403).json({ error: 'Your account is suspended. Please contact support.' });
      }

      // Update name/avatar if missing
      if ((!user.name && name) || (!user.avatar_url && avatarUrl)) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: user.name || (name ? name.trim() : null),
            avatar_url: user.avatar_url || avatarUrl || null,
          },
        });
      }
    } else {
      // Create new customer account
      user = await prisma.user.create({
        data: {
          email: trimmedEmail,
          name: name ? name.trim() : null,
          avatar_url: avatarUrl || null,
          role: 'CUSTOMER',
          status: 'ACTIVE',
          auth_provider: normalizedProvider,
        },
      });
    }

    const token = generateToken(user.id, user.role, user.email);

    return res.json({
      message: `Signed in successfully with ${normalizedProvider}`,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        status: user.status,
        auth_provider: user.auth_provider,
        avatar_url: user.avatar_url,
      },
      isProfileIncomplete: !user.phone || !user.name,
      token,
    });
  } catch (error) {
    console.error('Social login error:', error);
    return res.status(500).json({ error: 'Failed to authenticate with social provider' });
  }
};

/**
 * PATCH /api/auth/profile
 * Allows logged in user to update their phone number and name
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone, name } = req.body;

    const updateData = {};

    if (phone !== undefined) {
      const trimmedPhone = phone ? phone.trim() : null;
      if (trimmedPhone) {
        const existingPhone = await prisma.user.findFirst({
          where: {
            phone: trimmedPhone,
            NOT: { id: userId },
          },
        });
        if (existingPhone) {
          return res.status(400).json({ error: 'This phone number is already registered to another account' });
        }
      }
      updateData.phone = trimmedPhone;
    }

    if (name !== undefined) {
      updateData.name = name ? name.trim() : null;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        status: true,
        auth_provider: true,
        avatar_url: true,
      },
    });

    return res.json({ message: 'Profile updated successfully', user: updated });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/auth/config
 * Provides public client authentication configuration (such as Google OAuth Client ID)
 */
export const getAuthConfig = async (req, res) => {
  return res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '',
  });
};

