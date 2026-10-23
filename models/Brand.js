const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    number: {
      type: String,
      default: '01'
    },
    tagline: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      required: true
    },
    foundedYear: {
      type: Number,
      default: 1905
    },
    country: {
      type: String,
      default: 'Switzerland'
    },
    headquarters: {
      type: String,
      default: 'Geneva, Switzerland'
    },
    founder: {
      type: String,
      default: ''
    },
    presence: {
      type: String,
      default: 'Worldwide'
    },
    logo: {
      type: String,
      default: ''
    },
    bannerImage: {
      type: String,
      default: ''
    },
    stats: [
      {
        value: String,
        label: String,
        subtext: String
      }
    ],
    heritageTitle: {
      type: String,
      default: 'Built on Vision. Driven by Excellence.'
    },
    heritageStory: {
      type: String,
      default: ''
    },
    promises: [
      {
        title: String,
        description: String,
        icon: String
      }
    ],
    iconicCollections: [
      {
        name: String,
        description: String
      }
    ],
    isPrestigious: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Brand', brandSchema);
