const mongoose = require('mongoose');

/**
 * Click model — stores data for every redirect event
 * 
 * This is what powers the analytics dashboard.
 * Every time someone clicks a short link, we create one Click document.
 * 
 * In Java terms: like a JPA Entity with @OneToMany relationship to Url
 */
const clickSchema = new mongoose.Schema(
  {
    // Which short URL was clicked
    shortCode: {
      type: String,
      required: true,
      index: true, // Fast lookup by shortCode
    },

    // Reference to the Url document
    url: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Url',
      required: true,
    },

    // Device info
    device: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet', 'unknown'],
      default: 'unknown',
    },

    // Browser info
    browser: {
      type: String,
      default: 'unknown',
    },

    // Operating system
    os: {
      type: String,
      default: 'unknown',
    },

    // Where the click came from (referrer URL)
    referrer: {
      type: String,
      default: 'direct',
    },

    // Country code e.g. "US", "IN", "UK"
    country: {
      type: String,
      default: 'unknown',
    },

    // IP address (hashed for privacy)
    ipHash: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt = click timestamp
  }
);

// Compound index for fast analytics queries
// "Give me all clicks for shortCode X sorted by time"
clickSchema.index({ shortCode: 1, createdAt: -1 });

module.exports = mongoose.model('Click', clickSchema);