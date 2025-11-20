const express = require('express');
const {
  register,
  login,
  updateUsername,
  updatePassword,
  me,
  requestResetPassword,
  resetPassword,
} = require('../controllers/userController');
const auth = require('../middleware/auth');
const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', requestResetPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.get('/me', auth, me);
router.put('/update-username', auth, updateUsername);
router.put('/update-password', auth, updatePassword);


const { User } = require('../models');

router.get('/debug/admin', async (req, res) => {
  try {
    const admin = await User.findOne({ where: { email: 'meadmin@gmail.com' } });
    if (!admin) return res.status(404).json({ msg: 'Admin not found' });

    res.json({
      username: admin.username,
      email: admin.email,
      role: admin.role,
      password: admin.password, // ✅ Should be a long hashed string
    });
  } catch (err) {
    console.error('Debug error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
