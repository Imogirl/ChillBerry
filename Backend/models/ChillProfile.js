import mongoose from "mongoose";

const moodEntrySchema = new mongoose.Schema(
  {
    mood: String,
    label: String,
    suggestion: String,
    plant: String,
    color: String,
  },
  { timestamps: true }
);

const joySchema = new mongoose.Schema(
  {
    title: String,
    category: String,
    points: {
      type: Number,
      default: 5,
    },
  },
  { timestamps: true }
);

const forestDaySchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },
    mood: String,
    label: String,
    plant: String,
    color: String,
    wellbeingScore: Number,
    checkIns: {
      type: Number,
      default: 1,
    },
    plantedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const chillProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    moodHistory: [moodEntrySchema],
    forestDays: [forestDaySchema],
    completedJoys: [joySchema],
    stressPops: [
      {
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    cozySessions: [
      {
        scene: String,
        minutes: Number,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    rescueSessions: [
      {
        completedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    pet: {
      name: {
        type: String,
        default: "Berry",
      },
      energy: {
        type: Number,
        default: 70,
      },
      happiness: {
        type: Number,
        default: 75,
      },
      lastFed: Date,
      lastPlayed: Date,
    },
    unlocks: {
      type: [String],
      default: ["Starter Garden"],
    },
    lastCheckInDate: String,
    lifetimeStats: {
      checkIns: { type: Number, default: 0 },
      joysCompleted: { type: Number, default: 0 },
      stressReleases: { type: Number, default: 0 },
      cozySessions: { type: Number, default: 0 },
      cozyMinutes: { type: Number, default: 0 },
      rescueSessions: { type: Number, default: 0 },
      petCareActions: { type: Number, default: 0 },
    },
    statsInitialized: {
      type: Boolean,
      default: false,
      select: false,
    },
    forestVersion: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  { timestamps: true }
);

const ChillProfile = mongoose.model("ChillProfile", chillProfileSchema);

export default ChillProfile;
