const mongoose = require('mongoose');

// New Wishlist Schema: One document per item per user
const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  price: Number,
  image: String,
  brand: String,
  category: String,
  notifyOnPriceDrop: { type: Boolean, default: false },
  addedAt: { type: Date, default: Date.now }
});

// Create a compound index to avoid a user adding the same product twice
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
