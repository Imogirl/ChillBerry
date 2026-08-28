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

const chillProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    moodHistory: [moodEntrySchema],
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
  },
  { timestamps: true }
);

const ChillProfile = mongoose.model("ChillProfile", chillProfileSchema);

export default ChillProfile;
