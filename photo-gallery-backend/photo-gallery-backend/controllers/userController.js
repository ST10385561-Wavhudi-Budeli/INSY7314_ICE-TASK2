const User = require('../models/User');

// @route   GET /api/users/me
// @desc    Return the authenticated user's profile
// @access  Private
const getMe = async (req, res, next) => {
  try {
    // req.user is already attached (and password-free) by the `protect` middleware
    res.status(200).json(req.user);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/users/me
// @desc    Update the authenticated user's username and/or email
// @access  Private
const updateMe = async (req, res, next) => {
  try {
    const { username, email } = req.body;

    if (!username && !email) {
      return res.status(400).json({ message: 'Provide at least a username or email to update' });
    }

    if (email) {
      const normalizedEmail = email.toLowerCase();
      const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: req.user._id } });
      if (existing) {
        return res.status(409).json({ message: 'That email is already in use by another account' });
      }
      req.user.email = normalizedEmail;
    }

    if (username) {
      req.user.username = username;
    }

    await req.user.save();

    res.status(200).json(req.user);
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/users
// @desc    Return all registered users
// @access  Private/Admin
const getAllUsers = async (_req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/users/:userId
// @desc    Delete a user account
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Administrators cannot delete their own account via this route' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/users/:userId/promote
// @desc    Promote a user from 'user' to 'admin'
// @access  Private/Admin
const promoteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = 'admin';
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/users/:userId/demote
// @desc    Demote a user from 'admin' to 'user'
// @access  Private/Admin
const demoteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Administrators cannot demote themselves' });
    }

    user.role = 'user';
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe,
  updateMe,
  getAllUsers,
  deleteUser,
  promoteUser,
  demoteUser,
};
