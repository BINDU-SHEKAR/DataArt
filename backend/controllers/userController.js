const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');
const nodemailer = require('nodemailer');
const generateUniqueId = require('generate-unique-id');
const validations = require('../validators/validations');
require('dotenv').config();

// ---------------------- REGISTER ----------------------
const register = async (req, res) => {
  console.log('Incoming body:', req.body); // 🔍 Shows what frontend is sending

  const zodResult = validations.registrationSchema.safeParse(req.body);
  console.log('Validation result:', zodResult); // 🔍 Shows if validation passed or failed

  if (!zodResult.success) {
    const errors = zodResult.error.errors.map((err) => err.message).join(', ');
    return res.status(400).json({ msg: errors });
  }
  const { username, email, password, role } = zodResult.data;

  try {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ msg: 'Email already exists' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ msg: 'Username already exists' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role // ✅ Use role from frontend
    });

    const payload = { user: {
    id: user.id,
    role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, role: user.role });
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ---------------------- LOGIN ----------------------
const login = async (req, res) => {
  const zodResult = validations.loginSchema.safeParse(req.body);
  if (!zodResult.success) {
    const errors = zodResult.error.errors.map((err) => err.message).join(', ');
    return res.status(400).json({ msg: errors });
  }

const { email, username, password } = zodResult.data;
const identifier = email || username;

  try {
    const user = await User.findOne({
  where: {
    [Op.or]: [{ email: identifier }, { username: identifier }]
  }
});


    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const payload = { user: {
    id: user.id,
    role: user.role} };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, role: user.role });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ---------------------- PROFILE ----------------------
const me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'role'],
    });
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ---------------------- UPDATE USERNAME ----------------------
const updateUsername = async (req, res) => {
  const zodResult = validations.updateUsernameSchema.safeParse(req.body);
  if (!zodResult.success) {
    const errors = zodResult.error.errors.map((err) => err.message).join(', ');
    return res.status(400).json({ msg: errors });
  }

  const { username } = zodResult.data;
  try {
    const userExists = await User.findOne({ where: { username } });
    if (userExists) return res.status(400).json({ msg: 'Username already exists' });

    const user = await User.findByPk(req.user.id);
    user.username = username;
    await user.save();
    res.json({ msg: 'Username updated' });
    await fetchUser(); 

  } catch (err) {
    console.error('Update username error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ---------------------- UPDATE PASSWORD ----------------------
const updatePassword = async (req, res) => {
  const zodResult = validations.updatePasswordSchema.safeParse(req.body);
  if (!zodResult.success) {
    const errors = zodResult.error.errors.map((err) => err.message).join(', ');
    return res.status(400).json({ msg: errors });
  }

  const { oldPassword, password } = zodResult.data;

  try {
    const user = await User.findByPk(req.user.id);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid old password' });

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.json({ msg: 'Password updated' });
  } catch (err) {
    console.error('Update password error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
// ---------------------- PASSWORD RESET ----------------------
const requestResetPassword = async (req, res) => {
  const zodResult = validations.requestPasswordResetSchema.safeParse(req.body);
  if (!zodResult.success) {
    const errors = zodResult.error.errors.map((err) => err.message).join(', ');
    return res.status(400).json({ message: errors });
  }

  const { email } = zodResult.data;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resetToken = generateUniqueId({ length: 20 });
    const resetTokenExpiry = Date.now() + 3600000;

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    await sendRequestResetPasswordEmail(user.email, resetToken);
    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error('Request reset error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: { [Op.gt]: Date.now() },
      },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    await sendResetPasswordEmail(user.email);
    res.json({ message: 'Password has been reset' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------- EMAIL HELPERS ----------------------
const sendRequestResetPasswordEmail = async (email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Your Password',
      html: `
        <p>Dear User,</p>
        <p>You have requested to reset your password.</p>
        <p><a href="${process.env.FRONTEND_URL}/reset-password/${token}">Reset Password</a></p>
        <p>If you did not request this, please ignore this email.</p>
        <p>– The ScoreMax Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Error sending reset email:', err);
  }
};

const sendResetPasswordEmail = async (email) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Confirmation',
      html: `
        <p>Dear User,</p>
        <p>Your password has been successfully reset.</p>
        <p>If this wasn’t you, please contact us immediately.</p>
        <p>– The ScoreMax Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Error sending confirmation email:', err);
  }
};

// ---------------------- EXPORT CONTROLLERS ----------------------
module.exports = {
  register,
  login,
  me,
  updateUsername,
  updatePassword,
  requestResetPassword,
  resetPassword,
};
