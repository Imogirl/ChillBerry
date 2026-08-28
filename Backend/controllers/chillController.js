import ChillProfile from "../models/ChillProfile.js";
import User from "../models/User.js";

const moodMap = {
  happy: {
    label: "Happy",
    suggestion: "Save this spark with a tiny creative activity.",
    plant: "Sun Sprout",
    color: "#ffc84d",
  },
  calm: {
    label: "Calm",
    suggestion: "Keep the softness going with three quiet breaths.",
    plant: "Mint Leaf",
    color: "#8be8b3",
  },
  tired: {
    label: "Tired",
    suggestion: "Try a two-minute stretch and drink some water.",
    plant: "Moon Bud",
    color: "#a9c7ff",
  },
  stressed: {
    label: "Stressed",
    suggestion: "Write one worry into the stress bubble and pop it.",
    plant: "Cloud Fern",
    color: "#d8c8ff",
  },
  sad: {
    label: "Sad",
    suggestion: "Pick one small comfort task and be gentle with yourself.",
    plant: "Peach Bloom",
    color: "#ffc7a8",
  },
};

const unlockRules = [
  { points: 25, name: "Lavender Theme" },
  { points: 60, name: "Cozy Corner Rain" },
  { points: 100, name: "Golden Berry Pot" },
];

const dailyJoyMap = new Map([
  ["Drink a glass of water", { category: "Reset", points: 5 }],
  ["Open a window for fresh air", { category: "Calm", points: 5 }],
  ["Send one kind message", { category: "Connect", points: 7 }],
  ["Tidy one tiny corner", { category: "Focus", points: 6 }],
  ["Stretch for two minutes", { category: "Body", points: 6 }],
]);

const todayKey = () => new Date().toISOString().slice(0, 10);

const yesterdayKey = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
};

const getProfileForUser = async (userId) => {
  return ChillProfile.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId } },
    { new: true, upsert: true }
  );
};

const awardPoints = async (userId, points, update = {}) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { chillPoints: points }, ...update },
    { new: true }
  ).select("-password");

  return user;
};

const applyUnlocks = (profile, points) => {
  const unlocked = new Set(profile.unlocks);
  unlockRules.forEach((rule) => {
    if (points >= rule.points) {
      unlocked.add(rule.name);
    }
  });
  profile.unlocks = [...unlocked];
};

export const getChillProfile = async (req, res) => {
  const profile = await getProfileForUser(req.user._id);
  res.json({ user: req.user, profile });
};

export const checkInMood = async (req, res) => {
  const mood = moodMap[req.body.mood];

  if (!mood) {
    return res.status(400).json({ message: "Please choose a valid mood" });
  }

  const profile = await getProfileForUser(req.user._id);
  const checkedToday = profile.lastCheckInDate === todayKey();
  const nextStreak = checkedToday
    ? req.user.streak
    : profile.lastCheckInDate === yesterdayKey()
      ? req.user.streak + 1
      : 1;

  profile.moodHistory.unshift({
    mood: req.body.mood,
    label: mood.label,
    suggestion: mood.suggestion,
    plant: mood.plant,
    color: mood.color,
  });
  profile.moodHistory = profile.moodHistory.slice(0, 30);
  profile.lastCheckInDate = todayKey();

  const user = await awardPoints(
    req.user._id,
    checkedToday ? 3 : 8,
    { $set: { streak: nextStreak } }
  );
  applyUnlocks(profile, user.chillPoints);
  await profile.save();

  res.status(201).json({ user, profile, entry: profile.moodHistory[0] });
};

export const completeJoy = async (req, res) => {
  const title = req.body.title?.trim();
  const joy = dailyJoyMap.get(title);

  if (!joy) {
    return res.status(400).json({ message: "Please choose a valid daily joy" });
  }

  const profile = await getProfileForUser(req.user._id);
  const completedToday = profile.completedJoys.some(
    (entry) =>
      entry.title === title &&
      entry.createdAt?.toISOString().slice(0, 10) === todayKey()
  );

  if (completedToday) {
    return res.status(409).json({ message: "This daily joy is already complete" });
  }

  profile.completedJoys.unshift({
    title,
    category: joy.category,
    points: joy.points,
  });
  profile.completedJoys = profile.completedJoys.slice(0, 40);

  const user = await awardPoints(req.user._id, joy.points);
  applyUnlocks(profile, user.chillPoints);
  await profile.save();

  res.status(201).json({ user, profile });
};

export const popStress = async (req, res) => {
  const text = req.body.text?.trim();

  if (!text) {
    return res.status(400).json({ message: "Stress bubble text is required" });
  }

  const profile = await getProfileForUser(req.user._id);
  profile.stressPops.unshift({ text: text.slice(0, 160) });
  profile.stressPops = profile.stressPops.slice(0, 20);

  const user = await awardPoints(req.user._id, 2);
  applyUnlocks(profile, user.chillPoints);
  await profile.save();

  res.status(201).json({ user, profile });
};

export const completeCozySession = async (req, res) => {
  const profile = await getProfileForUser(req.user._id);
  const minutes = Math.min(Math.max(Number(req.body.minutes) || 3, 1), 30);
  profile.cozySessions.unshift({
    scene: req.body.scene || "Soft Rain",
    minutes,
  });
  profile.cozySessions = profile.cozySessions.slice(0, 20);

  const user = await awardPoints(req.user._id, Math.ceil(minutes / 2));
  applyUnlocks(profile, user.chillPoints);
  await profile.save();

  res.status(201).json({ user, profile });
};

export const updatePet = async (req, res) => {
  const action = req.body.action;
  const profile = await getProfileForUser(req.user._id);

  if (action === "feed") {
    profile.pet.energy = Math.min(100, profile.pet.energy + 15);
    profile.pet.lastFed = new Date();
  } else if (action === "play") {
    profile.pet.happiness = Math.min(100, profile.pet.happiness + 15);
    profile.pet.energy = Math.max(0, profile.pet.energy - 8);
    profile.pet.lastPlayed = new Date();
  } else if (action === "pat") {
    profile.pet.happiness = Math.min(100, profile.pet.happiness + 6);
  } else {
    return res.status(400).json({ message: "Please choose a valid pet action" });
  }

  const user = await awardPoints(req.user._id, 3);
  applyUnlocks(profile, user.chillPoints);
  await profile.save();

  res.json({ user, profile });
};

export const completeRescue = async (req, res) => {
  const profile = await getProfileForUser(req.user._id);
  profile.rescueSessions.unshift({});
  profile.rescueSessions = profile.rescueSessions.slice(0, 20);

  const user = await awardPoints(req.user._id, 12);
  applyUnlocks(profile, user.chillPoints);
  await profile.save();

  res.status(201).json({ user, profile });
};
