import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BookHeart,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  CloudRain,
  Flame,
  Flower2,
  Heart,
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
import gardenImage from "../assets/chillberry-garden.png";

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
  completedJoys: [],
  stressPops: [],
  cozySessions: [],
  rescueSessions: [],
  unlocks: ["Starter Garden"],
  pet: { name: "Berry", energy: 70, happiness: 75 },
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
  completedJoys: saved.completedJoys || [],
  stressPops: saved.stressPops || [],
  cozySessions: saved.cozySessions || [],
  rescueSessions: saved.rescueSessions || [],
  unlocks: saved.unlocks || starterProgress.unlocks,
  pet: { ...starterProgress.pet, ...saved.pet },
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

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => loadStored("user", null));
  const [progress, setProgress] = useState(() => mergeProgress(loadStored("chillberry-progress", starterProgress)));
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
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    api.get("/chill/profile").then((response) => {
      setUser(response.data.user);
      setProgress(normalizeProgress(response.data));
    }).catch(() => setNotice("Offline mode: your progress is safe on this device."));
  }, [token]);

  useEffect(() => {
    localStorage.setItem("chillberry-progress", JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

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
  const garden = progress.moodHistory.slice(0, 8);
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
      moodHistory: [entry, ...progress.moodHistory].slice(0, 30),
    }, nextPoints);
    setSelectedMood(entry);
    syncServer("/chill/mood", { mood: mood.id }, nextProgress);
  };

  const completeJoy = (joy) => {
    const nextPoints = progress.points + joy.points;
    const nextProgress = applyUnlocks({
      ...progress,
      points: nextPoints,
      completedJoys: [{ ...joy, createdAt: new Date().toISOString() }, ...progress.completedJoys].slice(0, 40),
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
      stressPops: [{ text: worry, createdAt: new Date().toISOString() }, ...progress.stressPops].slice(0, 20),
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
      cozySessions: [{ scene, minutes, createdAt: new Date().toISOString() }, ...progress.cozySessions].slice(0, 20),
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
    syncServer("/chill/pet", { action }, applyUnlocks({ ...progress, points: nextPoints, pet }, nextPoints));
  };
  const completeRescue = () => {
    const nextPoints = progress.points + 12;
    const nextProgress = applyUnlocks({
      ...progress,
      points: nextPoints,
      rescueSessions: [{ completedAt: new Date().toISOString() }, ...progress.rescueSessions].slice(0, 20),
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
  const timerDisplay = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return (
    <main className="app-shell min-h-screen text-[#29252c]">
      <header className="sticky top-0 z-50 border-b border-[#eadfe3] bg-[#fffdfb]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1380px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="brand-lockup" aria-label="ChillBerry home"><span className="brand-mark"><Leaf size={18} strokeWidth={2.5} /></span><span>ChillBerry</span></Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            <a className="nav-link" href="#today">Today</a><a className="nav-link" href="#garden">Garden</a><a className="nav-link" href="#comfort">Comfort tools</a><a className="nav-link" href="#pet">Berry</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? <><div className="user-chip hidden sm:flex"><CircleUserRound size={17} /><span>{user.name || "Berry Friend"}</span></div><button className="icon-button" type="button" onClick={logout} title="Log out" aria-label="Log out"><LogOut size={19} /></button></> : <><Link to="/login" className="button button-quiet">Log in</Link><Link to="/register" className="button button-primary join-button">Join free</Link></>}
          </div>
        </div>
      </header>

      {notice && <div className="notice-toast" role="status" aria-live="polite"><BadgeCheck size={18} /><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss message" title="Dismiss"><X size={17} /></button></div>}

      <section className="hero-band overflow-hidden border-b border-[#eadfe3]">
        <div className="mx-auto grid min-h-[calc(100vh-112px)] max-w-[1380px] grid-cols-1 items-center gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-8 lg:py-10">
          <div className="relative z-10 max-w-2xl">
            <p className="eyebrow"><Sparkles size={15} /> Your calm space for today</p>
            <h1 className="mt-5 text-5xl font-black leading-[0.88] text-[#a82e59] sm:text-6xl lg:text-7xl xl:text-8xl">Feel it.<br /><span className="text-[#315e49]">Grow through</span><br /><span className="text-[#315e49]">it.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#615a61] sm:text-lg sm:leading-8">A gentle daily space to notice your mood, release what feels heavy, and grow tiny moments of joy.</p>
            <div className="mt-7 flex flex-wrap gap-3"><a href="#today" className="button button-primary button-large">Check in now <ArrowRight size={18} /></a><a href="#rescue" className="button button-quiet button-large">I need a reset</a></div>
            <div className="mt-9 grid max-w-xl grid-cols-3 border-y border-[#dfd6d9] py-4">
              <Stat value={progress.points} label="Chill points" icon={Sparkles} color="#a82e59" /><Stat value={progress.streak} label="Day streak" icon={Flame} color="#cb6b3d" /><Stat value={garden.length} label="Plants grown" icon={Flower2} color="#387258" />
            </div>
          </div>
          <div className="hero-art relative flex min-h-[360px] items-center justify-center lg:min-h-[600px]">
            <div className="hero-art-frame" /><img src={gardenImage} alt="Berry resting in a lush floating wellbeing garden" className="relative z-10 w-full max-w-[670px] object-contain" />
            <div className="hero-note hero-note-top"><Wind size={17} /><span>Take it softly</span></div><div className="hero-note hero-note-bottom"><Leaf size={17} /><span>{progress.moodHistory.length || "New"} garden moments</span></div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1380px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section id="today" className="scroll-mt-24">
          <SectionHeading eyebrow={`${greeting()}${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`} title="How are you arriving today?" description="There is no wrong answer. Choose the feeling that comes closest." />
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
            <div className="panel p-4 sm:p-6">
              <div className="mood-grid">
                {moods.map((mood) => {
                  const Icon = mood.Icon;
                  const active = (selectedMood || latestMood)?.mood === mood.id || selectedMood?.id === mood.id;
                  return <button key={mood.id} type="button" onClick={() => handleMood(mood)} aria-pressed={active} className={`mood-option ${active ? "is-active" : ""}`} style={{ "--mood-color": mood.color }}><span className="mood-icon"><Icon size={22} /></span><strong>{mood.label}</strong><small>{mood.tone}</small></button>;
                })}
              </div>
              <div className="suggestion-strip"><span className="suggestion-icon"><Sparkles size={20} /></span><div><p className="label">A gentle next step</p><p>{(selectedMood || latestMood)?.suggestion || "Choose a mood and your first tiny comfort suggestion will appear here."}</p></div></div>
            </div>
            <aside className="panel progress-panel p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4"><div><p className="label text-[#7d6e73]">Next reward</p><h3 className="mt-2 text-xl font-extrabold text-[#2c292c]">{nextUnlock?.name || "Garden complete"}</h3></div><span className="reward-icon"><Star size={22} /></span></div>
              <div className="mt-8"><div className="mb-2 flex justify-between text-sm font-bold text-[#6a6165]"><span>{progress.points} points</span><span>{nextUnlock?.points || progress.points}</span></div><ProgressBar value={unlockProgress} color="#d69a3b" /><p className="mt-3 text-sm leading-6 text-[#776e72]">{nextUnlock ? `${Math.max(0, nextUnlock.points - progress.points)} more points to unlock it.` : "You found every current reward."}</p></div>
            </aside>
          </div>
        </section>

        <section id="garden" className="scroll-mt-24 pt-14 lg:pt-20">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="garden-intro"><p className="eyebrow"><Flower2 size={15} /> Your mood garden</p><h2 className="mt-4 text-3xl font-black text-[#2d3f35] sm:text-4xl">Every feeling leaves something worth tending.</h2><p className="mt-4 max-w-lg leading-7 text-[#68716b]">Each check-in plants a new memory. Over time, your garden becomes a quiet record of how far you have come.</p><div className="mt-8 flex gap-7"><MiniStat value={progress.moodHistory.length} label="Check-ins" /><MiniStat value={progress.streak} label="Current streak" /></div></div>
            <div className="garden-bed">
              {garden.length > 0 ? <div className="garden-grid">{garden.map((item, index) => <div className="plant" key={`${item.createdAt}-${index}`}><span className={`plant-shape plant-${(index % 4) + 1}`} style={{ "--plant-color": item.color || "#68b889" }} /><strong>{item.plant || "Berry Sprout"}</strong><small>{item.label || item.mood}</small></div>)}</div> : <div className="empty-garden"><span><Leaf size={32} /></span><strong>Your garden is ready</strong><p>Choose a mood above to plant the first sprout.</p></div>}
            </div>
          </div>
        </section>

        <section id="comfort" className="scroll-mt-24 pt-14 lg:pt-20">
          <SectionHeading eyebrow="Small things, real shifts" title="Your comfort toolkit" description="Pick what feels useful now. A minute is enough to begin." />
          <div className="mt-6 grid gap-4 lg:grid-cols-12">
            <article className="panel lg:col-span-5">
              <CardHeader icon={Check} title="Tiny daily joys" meta={`${completedToday.size}/${dailyJoys.length} today`} tone="green" />
              <div className="divide-y divide-[#e7e5e2] px-5 pb-3">{dailyJoys.map((joy) => { const done = completedToday.has(joy.title); return <button key={joy.title} type="button" disabled={done} onClick={() => completeJoy(joy)} className="joy-row"><span className={`joy-check ${done ? "is-done" : ""}`}>{done && <Check size={15} strokeWidth={3} />}</span><span className="min-w-0 flex-1"><strong>{joy.title}</strong><small>{joy.category}</small></span><span className="point-pill">{done ? "Done" : `+${joy.points}`}</span></button>; })}</div>
            </article>

            <article className="panel overflow-hidden lg:col-span-7">
              <CardHeader icon={CloudRain} title="Stress bubble" meta="Write it. Release it." tone="blue" />
              <div className="grid min-h-[280px] gap-5 p-5 sm:grid-cols-[1fr_180px] sm:p-6">
                <div className="flex flex-col"><label htmlFor="stress-thought" className="label mb-2">What feels heavy?</label><textarea id="stress-thought" value={stressText} onChange={(event) => setStressText(event.target.value)} rows={5} maxLength={160} placeholder="Let one thought out of your head..." className="field flex-1 resize-none" /><div className="mt-2 flex justify-between text-xs text-[#8b8386]"><span>Private to you</span><span>{stressText.length}/160</span></div></div>
                <div className="bubble-stage"><button type="button" onClick={popStressBubble} className={`stress-bubble ${bubblePopped ? "stress-bubble-pop" : ""}`} aria-label="Pop stress bubble"><span>Release</span><Wind size={20} /></button></div>
              </div>
            </article>

            <article className="panel lg:col-span-4"><CardHeader icon={Heart} title="A note for you" meta="Compliment machine" tone="berry" /><div className="p-5 sm:p-6"><blockquote className="quote-text">“{compliment}”</blockquote><button type="button" onClick={() => chooseRandom(compliments, compliment, setCompliment)} className="button button-quiet mt-7"><RefreshCw size={17} /> New note</button></div></article>
            <article className="panel lg:col-span-4"><CardHeader icon={Sparkles} title="Try something tiny" meta="Activity generator" tone="coral" /><div className="p-5 sm:p-6"><p className="activity-text">{activity}</p><button type="button" onClick={() => chooseRandom(activities, activity, setActivity)} className="button button-quiet mt-7"><RefreshCw size={17} /> Another idea</button></div></article>
            <article className="panel lg:col-span-4" id="pet">
              <CardHeader icon={Heart} title={progress.pet.name} meta="Your garden buddy" tone="green" />
              <div className="p-5 sm:p-6"><div className="pet-zone"><div className="pet-shadow" /><div className="pet-face"><span className="pet-leaf" /></div></div><div className="mt-5 space-y-3"><Meter label="Energy" value={progress.pet.energy} color="#d39a42" /><Meter label="Happiness" value={progress.pet.happiness} color="#5da47b" /></div><div className="mt-5 grid grid-cols-3 gap-2">{["feed", "play", "pat"].map((action) => <button key={action} type="button" onClick={() => careForPet(action)} className="pet-action">{action}</button>)}</div></div>
            </article>
          </div>
        </section>

        <section className="pt-14 lg:pt-20">
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="cozy-panel">
              <div className="relative z-10"><p className="eyebrow eyebrow-light"><CloudRain size={15} /> Cozy corner</p><div className="mt-5 flex flex-wrap items-start justify-between gap-5"><div><h2 className="text-3xl font-black text-white">Make room for quiet.</h2><p className="mt-2 text-sm leading-6 text-[#d9e8e1]">Choose a scene and stay for a few unhurried minutes.</p></div><div className="timer-display" aria-live="polite">{sessionStarted ? timerDisplay : `${String(minutes).padStart(2, "0")}:00`}</div></div>
                <div className="scene-tabs mt-8" role="group" aria-label="Cozy scene">{cozyScenes.map((item) => <button key={item} type="button" onClick={() => { setScene(item); resetCozy(); }} className={scene === item ? "is-active" : ""}>{item}</button>)}</div>
                <div className="mt-7"><div className="mb-3 flex justify-between text-sm font-bold text-[#e7f0eb]"><label htmlFor="session-minutes">Session length</label><span>{minutes} min</span></div><input id="session-minutes" type="range" min="1" max="15" value={minutes} disabled={sessionStarted} onChange={(event) => setMinutes(Number(event.target.value))} className="cozy-range" /></div>
                <div className="mt-7 flex flex-wrap gap-3"><button type="button" onClick={timerRunning ? () => setTimerRunning(false) : startCozy} className="button button-light">{timerRunning ? <Pause size={18} /> : <Play size={18} />}{timerRunning ? "Pause" : sessionStarted ? "Resume" : "Start session"}</button>{sessionStarted && <button type="button" onClick={resetCozy} className="icon-button icon-button-dark" title="Reset timer" aria-label="Reset timer"><TimerReset size={19} /></button>}<button type="button" disabled={!sessionStarted} onClick={completeCozy} className="button button-outline-light"><Check size={18} /> Complete</button></div>
              </div>
            </article>

            <article id="rescue" className="rescue-panel scroll-mt-24">
              <div className="flex items-start justify-between gap-4"><div><p className="eyebrow"><BookHeart size={15} /> Bad day rescue</p><h2 className="mt-4 text-3xl font-black text-[#3c3340]">One step at a time.</h2></div><span className="step-count">{rescueStep + 1}/{rescueSteps.length}</span></div>
              <div className="rescue-step"><span>{String(rescueStep + 1).padStart(2, "0")}</span><p>{rescueSteps[rescueStep]}</p></div>
              <div className="step-dots" aria-hidden="true">{rescueSteps.map((_, index) => <span key={index} className={index <= rescueStep ? "is-active" : ""} />)}</div>
              <div className="mt-7 flex items-center justify-between gap-3"><button type="button" disabled={rescueStep === 0} onClick={() => setRescueStep((current) => current - 1)} className="icon-button" title="Previous step" aria-label="Previous step"><ChevronLeft size={20} /></button>{rescueStep < rescueSteps.length - 1 ? <button type="button" onClick={() => setRescueStep((current) => current + 1)} className="button button-rescue">Next step <ChevronRight size={18} /></button> : <button type="button" onClick={completeRescue} className="button button-rescue"><Check size={18} /> Finish rescue</button>}</div>
            </article>
          </div>
        </section>
      </div>

      <footer className="border-t border-[#dedbd7] bg-[#f1f3ed]"><div className="mx-auto grid max-w-[1380px] gap-6 px-4 py-8 sm:px-6 md:grid-cols-[1fr_auto] md:items-center lg:px-8"><div><div className="brand-lockup"><span className="brand-mark"><Leaf size={18} /></span><span>ChillBerry</span></div><p className="mt-2 text-sm text-[#6e746e]">Small moments make a kinder day.</p></div><div className="grid grid-cols-3 gap-7 text-right"><MiniStat value={progress.completedJoys.length} label="Joys" /><MiniStat value={progress.stressPops.length} label="Released" /><MiniStat value={progress.unlocks.length} label="Rewards" /></div></div></footer>
    </main>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return <div className="max-w-3xl"><p className="label text-[#a82e59]">{eyebrow}</p><h2 className="mt-3 text-3xl font-black text-[#302c31] sm:text-4xl">{title}</h2><p className="mt-3 max-w-2xl leading-7 text-[#716a70]">{description}</p></div>;
}
function Stat({ value, label, icon: Icon, color }) {
  return <div className="stat-item"><Icon size={17} style={{ color }} /><div><strong>{value}</strong><span>{label}</span></div></div>;
}
function MiniStat({ value, label }) {
  return <div><strong className="block text-2xl font-black text-[#334c3f]">{value}</strong><span className="text-xs font-bold uppercase text-[#788078]">{label}</span></div>;
}
function CardHeader({ icon: Icon, title, meta, tone }) {
  return <header className="card-header"><span className={`card-icon tone-${tone}`}><Icon size={19} /></span><div><h3>{title}</h3><p>{meta}</p></div></header>;
}
function ProgressBar({ value, color }) {
  return <div className="progress-track"><div style={{ width: `${value}%`, backgroundColor: color }} /></div>;
}
function Meter({ label, value, color }) {
  return <div><div className="mb-1.5 flex items-center justify-between text-xs font-bold text-[#716b6e]"><span>{label}</span><span>{value}%</span></div><ProgressBar value={value} color={color} /></div>;
}

export default Home;
