const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: { type: String, default: 'User' },
  phone: { type: String },
  gender: { type: String },
  dob: { type: String },
  avatar: { type: String },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  address: [mongoose.Schema.Types.Mixed],
  notificationPreferences: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
    orderUpdates: { type: Boolean, default: true },
    offers: { type: Boolean, default: true }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  otp: { type: String },
  otpExpires: { type: Date },
  updatedAt: {

    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('User', userSchema);
