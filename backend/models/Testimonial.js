const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional for guest testimonials
  },
  userName: {
    type: String,
    required: true,
  },
  userRole: {
    type: String, // e.g., "Verified Buyer", "Tech Enthusiast"
    default: 'Customer',
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  message: {
    type: String,
    required: true,
  },
  avatar: {
    type: String, // URL to avatar
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Testimonial', testimonialSchema);
