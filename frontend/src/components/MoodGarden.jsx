import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Flower2, Hand, Leaf, Pause, Play, RotateCcw, Sparkles, Sun } from 'lucide-react';
import './MoodGarden.css';

const HappyTreeScene = lazy(() => import('./HappyTreeScene'));
const happyPreview = '/models/mood-trees/happy_preview.png';
const pageSize = 6;
const dateLabel = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'A saved moment' : date.toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
};

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function HappyViewer() {
  const stage = useRef();
  const [ready, setReady] = useState(false);
  const [lost, setLost] = useState(false);
  const [retry, setRetry] = useState(0);
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [active, setActive] = useState(true);
  const [angle, setAngle] = useState(0);
  const [reset, setReset] = useState(0);
  const onReady = useCallback(() => setReady(true), []);
  const onLost = useCallback(() => { setLost(true); setReady(false); }, []);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setPaused(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    let inView = true;
    const sync = () => setActive(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); });
    observer.observe(stage.current);
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, []);
  const fallback = <div className="mg-scene-fallback">
    <img src={happyPreview} alt="Golden Happy tree with white daisies and a glowing heart" />
    <p>Showing a preview. The interactive view couldn’t load.</p>
    <button type="button" onClick={() => { setLost(false); setReady(false); setRetry((n) => n + 1); }}>Try again</button>
  </div>;
  return <div className="mg-viewer">
    <div className="mg-stage" ref={stage}>
      <span className="mg-orb mg-orb-one" aria-hidden="true" /><span className="mg-orb mg-orb-two" aria-hidden="true" />
      <SceneBoundary key={retry} fallback={fallback}>
        {lost ? fallback : <>
          {!ready && <div className="mg-loading" role="status"><img src={happyPreview} alt="" /><span>Growing your view…</span></div>}
          <Suspense fallback={null}>
            <HappyTreeScene paused={paused} active={active} angle={angle} reset={reset} onReady={onReady} onLost={onLost} />
          </Suspense>
        </>}
      </SceneBoundary>
    </div>
    <div className="mg-viewer-tools">
      <span><Hand size={14} /> Drag gently to explore</span>
      <div role="group" aria-label="Tree view controls">
        <button type="button" aria-label="Rotate tree left" disabled={!ready} onClick={() => setAngle((a) => Math.max(-.8, a - .2))}><ChevronLeft size={17} /></button>
        <button type="button" aria-label={paused ? 'Play tree animation' : 'Pause tree animation'} aria-pressed={paused} disabled={!ready} onClick={() => setPaused((p) => !p)}>{paused ? <Play size={15} /> : <Pause size={15} />}</button>
        <button type="button" aria-label="Reset tree view" disabled={!ready} onClick={() => { setAngle(0); setReset((n) => n + 1); }}><RotateCcw size={15} /></button>
        <button type="button" aria-label="Rotate tree right" disabled={!ready} onClick={() => setAngle((a) => Math.min(.8, a + .2))}><ChevronRight size={17} /></button>
      </div>
    </div>
  </div>;
}

export default function MoodGarden({ garden, moods, images }) {
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [celebrate, setCelebrate] = useState(0);
  const detail = useRef();
  const entries = useMemo(() => garden.map((item, index) => ({
    ...item, id: `${item._id || item.plantedAt || item.createdAt || item.date || 'memory'}-${index}`,
  })).sort((a, b) => (Date.parse(b.plantedAt || b.createdAt || b.date) || 0) - (Date.parse(a.plantedAt || a.createdAt || a.date) || 0)), [garden]);
  const selected = entries.find((entry) => entry.id === selectedId);
  const mood = moods.find((m) => m.id === selected?.mood) || moods[0];
  const happy = !selected || selected.mood === 'happy';
  const filtered = entries.filter((entry) => filter === 'all' || entry.mood === filter);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const visible = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const select = (id) => {
    setSelectedId(id);
    setCelebrate(0);
    detail.current?.focus({ preventScroll: true });
    detail.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  };
  return <div className="mg-garden">
    <section className="mg-spotlight" aria-label="Explore your mood tree">
      <div className="mg-scene-column">
        <div className="mg-scene-heading"><span><span className="mg-status-dot" /> A little place to exhale</span><Sun size={20} /></div>
        {happy ? <HappyViewer /> : <div className="mg-still-stage"><img src={images[selected.mood] || images.calm} alt={`${mood.label} mood tree`} /><span><Leaf size={14} /> Every feeling has a place here</span></div>}
      </div>
      <div className="mg-story" ref={detail} tabIndex={-1} aria-live="polite" aria-atomic="true">
        <p className="mg-eyebrow"><Sparkles size={15} /> {selected ? 'A moment in your garden' : 'Meet your sunshine tree'}</p>
        <span className="mg-mood-pill" style={{ '--mood-tone': happy ? '#c88b14' : mood.color }}>{happy ? <Sun size={14} /> : <Leaf size={14} />}{happy ? 'Happy' : mood.label}</span>
        <h2>{happy ? 'A little joy,\na little growth.' : 'This feeling\nbelongs here.'}</h2>
        <p className="mg-story-copy">{selected ? mood.suggestion : 'Golden leaves, tiny daisies, and a warm little heart. Take a breath and spend a moment with Happy.'}</p>
        <div className="mg-story-note"><Flower2 size={22} /><div><strong>{selected ? selected.plant || mood.plant : 'Small joys take root.'}</strong><span>{selected ? `Planted ${dateLabel(selected.date || selected.plantedAt || selected.createdAt)}` : 'A Happy check-in adds this tree to your memories.'}</span></div></div>
        <div className="mg-story-actions">
          <Link className="mg-primary" to="/today">Plant a feeling <ArrowRight size={16} /></Link>
          {selected ? <button className="mg-secondary" type="button" onClick={() => { setSelectedId(null); setCelebrate(0); }}>Meet Happy <Sun size={15} /></button> :
            <button className="mg-secondary" type="button" onClick={() => setCelebrate((n) => n + 1)}>A little encouragement <HeartIcon /></button>}
        </div>
        {celebrate > 0 && <p key={celebrate} className="mg-encouragement" role="status">{['There is room for a little joy today.', 'You don’t have to bloom all at once.', 'Small steps are still growth.'][(celebrate - 1) % 3]}</p>}
        <p className="mg-footer-note"><Leaf size={13} /> Grow at your own pace.</p>
      </div>
    </section>

    <section className="mg-memories" aria-labelledby="mg-memories-title">
      <div className="mg-memory-heading"><div><p className="mg-eyebrow">Your feelings, gently rooted</p><h2 id="mg-memories-title">Little moments. Living memories.</h2></div><span className="mg-count"><Leaf size={14} />{entries.length} {entries.length === 1 ? 'tree' : 'trees'} planted</span></div>
      <div className="mg-filters" role="group" aria-label="Filter garden by mood">
        {[{ id: 'all', label: 'All feelings' }, ...moods].map((m) => <button type="button" key={m.id} aria-pressed={filter === m.id} onClick={() => { setFilter(m.id); setPage(0); }}>{m.label}<span>{m.id === 'all' ? entries.length : entries.filter((e) => e.mood === m.id).length}</span></button>)}
      </div>
      {visible.length > 0 ? <div className="mg-memory-grid">
        {visible.map((entry) => {
          const meta = moods.find((m) => m.id === entry.mood);
          return <button className="mg-memory-card" type="button" key={entry.id} aria-pressed={selectedId === entry.id} onClick={() => select(entry.id)} style={{ '--memory-tone': meta?.color || '#68b889' }} aria-label={`Explore ${meta?.label || entry.label || 'mood'} tree planted ${dateLabel(entry.date || entry.plantedAt || entry.createdAt)}`}>
            <span className="mg-card-mood"><i />{meta?.label || entry.label || 'A feeling'}</span>
            <span className="mg-card-art"><img src={entry.mood === 'happy' ? happyPreview : images[entry.mood] || images.calm} alt="" loading="lazy" /></span>
            <span className="mg-card-bottom"><span><strong>{entry.plant || meta?.plant || 'Mood tree'}</strong><time>{dateLabel(entry.date || entry.plantedAt || entry.createdAt)}</time></span><span className="mg-card-arrow"><ArrowRight size={16} /></span></span>
          </button>;
        })}
      </div> : <div className="mg-empty"><Flower2 size={32} /><h3>{entries.length ? 'A little space for this feeling.' : 'Your first memory starts with you.'}</h3><p>{entries.length ? 'No trees for this mood yet. Every feeling is welcome.' : 'Check in with yourself today and watch your garden begin.'}</p><Link to="/today">Plant your next feeling <ArrowRight size={15} /></Link></div>}
      <div className="mg-pagination"><p aria-live="polite">{filtered.length ? `${currentPage * pageSize + 1}–${Math.min((currentPage + 1) * pageSize, filtered.length)} of ${filtered.length} memories` : 'A fresh patch, full of possibility.'}</p>{pages > 1 && <div><button type="button" aria-label="Previous memories" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={18} /></button><span>{currentPage + 1} / {pages}</span><button type="button" aria-label="Next memories" disabled={currentPage === pages - 1} onClick={() => setPage(currentPage + 1)}><ChevronRight size={18} /></button></div>}</div>
    </section>
  </div>;
}

function HeartIcon() { return <span aria-hidden="true">♡</span>; }
