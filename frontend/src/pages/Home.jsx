import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BookHeart,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CircleUserRound,
  CloudRain,
  Flame,
  Flower2,
  Heart,
  Home as HomeIcon,
  Leaf,
  LogOut,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  Star,
  Sun,
  TimerReset,
  Wind,
  X,
  Zap,
} from "lucide-react";
import api from "../services/api";
import berryLove from "../assets/berry-love.png";
import berryMoods from "../assets/berry-moods.png";
import berryGarden from "../assets/berry-garden.png";
import berryCozy from "../assets/berry-cozy.png";
import berryStress from "../assets/berry-stress.png";
import berryCards from "../assets/berry-cards.png";
import treeHappy from "../assets/tree-happy.png";
import treeCalm from "../assets/tree-calm.png";
import treeTired from "../assets/tree-tired.png";
import treeStressed from "../assets/tree-stressed.png";
import treeSad from "../assets/tree-sad.png";
import todayMoodStilllife from "../assets/today-mood-stilllife.png";
import moodHappyCharacter from "../assets/mood-happy-character-v2.png";
import moodCalmCharacter from "../assets/mood-calm-character-v2.png";
import moodTiredCharacter from "../assets/mood-tired-character-v2.png";
import moodStressedCharacter from "../assets/mood-stressed-character-v2.png";
import moodLowCharacter from "../assets/mood-low-character-v2.png";

const navItems = [
  { to: "/", label: "Home", Icon: HomeIcon, color: "#ff5a8a", end: true },
  { to: "/today", label: "Today", Icon: Sun, color: "#f6b73c" },
  { to: "/garden", label: "Garden", Icon: Flower2, color: "#5fc483" },
  { to: "/comfort", label: "Comfort", Icon: Heart, color: "#ff7a61" },
  { to: "/cozy", label: "Cozy", Icon: Camera, color: "#7cb7ff" },
  { to: "/rescue", label: "Rescue", Icon: BookHeart, color: "#a878ff" },
  { to: "/berry", label: "Berry", Icon: Leaf, color: "#38c6b1" },
];

const moods = [
  { id: "happy", label: "Happy", tone: "Creative", plant: "Sun Sprout", color: "#f6b73c", suggestion: "Save this spark with a tiny creative activity.", Icon: Sun },
  { id: "calm", label: "Calm", tone: "Soft", plant: "Mint Leaf", color: "#68b889", suggestion: "Keep the softness going with three quiet breaths.", Icon: Wind },
  { id: "tired", label: "Tired", tone: "Restore", plant: "Moon Bud", color: "#739dc8", suggestion: "Try a two-minute stretch and drink some water.", Icon: CloudRain },
  { id: "stressed", label: "Stressed", tone: "Release", plant: "Cloud Fern", color: "#8d78ae", suggestion: "Write one worry into the stress bubble and pop it.", Icon: Zap },
  { id: "sad", label: "Low", tone: "Care", plant: "Peach Bloom", color: "#dc806a", suggestion: "Pick one small comfort task and be gentle with yourself.", Icon: Heart },
];

const dailyJoys = [
  { title: "Drink a glass of water", category: "Reset", points: 5 },
  { title: "Open a window for fresh air", category: "Calm", points: 5 },
  { title: "Send one kind message", category: "Connect", points: 7 },
  { title: "Tidy one tiny corner", category: "Focus", points: 6 },
  { title: "Stretch for two minutes", category: "Body", points: 6 },
];

const compliments = [
  "You are doing enough for this moment.",
  "Your tiny progress still counts.",
  "You bring a good kind of warmth into the room.",
  "Rest is productive when your heart needs room.",
  "You have handled harder days than this one.",
];

const activities = [
  "Make a calm playlist with three songs.",
  "Sketch a berry plant in one minute.",
  "Write down one thing that can wait.",
  "Step outside and name five colors.",
  "Create a cozy drink and sit without scrolling.",
];

const cozyScenes = ["Soft Rain", "Morning Garden", "Lo-fi Room", "Moon Window"];
const unlockRules = [
  { points: 25, name: "Lavender Theme" },
  { points: 60, name: "Cozy Corner Rain" },
  { points: 100, name: "Golden Berry Pot" },
];
const rescueSteps = [
  "Breathe in for four counts, then out for six.",
  "Name one thing you can control in the next ten minutes.",
  "Choose a tiny joy and complete it slowly.",
  "Take one compliment from ChillBerry and let it land.",
];

const starterProgress = {
  points: 0,
  streak: 0,
  lastCheckInDate: "",
  moodHistory: [],
  forestDays: [],
  completedJoys: [],
  stressPops: [],
  cozySessions: [],
  rescueSessions: [],
  unlocks: ["Starter Garden"],
  pet: { name: "Berry", energy: 70, happiness: 75 },
  lifetimeStats: {
    checkIns: 0,
    joysCompleted: 0,
    stressReleases: 0,
    cozySessions: 0,
    cozyMinutes: 0,
    rescueSessions: 0,
    petCareActions: 0,
  },
};

const todayKey = () => new Date().toISOString().slice(0, 10);
const yesterdayKey = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
};
const applyUnlocks = (progress, nextPoints) => ({
  ...progress,
  unlocks: [...new Set([...progress.unlocks, ...unlockRules.filter((rule) => nextPoints >= rule.points).map((rule) => rule.name)])],
});
const loadStored = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};
const mergeProgress = (saved = {}) => ({
  ...starterProgress,
  ...saved,
  moodHistory: saved.moodHistory || [],
  forestDays: saved.forestDays || [],
  completedJoys: saved.completedJoys || [],
  stressPops: saved.stressPops || [],
  cozySessions: saved.cozySessions || [],
  rescueSessions: saved.rescueSessions || [],
  unlocks: saved.unlocks || starterProgress.unlocks,
  pet: { ...starterProgress.pet, ...saved.pet },
  lifetimeStats: { ...starterProgress.lifetimeStats, ...saved.lifetimeStats },
});
const userStorageId = (user) => user?._id || user?.id || user?.email || "guest";
const progressStorageKey = (user) => `chillberry-progress:${userStorageId(user)}`;
const moodScores = { happy: 5, calm: 4, tired: 3, stressed: 2, sad: 1 };
const moodTreeImages = {
  happy: treeHappy,
  calm: treeCalm,
  tired: treeTired,
  stressed: treeStressed,
  sad: treeSad,
};
const moodCardImages = {
  happy: moodHappyCharacter,
  calm: moodCalmCharacter,
  tired: moodTiredCharacter,
  stressed: moodStressedCharacter,
  sad: moodLowCharacter,
};
const buildForestFromHistory = (history = []) => history.map((entry) => {
    const date = entry.createdAt?.slice(0, 10);
    return {
      date,
      mood: entry.mood || entry.id,
      label: entry.label,
      plant: entry.plant,
      color: entry.color,
      wellbeingScore: moodScores[entry.mood || entry.id] || 3,
      checkIns: 1,
      plantedAt: entry.createdAt,
    };
  });
const normalizeProgress = (payload) => {
  if (!payload?.profile) return starterProgress;
  return mergeProgress({
    ...payload.profile,
    points: payload.user?.chillPoints ?? 0,
    streak: payload.user?.streak ?? 0,
  });
};
const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

function Home({ view = "home" }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [user, setUser] = useState(() => loadStored("user", null));
  const guideStorageKey = user
    ? `chillberry-guide-seen:${user._id || user.id || user.email || "member"}`
    : "";
  const userProgressKey = progressStorageKey(user);
  const [progress, setProgress] = useState(() => mergeProgress(loadStored(userProgressKey, starterProgress)));
  const [selectedMood, setSelectedMood] = useState(null);
  const [notice, setNotice] = useState("");
  const [stressText, setStressText] = useState("");
  const [bubblePopped, setBubblePopped] = useState(false);
  const [compliment, setCompliment] = useState(compliments[0]);
  const [activity, setActivity] = useState(activities[0]);
  const [scene, setScene] = useState(cozyScenes[0]);
  const [minutes, setMinutes] = useState(3);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [rescueStep, setRescueStep] = useState(0);
  const [showGuide, setShowGuide] = useState(() => Boolean(
    token && user && guideStorageKey && !localStorage.getItem(guideStorageKey),
  ));
  const [guideStep, setGuideStep] = useState(0);

  useEffect(() => {
    if (!token) return;
    api.get("/chill/profile").then((response) => {
      setUser(response.data.user);
      setProgress(normalizeProgress(response.data));
    }).catch(() => setNotice("Offline mode: your progress is safe on this device."));
  }, [token]);

  useEffect(() => {
    localStorage.setItem(userProgressKey, JSON.stringify(progress));
  }, [progress, userProgressKey]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    if (!showGuide) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (guideStorageKey) localStorage.setItem(guideStorageKey, "true");
        setShowGuide(false);
      }
    };
    document.body.classList.add("guide-is-open");
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("guide-is-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [guideStorageKey, showGuide]);

  useEffect(() => {
    if (!timerRunning || secondsLeft <= 0) return undefined;
    const timerId = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setTimerRunning(false);
          setNotice("Your cozy session is complete. Nice work.");
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [secondsLeft, timerRunning]);

  const latestMood = progress.moodHistory[0];
  const forest = progress.forestDays.length > 0
    ? progress.forestDays
    : buildForestFromHistory(progress.moodHistory);
  const garden = forest;
  const completedToday = useMemo(() => new Set(progress.completedJoys
    .filter((joy) => joy.createdAt?.slice(0, 10) === todayKey())
    .map((joy) => joy.title)), [progress.completedJoys]);
  const nextUnlock = unlockRules.find((rule) => progress.points < rule.points);
  const unlockProgress = nextUnlock ? Math.min(100, Math.round((progress.points / nextUnlock.points) * 100)) : 100;

  const syncServer = async (endpoint, payload, fallbackProgress) => {
    setProgress(fallbackProgress);
    setNotice("Progress saved.");
    if (!token) {
      setNotice("Saved on this device. Sign in to sync everywhere.");
      return;
    }
    try {
      const response = await api.post(endpoint, payload);
      setUser(response.data.user);
      setProgress(normalizeProgress(response.data));
    } catch {
      setNotice("Offline mode: your progress is safe on this device.");
    }
  };

  const handleMood = (mood) => {
    const entry = { ...mood, mood: mood.id, createdAt: new Date().toISOString() };
    const points = progress.lastCheckInDate === todayKey() ? 3 : 8;
    const streak = progress.lastCheckInDate === todayKey()
      ? progress.streak
      : progress.lastCheckInDate === yesterdayKey()
        ? progress.streak + 1
        : 1;
    const nextPoints = progress.points + points;
    const nextProgress = applyUnlocks({
      ...progress,
      points: nextPoints,
      streak,
      lastCheckInDate: todayKey(),
      moodHistory: [entry, ...progress.moodHistory],
      forestDays: [{ ...entry, date: todayKey(), wellbeingScore: moodScores[mood.id], checkIns: 1, plantedAt: entry.createdAt }, ...progress.forestDays],
      lifetimeStats: { ...progress.lifetimeStats, checkIns: progress.lifetimeStats.checkIns + 1 },
    }, nextPoints);
    setSelectedMood(entry);
    syncServer("/chill/mood", { mood: mood.id }, nextProgress);
  };

  const completeJoy = (joy) => {
    const nextPoints = progress.points + joy.points;
    const nextProgress = applyUnlocks({
      ...progress,
      points: nextPoints,
      completedJoys: [{ ...joy, createdAt: new Date().toISOString() }, ...progress.completedJoys],
      lifetimeStats: { ...progress.lifetimeStats, joysCompleted: progress.lifetimeStats.joysCompleted + 1 },
    }, nextPoints);
    syncServer("/chill/joy", joy, nextProgress);
  };

  const popStressBubble = () => {
    const worry = stressText.trim();
    if (!worry) {
      setNotice("Give the bubble one small worry first.");
      return;
    }
    setBubblePopped(true);
    window.setTimeout(() => setBubblePopped(false), 500);
    const nextPoints = progress.points + 2;
    const nextProgress = applyUnlocks({
      ...progress,
      points: nextPoints,
      stressPops: [{ text: worry, createdAt: new Date().toISOString() }, ...progress.stressPops],
      lifetimeStats: { ...progress.lifetimeStats, stressReleases: progress.lifetimeStats.stressReleases + 1 },
    }, nextPoints);
    setStressText("");
    syncServer("/chill/stress", { text: worry }, nextProgress);
  };

  const chooseRandom = (items, current, setter) => {
    const options = items.filter((item) => item !== current);
    setter(options[Math.floor(Math.random() * options.length)] || items[0]);
  };
  const startCozy = () => {
    if (!sessionStarted || secondsLeft === 0) {
      setSecondsLeft(minutes * 60);
      setSessionStarted(true);
    }
    setTimerRunning(true);
  };
  const resetCozy = () => {
    setTimerRunning(false);
    setSessionStarted(false);
    setSecondsLeft(0);
  };
  const completeCozy = () => {
    const nextPoints = progress.points + Math.ceil(minutes / 2);
    const nextProgress = applyUnlocks({
      ...progress,
      points: nextPoints,
      cozySessions: [{ scene, minutes, createdAt: new Date().toISOString() }, ...progress.cozySessions],
      lifetimeStats: {
        ...progress.lifetimeStats,
        cozySessions: progress.lifetimeStats.cozySessions + 1,
        cozyMinutes: progress.lifetimeStats.cozyMinutes + minutes,
      },
    }, nextPoints);
    resetCozy();
    syncServer("/chill/cozy", { scene, minutes }, nextProgress);
  };
  const careForPet = (action) => {
    const pet = { ...progress.pet };
    if (action === "feed") pet.energy = Math.min(100, pet.energy + 15);
    if (action === "play") {
      pet.happiness = Math.min(100, pet.happiness + 15);
      pet.energy = Math.max(0, pet.energy - 8);
    }
    if (action === "pat") pet.happiness = Math.min(100, pet.happiness + 6);
    const nextPoints = progress.points + 3;
    syncServer("/chill/pet", { action }, applyUnlocks({
      ...progress,
      points: nextPoints,
      pet,
      lifetimeStats: { ...progress.lifetimeStats, petCareActions: progress.lifetimeStats.petCareActions + 1 },
    }, nextPoints));
  };
  const completeRescue = () => {
    const nextPoints = progress.points + 12;
    const nextProgress = applyUnlocks({
      ...progress,
      points: nextPoints,
      rescueSessions: [{ completedAt: new Date().toISOString() }, ...progress.rescueSessions],
      lifetimeStats: { ...progress.lifetimeStats, rescueSessions: progress.lifetimeStats.rescueSessions + 1 },
    }, nextPoints);
    setRescueStep(0);
    syncServer("/chill/rescue", {}, nextProgress);
  };
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };
  const openGuide = () => {
    setGuideStep(0);
    setShowGuide(true);
  };
  const closeGuide = () => {
    if (guideStorageKey) localStorage.setItem(guideStorageKey, "true");
    setShowGuide(false);
  };
  const finishGuide = (destination = "/today") => {
    closeGuide();
    navigate(destination);
  };

  const sharedProps = {
    activity,
    bubblePopped,
    careForPet,
    chooseRandom,
    comfortHandlers: { setActivity, setCompliment },
    compliment,
    completeCozy,
    completeJoy,
    completeRescue,
    completedToday,
    forest,
    garden,
    handleMood,
    latestMood,
    minutes,
    nextUnlock,
    popStressBubble,
    progress,
    rescueStep,
    resetCozy,
    scene,
    secondsLeft,
    selectedMood,
    setMinutes,
    setRescueStep,
    setScene,
    setStressText,
    setTimerRunning,
    startCozy,
    stressText,
    timerRunning,
    unlockProgress,
    user,
    sessionStarted,
  };

  const pages = {
    home: <LandingPage {...sharedProps} />,
    today: <TodayPage {...sharedProps} />,
    garden: <GardenPage {...sharedProps} />,
    comfort: <ComfortPage {...sharedProps} />,
    cozy: <CozyPage {...sharedProps} />,
    rescue: <RescuePage {...sharedProps} />,
    berry: <BerryPage {...sharedProps} />,
  };

  return (
    <main className="app-shell min-h-screen">
      <SiteHeader user={user} logout={logout} onOpenGuide={openGuide} />
      {notice && <NoticeToast notice={notice} onDismiss={() => setNotice("")} />}
      {showGuide && (
        <WelcomeGuide
          step={guideStep}
          user={user}
          onBack={() => setGuideStep((current) => Math.max(0, current - 1))}
          onNext={() => setGuideStep((current) => Math.min(2, current + 1))}
          onClose={closeGuide}
          onFinish={finishGuide}
        />
      )}
      {pages[view] || pages.home}
      <SiteFooter progress={progress} />
    </main>
  );
}

function SiteHeader({ user, logout, onOpenGuide }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="brand-lockup" aria-label="ChillBerry home">
          <span className="brand-mark"><Leaf size={18} strokeWidth={2.6} /></span>
          <span>ChillBerry</span>
        </Link>
        <nav className="candy-nav" aria-label="Main navigation">
          {navItems.map(({ to, label, Icon, color, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={{ "--nav-color": color }}
              className={({ isActive }) => `candy-nav-link ${isActive ? "is-active" : ""}`}
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <button className="icon-button guide-button" type="button" onClick={onOpenGuide} title="Quick guide" aria-label="Open quick guide"><CircleHelp size={19} /></button>
              <div className="user-chip"><CircleUserRound size={17} /><span>{user.name || "Berry Friend"}</span></div>
              <button className="icon-button" type="button" onClick={logout} title="Log out" aria-label="Log out"><LogOut size={19} /></button>
            </>
          ) : (
            <>
              <Link to="/login" className="button button-quiet">Log in</Link>
              <Link to="/register" className="button button-primary join-button">Join free</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function WelcomeGuide({ step, user, onBack, onNext, onClose, onFinish }) {
  const firstName = user?.name?.split(" ")[0] || "Berry friend";
  const steps = [
    {
      eyebrow: "Welcome to your space",
      title: `Hi ${firstName}, let’s make this feel easy.`,
      copy: "ChillBerry is a gentle daily wellbeing space. Start small—one mood check-in is enough for today.",
      image: berryLove,
      color: "#ff6f9a",
      Icon: Heart,
      notes: ["No perfect answers", "Your progress saves automatically"],
    },
    {
      eyebrow: "Your simple daily path",
      title: "Check in, choose a tiny step, feel a little lighter.",
      copy: "Visit Today to name your mood. Each check-in grows a plant in your Garden and builds your streak.",
      image: berryMoods,
      color: "#f5b93f",
      Icon: Sun,
      notes: ["Today · pick your mood", "Garden · see your journey"],
    },
    {
      eyebrow: "Help for every kind of day",
      title: "Choose what you need right now.",
      copy: "Find tiny activities in Comfort, take a peaceful timer in Cozy, or use Rescue when everything feels like too much.",
      image: berryCozy,
      color: "#63b8e9",
      Icon: Sparkles,
      notes: ["Comfort · quick lift", "Cozy · slow down", "Rescue · guided reset"],
    },
  ];
  const current = steps[step];
  const GuideIcon = current.Icon;

  return (
    <div className="guide-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="welcome-guide" role="dialog" aria-modal="true" aria-labelledby="guide-title" style={{ "--guide-color": current.color }}>
        <button className="guide-close" type="button" onClick={onClose} aria-label="Close guide" title="Close guide" autoFocus><X size={20} /></button>
        <div className="guide-art" aria-hidden="true">
          <span className="guide-art-glow" />
          <img key={current.image} src={current.image} alt="" />
          <span className="guide-art-pill"><GuideIcon size={15} /> Step {step + 1} of {steps.length}</span>
        </div>
        <div className="guide-content">
          <p className="guide-eyebrow"><GuideIcon size={15} /> {current.eyebrow}</p>
          <h2 id="guide-title">{current.title}</h2>
          <p className="guide-copy">{current.copy}</p>
          <div className="guide-notes">
            {current.notes.map((note) => <span key={note}><Check size={15} /> {note}</span>)}
          </div>
          <div className="guide-footer">
            <div className="guide-dots" aria-label={`Step ${step + 1} of ${steps.length}`}>
              {steps.map((item, index) => <span key={item.title} className={index === step ? "is-active" : ""} />)}
            </div>
            <div className="guide-actions">
              {step > 0 ? (
                <button className="button button-quiet" type="button" onClick={onBack}><ChevronLeft size={17} /> Back</button>
              ) : (
                <button className="guide-skip" type="button" onClick={onClose}>Skip guide</button>
              )}
              {step < steps.length - 1 ? (
                <button className="button button-primary" type="button" onClick={onNext}>Next <ArrowRight size={17} /></button>
              ) : (
                <button className="button button-primary" type="button" onClick={() => onFinish("/today")}>Start my check-in <ArrowRight size={17} /></button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function LandingPage({ progress, forest, user, nextUnlock, unlockProgress }) {
  const quickCards = [
    { to: "/today", title: "Check in", copy: "Pick today's mood and grow a new sprout.", image: berryMoods, color: "#ffd75e" },
    { to: "/comfort", title: "Comfort tools", copy: "Tiny joys, notes, and a release bubble.", image: berryCards, color: "#ff87a8" },
    { to: "/cozy", title: "Cozy corner", copy: "Start a soft timer with a scene you like.", image: berryCozy, color: "#8fd3ff" },
  ];

  return (
    <>
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="eyebrow"><Sparkles size={15} /> {greeting()}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</p>
          <h1>ChillBerry</h1>
          <p>A colorful little wellbeing space for mood check-ins, gentle resets, and tiny happy moments.</p>
          <div className="hero-actions">
            <Link to="/today" className="button button-primary button-large">Start today <ArrowRight size={18} /></Link>
            <Link to="/rescue" className="button button-quiet button-large">I need a reset</Link>
          </div>
          <div className="hero-stats">
            <Stat value={progress.points} label="Chill points" icon={Sparkles} color="#ff5a8a" />
            <Stat value={progress.streak} label="Day streak" icon={Flame} color="#ff7a42" />
            <Stat value={forest.length} label="Trees grown" icon={Flower2} color="#35a868" />
          </div>
        </div>
        <div className="home-hero-art">
          <img src={berryLove} alt="Cute strawberry character holding a heart" />
          <span className="float-badge badge-top"><Heart size={16} /> Take it softly</span>
          <span className="float-badge badge-bottom"><Star size={16} /> {nextUnlock?.name || "All rewards"}</span>
        </div>
      </section>

      <section className="page-section">
        <div className="section-heading-row">
          <SectionHeading eyebrow="Choose a space" title="Every nav item opens its own page." description="The app now feels less crowded, with each tool getting room to breathe." />
          <RewardProgress progress={progress} nextUnlock={nextUnlock} unlockProgress={unlockProgress} />
        </div>
        <div className="feature-grid">
          {quickCards.map((card) => (
            <Link to={card.to} className="feature-card" style={{ "--card-color": card.color }} key={card.to}>
              <img src={card.image} alt="" />
              <strong>{card.title}</strong>
              <span>{card.copy}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function TodayPage({ latestMood, selectedMood, handleMood, progress, nextUnlock, unlockProgress, user }) {
  const currentMood = selectedMood || latestMood;
  const todayLabel = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  const currentMoodId = currentMood?.mood || currentMood?.id;
  const currentMoodDetails = moods.find((mood) => mood.id === currentMoodId);
  const [capsuleNote, setCapsuleNote] = useState(() => localStorage.getItem(`chillberry-capsule:${todayKey()}`) || "");
  const [capsuleSaved, setCapsuleSaved] = useState(false);
  const berryMessages = {
    happy: "That light in you is worth noticing. Let us give it somewhere kind to go.",
    calm: "You found a quiet pocket today. There is no need to hurry out of it.",
    tired: "You do not need more discipline right now. You may simply need a softer pace.",
    stressed: "You are carrying a lot. We can put one small piece of it down together.",
    sad: "You do not have to brighten up for me. I can sit beside this feeling with you.",
  };
  const needSpaces = [
    { to: "/rescue", label: "Release", title: "Put something down", copy: "A guided reset for the thought that feels loudest.", Icon: Zap, color: "#9a6e9f", action: "Open rescue" },
    { to: "/cozy", label: "Restore", title: "Borrow three quiet minutes", copy: "A soft timer, a slower breath, and no pressure.", Icon: TimerReset, color: "#688aa0", action: "Enter cozy" },
    { to: "/comfort", label: "Reconnect", title: "Find one warm thing", copy: "A tiny activity or kind note chosen for this moment.", Icon: Heart, color: "#c8736f", action: "Find comfort" },
  ];
  const saveCapsule = () => {
    if (!capsuleNote.trim()) return;
    localStorage.setItem(`chillberry-capsule:${todayKey()}`, capsuleNote.trim());
    setCapsuleSaved(true);
  };
  return (
    <section className="page-shell today-page">
      <header className="today-hero">
        <img src={todayMoodStilllife} alt="Handcrafted glass berries resting in a peaceful sunlit garden studio" />
        <div className="today-hero-shade" />
        <div className="today-hero-copy">
          <p className="today-date"><span />{todayLabel}</p>
          <p className="eyebrow"><Sparkles size={15} /> {greeting()}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</p>
          <h1>Meet yourself<br /><em>where you are.</em></h1>
          <p>Take a quiet second. You do not have to fix the feeling; just notice it.</p>
          <div className="today-hero-meta">
            <span><Flame size={17} /> <strong>{progress.streak}</strong> day rhythm</span>
            <span><Flower2 size={17} /> <strong>{progress.moodHistory.length}</strong> moments noticed</span>
          </div>
        </div>
        <div className="today-hero-caption"><Leaf size={15} /><span>Your daily pause</span><strong>01</strong></div>
      </header>

      <div className="today-section-heading">
        <div><p className="label">A moment of honesty</p><h2>What is the weather inside?</h2></div>
        <p>Pick the closest feeling. It can change later.</p>
      </div>

      <div className="today-checkin-layout">
        <div className="panel today-mood-panel">
          <div className="mood-grid">
            {moods.map((mood, index) => {
              const active = currentMood?.mood === mood.id || currentMood?.id === mood.id;
              return (
                <button key={mood.id} type="button" onClick={() => handleMood(mood)} aria-pressed={active} className={`mood-option mood-${mood.id} ${active ? "is-active" : ""}`} style={{ "--mood-color": mood.color }}>
                  <span className="mood-number">0{index + 1}</span>
                  <span className="mood-object"><img src={moodCardImages[mood.id]} alt="" /></span>
                  <span className="mood-card-copy"><strong>{mood.label}</strong><small>{mood.tone}</small></span>
                  <span className="mood-select">{active ? <Check size={15} strokeWidth={3} /> : <ArrowRight size={15} />}</span>
                </button>
              );
            })}
          </div>
          <div className="suggestion-strip">
            <span className="suggestion-icon"><Sparkles size={20} /></span>
            <div>
              <p className="label">A gentle next step</p>
              <p>{currentMood?.suggestion || "Choose a mood and your first tiny comfort suggestion will appear here."}</p>
            </div>
            <Link to="/comfort" className="suggestion-link" aria-label="Open comfort tools"><ArrowRight size={18} /></Link>
          </div>
        </div>
        <RewardProgress progress={progress} nextUnlock={nextUnlock} unlockProgress={unlockProgress} />
      </div>

      <section className="berry-response" style={{ "--response-color": currentMoodDetails?.color || "#68b889" }}>
        <div className="berry-response-stage">
          <span className="berry-response-orbit orbit-one" />
          <span className="berry-response-orbit orbit-two" />
          <img src={moodCardImages[currentMoodId] || moodCalmCharacter} alt="Your ChillBerry mood companion" />
          <span className="berry-ground-shadow" />
        </div>
        <div className="berry-response-copy">
          <p className="label">A note from your berry</p>
          <h2>{currentMoodDetails ? `${currentMoodDetails.label} can be here.` : "I am ready when you are."}</h2>
          <p>{currentMoodDetails ? berryMessages[currentMoodDetails.id] : "Choose the feeling above that comes closest. You do not need the perfect word."}</p>
          <div className="berry-whisper"><Sparkles size={16} /><span>{currentMoodDetails?.suggestion || "One honest check-in is enough for this moment."}</span></div>
        </div>
      </section>

      <section className="need-section">
        <div className="today-section-heading compact">
          <div><p className="label">Choose what you need</p><h2>Where should we go from here?</h2></div>
          <p>Three different doors. There is no wrong one.</p>
        </div>
        <div className="need-grid">
          {needSpaces.map(({ to, label, title, copy, Icon, color, action }, index) => (
            <Link to={to} className="need-card" style={{ "--need-color": color }} key={label}>
              <div className="need-card-index">0{index + 1}</div>
              <div className="need-object"><span><Icon size={28} /></span><i /><i /></div>
              <p>{label}</p><h3>{title}</h3><span>{copy}</span>
              <div className="need-action">{action}<ArrowRight size={16} /></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="today-keepsake-grid">
        <article className={`feeling-seed ${currentMoodDetails ? "is-planted" : ""}`} style={{ "--seed-color": currentMoodDetails?.color || "#68b889" }}>
          <div className="seed-copy"><p className="label">Your feeling, planted</p><h2>{currentMoodDetails ? `${currentMoodDetails.plant} joined your garden.` : "A seed is waiting for you."}</h2><p>{currentMoodDetails ? "This feeling is now part of your story, not the whole story." : "Choose a mood above and its plant will take root here."}</p></div>
          <div className="seed-scene"><span className="seed-sun" /><span className="seed-stem" /><span className="seed-leaf leaf-left" /><span className="seed-leaf leaf-right" /><span className="seed-bloom"><Leaf size={20} /></span><i /></div>
          <Link to="/garden" className="seed-link">Visit your garden <ArrowRight size={16} /></Link>
        </article>

        <article className="time-capsule">
          <div className="capsule-top"><div><p className="label">Tonight's time capsule</p><h2>Leave a note for later.</h2></div><span><Star size={21} /></span></div>
          <p>What should tonight's version of you remember about this moment?</p>
          <textarea value={capsuleNote} onChange={(event) => { setCapsuleNote(event.target.value); setCapsuleSaved(false); }} maxLength={180} placeholder="Maybe I need to remember..." aria-label="A note for yourself tonight" />
          <div className="capsule-footer"><small>{capsuleNote.length}/180</small><button type="button" onClick={saveCapsule} disabled={!capsuleNote.trim()}>{capsuleSaved ? <><Check size={16} /> Saved for tonight</> : <>Seal this note <ArrowRight size={16} /></>}</button></div>
        </article>
      </section>
    </section>
  );
}

function GardenPage({ garden, forest, progress }) {
  const [selectedTreeId, setSelectedTreeId] = useState(null);
  const dateKeyFromOffset = (offset) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - offset);
    return date.toISOString().slice(0, 10);
  };
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = dateKeyFromOffset(6 - index);
    const entries = forest.filter((tree) => tree.date === date);
    return { date, entry: entries[0], treeCount: entries.length };
  });
  const previousWeekCount = Array.from({ length: 7 }, (_, index) => dateKeyFromOffset(13 - index))
    .filter((date) => forest.some((day) => day.date === date)).length;
  const thisWeekCount = week.filter((day) => day.entry).length;
  const forestDaysCount = new Set(forest.map((tree) => tree.date).filter(Boolean)).size;
  const rhythmMessage = thisWeekCount > previousWeekCount
    ? "Your check-in rhythm is growing."
    : thisWeekCount === previousWeekCount && thisWeekCount > 0
      ? "You are keeping a steady rhythm."
      : "A gentle fresh start is always here.";
  const lifetime = progress.lifetimeStats;
  const todayTime = Date.parse(`${dateKeyFromOffset(0)}T00:00:00Z`);
  const rawVisibleTrees = garden.map((item, sourceIndex) => {
    const treeTime = Date.parse(`${item.date || dateKeyFromOffset(0)}T00:00:00Z`);
    const ageDays = Math.max(0, Math.floor((todayTime - treeTime) / 86400000));
    return { item, sourceIndex, ageDays };
  }).filter((tree) => tree.ageDays <= 13)
    .sort((first, second) => first.ageDays - second.ageDays || first.sourceIndex - second.sourceIndex);
  const forestPlots = [
    { left: 17, bottom: 1, scale: 1, opacity: 1, layer: 112 },
    { left: 51, bottom: 6, scale: 0.92, opacity: 1, layer: 108 },
    { left: 84, bottom: 2, scale: 0.97, opacity: 1, layer: 110 },
    { left: 68, bottom: 21, scale: 0.77, opacity: 0.97, layer: 88 },
    { left: 30, bottom: 16, scale: 0.83, opacity: 0.98, layer: 92 },
    { left: 91, bottom: 24, scale: 0.71, opacity: 0.94, layer: 84 },
    { left: 9, bottom: 35, scale: 0.57, opacity: 0.86, layer: 66 },
    { left: 44, bottom: 30, scale: 0.63, opacity: 0.9, layer: 72 },
    { left: 75, bottom: 39, scale: 0.5, opacity: 0.8, layer: 60 },
    { left: 94, bottom: 33, scale: 0.58, opacity: 0.84, layer: 68 },
    { left: 27, bottom: 50, scale: 0.38, opacity: 0.63, layer: 42 },
    { left: 60, bottom: 45, scale: 0.43, opacity: 0.7, layer: 48 },
    { left: 83, bottom: 54, scale: 0.31, opacity: 0.53, layer: 36 },
    { left: 7, bottom: 48, scale: 0.39, opacity: 0.62, layer: 44 },
  ];
  const visibleTrees = rawVisibleTrees.slice(0, forestPlots.length).map((tree, plotIndex) => {
    const plot = forestPlots[plotIndex];
    const treeId = `${tree.item.plantedAt || tree.item.createdAt || tree.item.date}-${tree.sourceIndex}`;
    return { ...tree, treeId, ...plot };
  }).sort((first, second) => first.layer - second.layer);
  const selectedTree = visibleTrees.find((tree) => tree.treeId === selectedTreeId);
  const selectedMoodMeta = moods.find((mood) => mood.id === selectedTree?.item.mood);
  const deepForestCount = garden.length - visibleTrees.length;

  return (
    <section className="page-shell garden-page">
      <header className="forest-page-header">
        <div><p className="eyebrow"><Flower2 size={15} /> Your mood forest</p><h1>Every feeling grows here.</h1><p>Each mood plants its own tree. New memories stay close while older ones settle softly into the distance.</p></div>
        <img src={berryGarden} alt="" />
      </header>
      <div className="forest-layout">
        <div className="garden-bed">
          <div className="forest-title-row"><div><p className="label">Every mood becomes a tree</p><h2>Your living mood forest</h2><p>Today grows closest to you. Each older day settles deeper into the landscape.</p></div><span>{forest.length} {forest.length === 1 ? "tree" : "trees"}</span></div>
          {garden.length > 0 ? (
            <div className="forest-scene" onClick={() => setSelectedTreeId(null)}>
              <span className="forest-sun" aria-hidden="true" />
              <span className="forest-cloud forest-cloud-one" aria-hidden="true" />
              <span className="forest-cloud forest-cloud-two" aria-hidden="true" />
              <div className="forest-hills" aria-hidden="true" />
              <div className="deep-tree-line" aria-hidden="true" />
              <div className="forest-path" aria-hidden="true" />
              {visibleTrees.map(({ item, sourceIndex, treeId, ageDays, left, scale, bottom, opacity, layer }) => (
                <button
                  type="button"
                  className={`forest-tree tree-style-${(sourceIndex % 4) + 1} ${ageDays > 6 ? "is-distant" : ""} ${selectedTreeId === treeId ? "is-selected" : ""}`}
                  key={treeId}
                  aria-expanded={selectedTreeId === treeId}
                  aria-label={`View ${item.plant || "Berry Tree"} details`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedTreeId((current) => current === treeId ? null : treeId);
                  }}
                  style={{
                    "--tree-color": item.color || "#68b889",
                    "--tree-scale": scale,
                    "--tree-delay": `${Math.min(sourceIndex * 22, 440)}ms`,
                    "--tree-left": `${left}%`,
                    "--tree-bottom": `${bottom}%`,
                    "--tree-opacity": opacity,
                    "--tree-layer": layer,
                    "--tree-tilt": `${((sourceIndex * 7) % 5) - 2}deg`,
                    "--tree-sway-delay": `${-(sourceIndex % 6) * 0.65}s`,
                  }}
                >
                  <div className="tree-visual" aria-hidden="true">
                    <span className="tree-shadow" />
                    <img className="tree-sprite" src={moodTreeImages[item.mood] || treeCalm} alt="" />
                    <span className="tree-magic tree-magic-one" />
                    <span className="tree-magic tree-magic-two" />
                    <span className="tree-magic tree-magic-three" />
                  </div>
                </button>
              ))}
              <div className="forest-front-grass" aria-hidden="true" />
              <span className="forest-click-hint"><Leaf size={13} /> Tap a tree to see its story</span>
              {deepForestCount > 0 && <span className="deep-forest-count"><Leaf size={14} /> {deepForestCount} older {deepForestCount === 1 ? "tree lives" : "trees live"} beyond the mist</span>}
              {selectedTree && (
                <aside
                  className="tree-popup"
                  key={selectedTree.treeId}
                  role="dialog"
                  aria-label={`${selectedTree.item.plant || "Berry Tree"} details`}
                  style={{ "--popup-color": selectedTree.item.color || "#68b889" }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="tree-popup-glow" aria-hidden="true"><Sparkles size={18} /></span>
                  <img src={moodTreeImages[selectedTree.item.mood] || treeCalm} alt="" />
                  <div className="tree-popup-copy">
                    <span className="tree-popup-kicker"><i /> Mood tree discovered</span>
                    <strong>{selectedTree.item.plant || "Berry Tree"}</strong>
                    <p>{selectedMoodMeta?.suggestion || "This tree grew from a moment you chose to check in with yourself."}</p>
                    <div className="tree-popup-meta">
                      <span>{selectedTree.item.label || selectedTree.item.mood}</span>
                      <time dateTime={selectedTree.item.date}>{selectedTree.ageDays === 0 ? "Planted today" : selectedTree.item.date ? new Date(`${selectedTree.item.date}T00:00:00Z`).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }) : "Planted today"}</time>
                    </div>
                  </div>
                  <button type="button" className="tree-popup-close" aria-label="Close tree details" onClick={() => setSelectedTreeId(null)}><X size={17} /></button>
                </aside>
              )}
            </div>
          ) : (
            <div className="empty-garden">
              <span><Leaf size={32} /></span>
              <strong>Your garden is ready</strong>
              <p>Visit Today to plant the first sprout.</p>
              <Link to="/today" className="button button-primary">Check in <ArrowRight size={17} /></Link>
            </div>
          )}
        </div>
        <div className="panel garden-summary">
          <div className="garden-summary-title"><p className="label">Lifetime growth</p><h3>Your journey so far</h3></div>
          <MiniStat value={lifetime.checkIns} label="Mood check-ins" />
          <MiniStat value={forest.length} label="Trees grown" />
          <MiniStat value={forestDaysCount} label="Forest days" />
          <MiniStat value={progress.streak} label="Current streak" />
          <MiniStat value={lifetime.joysCompleted} label="Tiny joys" />
          <MiniStat value={lifetime.cozyMinutes} label="Cozy minutes" />
          <MiniStat value={progress.unlocks.length} label="Rewards" />
        </div>
      </div>
      <section className="panel forest-week" aria-labelledby="forest-week-title">
        <div className="forest-week-head">
          <div><p className="label">Your improvement timeline</p><h2 id="forest-week-title">The last seven days</h2><p>{rhythmMessage}</p></div>
          <span className="week-score"><strong>{thisWeekCount}</strong>/7 days tended</span>
        </div>
        <div className="week-strip">
          {week.map(({ date, entry, treeCount }) => (
            <div className={`week-day ${entry ? "is-tended" : ""}`} key={date} style={{ "--day-color": entry?.color || "#dfe8e1" }}>
              <span>{new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" })}</span>
              <i>{entry ? <Leaf size={17} /> : null}{treeCount > 1 && <b>{treeCount}</b>}</i>
              <small>{treeCount > 0 ? `${treeCount} ${treeCount === 1 ? "tree" : "trees"}` : "Rest"}</small>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

function ComfortPage({ completedToday, completeJoy, stressText, setStressText, popStressBubble, bubblePopped, compliment, activity, chooseRandom, comfortHandlers }) {
  return (
    <section className="page-shell comfort-page">
      <PageHero
        eyebrow="Small things, real shifts"
        title="Your comfort toolkit."
        copy="Pick what feels useful now. A minute is enough to begin."
        image={berryCards}
      />
      <div className="comfort-layout">
        <article className="panel">
          <CardHeader icon={Check} title="Tiny daily joys" meta={`${completedToday.size}/${dailyJoys.length} today`} tone="green" />
          <div className="divide-list">
            {dailyJoys.map((joy) => {
              const done = completedToday.has(joy.title);
              return (
                <button key={joy.title} type="button" disabled={done} onClick={() => completeJoy(joy)} className="joy-row">
                  <span className={`joy-check ${done ? "is-done" : ""}`}>{done && <Check size={15} strokeWidth={3} />}</span>
                  <span className="joy-copy"><strong>{joy.title}</strong><small>{joy.category}</small></span>
                  <span className="point-pill">{done ? "Done" : `+${joy.points}`}</span>
                </button>
              );
            })}
          </div>
        </article>
        <article className="panel">
          <CardHeader icon={CloudRain} title="Stress bubble" meta="Write it. Release it." tone="blue" />
          <div className="stress-content">
            <div className="stress-form">
              <label htmlFor="stress-thought" className="label">What feels heavy?</label>
              <textarea id="stress-thought" value={stressText} onChange={(event) => setStressText(event.target.value)} rows={6} maxLength={160} placeholder="Let one thought out of your head..." className="field" />
              <div className="field-note"><span>Private to you</span><span>{stressText.length}/160</span></div>
            </div>
            <div className="bubble-stage">
              <button type="button" onClick={popStressBubble} className={`stress-bubble ${bubblePopped ? "stress-bubble-pop" : ""}`} aria-label="Pop stress bubble"><span>Release</span><Wind size={20} /></button>
            </div>
          </div>
        </article>
        <article className="panel note-panel">
          <CardHeader icon={Heart} title="A note for you" meta="Compliment machine" tone="berry" />
          <div className="mini-tool-body">
            <blockquote className="quote-text">"{compliment}"</blockquote>
            <button type="button" onClick={() => chooseRandom(compliments, compliment, comfortHandlers.setCompliment)} className="button button-quiet"><RefreshCw size={17} /> New note</button>
          </div>
        </article>
        <article className="panel note-panel">
          <CardHeader icon={Sparkles} title="Try something tiny" meta="Activity generator" tone="coral" />
          <div className="mini-tool-body">
            <p className="activity-text">{activity}</p>
            <button type="button" onClick={() => chooseRandom(activities, activity, comfortHandlers.setActivity)} className="button button-quiet"><RefreshCw size={17} /> Another idea</button>
          </div>
        </article>
      </div>
    </section>
  );
}

function CozyPage({ scene, setScene, resetCozy, minutes, setMinutes, sessionStarted, secondsLeft, timerRunning, setTimerRunning, startCozy, completeCozy }) {
  const timerDisplay = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;
  return (
    <section className="page-shell cozy-page">
      <PageHero
        eyebrow="Cozy corner"
        title="Make room for quiet."
        copy="Choose a scene and stay for a few unhurried minutes."
        image={berryCozy}
      />
      <article className="cozy-panel">
        <div>
          <p className="eyebrow eyebrow-light"><CloudRain size={15} /> {scene}</p>
          <div className="cozy-head">
            <h2>Soft timer</h2>
            <div className="timer-display" aria-live="polite">{sessionStarted ? timerDisplay : `${String(minutes).padStart(2, "0")}:00`}</div>
          </div>
          <div className="scene-tabs" role="group" aria-label="Cozy scene">
            {cozyScenes.map((item) => <button key={item} type="button" onClick={() => { setScene(item); resetCozy(); }} className={scene === item ? "is-active" : ""}>{item}</button>)}
          </div>
          <div className="range-row">
            <div><label htmlFor="session-minutes">Session length</label><span>{minutes} min</span></div>
            <input id="session-minutes" type="range" min="1" max="15" value={minutes} disabled={sessionStarted} onChange={(event) => setMinutes(Number(event.target.value))} className="cozy-range" />
          </div>
          <div className="cozy-actions">
            <button type="button" onClick={timerRunning ? () => setTimerRunning(false) : startCozy} className="button button-light">{timerRunning ? <Pause size={18} /> : <Play size={18} />}{timerRunning ? "Pause" : sessionStarted ? "Resume" : "Start session"}</button>
            {sessionStarted && <button type="button" onClick={resetCozy} className="icon-button icon-button-dark" title="Reset timer" aria-label="Reset timer"><TimerReset size={19} /></button>}
            <button type="button" disabled={!sessionStarted} onClick={completeCozy} className="button button-outline-light"><Check size={18} /> Complete</button>
          </div>
        </div>
      </article>
    </section>
  );
}

function RescuePage({ rescueStep, setRescueStep, completeRescue }) {
  return (
    <section className="page-shell rescue-page">
      <PageHero
        eyebrow="Bad day rescue"
        title="One step at a time."
        copy="A quieter page for the moments when everything feels like too much."
        image={berryStress}
      />
      <article className="rescue-panel">
        <div className="rescue-top">
          <p className="eyebrow"><BookHeart size={15} /> Bad day rescue</p>
          <span className="step-count">{rescueStep + 1}/{rescueSteps.length}</span>
        </div>
        <div className="rescue-step"><span>{String(rescueStep + 1).padStart(2, "0")}</span><p>{rescueSteps[rescueStep]}</p></div>
        <div className="step-dots" aria-hidden="true">{rescueSteps.map((_, index) => <span key={index} className={index <= rescueStep ? "is-active" : ""} />)}</div>
        <div className="rescue-actions">
          <button type="button" disabled={rescueStep === 0} onClick={() => setRescueStep((current) => current - 1)} className="icon-button" title="Previous step" aria-label="Previous step"><ChevronLeft size={20} /></button>
          {rescueStep < rescueSteps.length - 1 ? (
            <button type="button" onClick={() => setRescueStep((current) => current + 1)} className="button button-rescue">Next step <ChevronRight size={18} /></button>
          ) : (
            <button type="button" onClick={completeRescue} className="button button-rescue"><Check size={18} /> Finish rescue</button>
          )}
        </div>
      </article>
    </section>
  );
}

function BerryPage({ progress, careForPet }) {
  return (
    <section className="page-shell berry-page">
      <PageHero
        eyebrow="Garden buddy"
        title={`${progress.pet.name} has a page now.`}
        copy="Feed, play, or give a gentle pat to keep your little berry buddy cheerful."
        image={berryLove}
      />
      <article className="panel pet-card">
        <div className="pet-zone"><div className="pet-shadow" /><div className="pet-face"><span className="pet-leaf" /></div></div>
        <div className="pet-meters">
          <Meter label="Energy" value={progress.pet.energy} color="#f2ad41" />
          <Meter label="Happiness" value={progress.pet.happiness} color="#5ec985" />
        </div>
        <div className="pet-actions">{["feed", "play", "pat"].map((action) => <button key={action} type="button" onClick={() => careForPet(action)} className="pet-action">{action}</button>)}</div>
      </article>
    </section>
  );
}

function PageHero({ eyebrow, title, copy, image }) {
  return (
    <header className="page-hero">
      <div>
        <p className="eyebrow"><Sparkles size={15} /> {eyebrow}</p>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      <img src={image} alt="" />
    </header>
  );
}

function NoticeToast({ notice, onDismiss }) {
  return (
    <div className="notice-toast" role="status" aria-live="polite">
      <BadgeCheck size={18} />
      <span>{notice}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss message" title="Dismiss"><X size={17} /></button>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return <div className="section-heading"><p className="label">{eyebrow}</p><h2>{title}</h2><p>{description}</p></div>;
}
function RewardProgress({ progress, nextUnlock, unlockProgress }) {
  return (
    <aside className="panel reward-panel">
      <div className="reward-head"><div><p className="label">Next reward</p><h3>{nextUnlock?.name || "Garden complete"}</h3></div><span><Star size={22} /></span></div>
      <div className="reward-meter"><div><span>{progress.points} points</span><span>{nextUnlock?.points || progress.points}</span></div><ProgressBar value={unlockProgress} color="#f2ad41" /><p>{nextUnlock ? `${Math.max(0, nextUnlock.points - progress.points)} more points to unlock it.` : "You found every current reward."}</p></div>
    </aside>
  );
}
function Stat({ value, label, icon: Icon, color }) {
  return <div className="stat-item"><Icon size={17} style={{ color }} /><div><strong>{value}</strong><span>{label}</span></div></div>;
}
function MiniStat({ value, label }) {
  return <div className="mini-stat"><strong>{value}</strong><span>{label}</span></div>;
}
function CardHeader({ icon: Icon, title, meta, tone }) {
  return <header className="card-header"><span className={`card-icon tone-${tone}`}><Icon size={19} /></span><div><h3>{title}</h3><p>{meta}</p></div></header>;
}
function ProgressBar({ value, color }) {
  return <div className="progress-track"><div style={{ width: `${value}%`, backgroundColor: color }} /></div>;
}
function Meter({ label, value, color }) {
  return <div><div className="meter-label"><span>{label}</span><span>{value}%</span></div><ProgressBar value={value} color={color} /></div>;
}
function SiteFooter({ progress }) {
  const lifetime = progress.lifetimeStats;
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <div className="brand-lockup"><span className="brand-mark"><Leaf size={18} /></span><span>ChillBerry</span></div>
          <p>Small moments make a kinder day.</p>
        </div>
        <div className="footer-stats">
          <MiniStat value={lifetime.joysCompleted} label="Joys" />
          <MiniStat value={lifetime.stressReleases} label="Released" />
          <MiniStat value={progress.unlocks.length} label="Rewards" />
        </div>
      </div>
    </footer>
  );
}

export default Home;
