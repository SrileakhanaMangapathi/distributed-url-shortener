const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema(
  {
    // The original long URL user wants to shorten
    originalUrl: {
      type: String,
      required: [true, 'Original URL is required'],
      trim: true,
    },

    // The generated short code e.g. "abc123"
    shortCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Optional: user who created this link (null for anonymous)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Track how many times this link was clicked
    clicks: {
      type: Number,
      default: 0,
    },

    // Optional: custom alias e.g. "my-link" instead of "abc123"
    customAlias: {
      type: String,
      default: null,
      trim: true,
    },

    // Optional: when this link expires (null = never expires)
    expiresAt: {
      type: Date,
      default: null,
    },

    // Is this link still active?
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for fast shortCode lookups (most frequent query)
urlSchema.index({ shortCode: 1 });

// Index for fetching all URLs by a user
urlSchema.index({ createdBy: 1 });

// Auto-delete expired documents (MongoDB TTL index)
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

module.exports = mongoose.model('Url', urlSchema);