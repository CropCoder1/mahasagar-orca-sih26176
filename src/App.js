import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Anchor,
  Bell,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CloudRain,
  Compass,
  Eye,
  Fish,
  HeartPulse,
  Info,
  LifeBuoy,
  LocateFixed,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Mic,
  Moon,
  Navigation,
  Pencil,
  PhoneCall,
  Radio,
  Save,
  Send,
  Settings,
  ShieldCheck,
  Siren,
  Sparkles,
  Sun,
  UserPlus,
  Waves,
  Wind,
  X,
  Zap
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  alerts,
  answers,
  forecast,
  pfzZones,
  questions,
  safetyFactors,
  vessels
} from './data/mockData';
import { copy, languages } from './data/i18n';
import { useAuth } from './context/AuthContext';
import AgentPipeline from './components/AgentPipeline';
import MapExplorer from './components/MapExplorer';
import 'leaflet/dist/leaflet.css';
import './App.css';

const navItems = [
  ['home', 'Home', Compass],
  ['map', 'PFZ map', Navigation],
  ['alerts', 'Alerts', Bell],
  ['sos', 'SOS help', Siren],
  ['profile', 'Profile', Settings]
];

const formatLiveDate = () =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
    .format(new Date())
    .toUpperCase()
    .replace(',', ' ·');

const timeGreeting = (labels) => {
  const hour = new Date().getHours();
  if (labels && labels.hello) return labels.hello;
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
};

// Animated count-up component for numbers on load (Item A.10)
function AnimatedCounter({ target, decimals = 0, suffix = '' }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const duration = 1200;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(ease * target);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [target]);

  return (
    <span>
      {decimals > 0 ? value.toFixed(decimals) : Math.round(value)}
      {suffix}
    </span>
  );
}

function Icon({ name, size = 20 }) {
  const icons = { wind: Wind, waves: Waves, zap: Zap };
  const Component = icons[name] || Info;
  return <Component size={size} strokeWidth={2.3} />;
}

function StatusPill({ tone = 'safe', children }) {
  return (
    <span className={`status-pill ${tone}`}>
      <span className="status-dot" />
      {children}
    </span>
  );
}

function MiniChart({ data = forecast, dataKey = 'wave', color = '#22D3EE' }) {
  return (
    <div className="mini-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity=".42" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" hide />
          <Tooltip contentStyle={{ background: '#0B3D5C', border: 0, borderRadius: 10, color: '#fff' }} />
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} fill={`url(#fill-${dataKey})`} isAnimationActive />
        </AreaChart>
      </ResponsiveContainer>
      <span className="chart-label">Wave and wind trend · next 24 hours</span>
    </div>
  );
}

function TrendChart() {
  return (
    <div className="trend-card">
      <div className="card-heading">
        <span><Waves size={18} /> Sea trend ahead</span>
        <span className="updated">Next 24 hours</span>
      </div>
      <div className="trend-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={forecast}>
            <CartesianGrid stroke="#e6f0f2" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#78909c' }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="wave" hide domain={[0, 3]} />
            <YAxis yAxisId="wind" hide domain={[0, 30]} />
            <Line yAxisId="wave" type="monotone" dataKey="wave" stroke="#0E7490" strokeWidth={3} dot={false} isAnimationActive />
            <Line yAxisId="wind" type="monotone" dataKey="wind" stroke="#FBBF24" strokeWidth={2} dot={false} isAnimationActive strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="trend-key">
        <span><i className="teal-key" /> Waves (m)</span>
        <span><i className="amber-key" /> Wind (km/h)</span>
        <b>Return before 4 PM</b>
      </div>
    </div>
  );
}

function FactorBreakdown() {
  const icons = { wind: Wind, waves: Waves, weather: CloudRain, storm: Zap, tide: Compass };
  return (
    <div className="factor-breakdown">
      {safetyFactors.map((factor) => {
        const FactorIcon = icons[factor.icon] || Info;
        return (
          <div className={`factor ${factor.tone}`} key={factor.label}>
            <FactorIcon size={17} />
            <span>
              <strong>{factor.label}</strong>
              <small>{factor.value}</small>
              <em>{factor.status} {factor.tone === 'safe' ? '✓' : '⚠'}</em>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function VerdictCard({ labels, language }) {
  const [listening, setListening] = useState(false);
  const verdict = labels?.verdictSafe || 'SAFE TO GO';
  const reason = labels?.verdictReason || 'Winds are calm and no alerts are active near you. Return before waves build after 4 PM.';

  const listen = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${verdict}. ${reason}`);
    const activeLang = languages.find((l) => l.code === language);
    if (activeLang && activeLang.speechLang) {
      utterance.lang = activeLang.speechLang;
    }
    utterance.onend = () => setListening(false);
    setListening(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <motion.section className="verdict-card" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} layout>
      <div className="verdict-main">
        <motion.div className="verdict-icon" animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2.2, repeat: Infinity }}>
          <ShieldCheck size={33} />
        </motion.div>
        <div>
          <span className="eyebrow">{labels?.verdictTitle || "Today's fishing verdict"}</span>
          <motion.h2 layout>{verdict}</motion.h2>
          <p>{reason}</p>
        </div>
        <button className="listen-button" onClick={listen} aria-label="Listen to today's fishing verdict" type="button">
          🔊 {listening ? 'Playing' : 'Listen'}
        </button>
      </div>
      <FactorBreakdown />
    </motion.section>
  );
}

function AlertSparkline({ alert }) {
  const data = forecast.map((item, index) => ({
    day: item.day,
    value: alert.severity === 'critical' ? item.wind : alert.icon === 'waves' ? item.wave : [20, 25, 15, 30, 12][index]
  }));
  return (
    <div className="alert-sparkline">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke={alert.severity === 'critical' ? '#E45757' : '#D58C00'} strokeWidth={2.5} dot={false} isAnimationActive />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function AgentActivity({ active, onToggle, labels }) {
  return <AgentPipeline open={active} onToggle={onToggle} labels={labels} />;
}

function AlertCard({ alert }) {
  return (
    <motion.div className={`alert-card ${alert.severity}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="alert-icon">
        <Icon name={alert.icon} />
      </div>
      <div className="alert-copy">
        <span className="eyebrow">{alert.type}</span>
        <h3>{alert.title}</h3>
        <p>{alert.detail}</p>
        <small>{alert.time}</small>
      </div>
      <AlertSparkline alert={alert} />
      <ChevronRight className="alert-arrow" />
    </motion.div>
  );
}

function AgentRadialAnalyzer({ compact = false }) {
  const metrics = [
    { id: 'satellite', name: 'Satellite & GIS Sensors', score: 100, agents: 'Oceansat-3 · SAR Radar', color: '#06B6D4', stroke: '#22D3EE' },
    { id: 'ocean', name: 'Wave & Swell Physics', score: 94, agents: 'INCOIS Wave Model · Tide', color: '#059669', stroke: '#10B981' },
    { id: 'fish', name: 'Fish Shoal & PFZ Density', score: 88, agents: 'Chlorophyll · Thermal Front', color: '#D97706', stroke: '#F59E0B' },
    { id: 'weather', name: 'Atmospheric & Cyclone Vector', score: 92, agents: 'IMD Doppler · Wind Matrix', color: '#7C3AED', stroke: '#8B5CF6' }
  ];

  const rings = [
    { radius: 82, circ: 2 * Math.PI * 82, score: 100, color: 'url(#grad-cyan)' },
    { radius: 68, circ: 2 * Math.PI * 68, score: 94, color: 'url(#grad-emerald)' },
    { radius: 54, circ: 2 * Math.PI * 54, score: 88, color: 'url(#grad-amber)' },
    { radius: 40, circ: 2 * Math.PI * 40, score: 92, color: 'url(#grad-purple)' }
  ];

  return (
    <div className={`agent-radial-card ${compact ? 'compact' : ''}`}>
      <div className="radial-header">
        <div>
          <span className="eyebrow" style={{ color: '#0E7490' }}>NEURAL AGENT CONSENSUS</span>
          <h3>10-Agent Intelligence</h3>
        </div>
        <div className="agent-status-tag">
          <span className="live-dot" /> 10/10 Online
        </div>
      </div>

      <div className="radial-body">
        <div className="radial-chart-container">
          <svg className="radial-svg" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="grad-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#22D3EE" />
              </linearGradient>
              <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>
              <linearGradient id="grad-amber" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#FBBF24" />
              </linearGradient>
              <linearGradient id="grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#A78BFA" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {rings.map((r, i) => (
              <circle
                key={`bg-${i}`}
                cx="100"
                cy="100"
                r={r.radius}
                fill="none"
                stroke="#e2eef2"
                strokeWidth="7"
                opacity="0.45"
              />
            ))}

            {rings.map((r, i) => {
              const strokeLength = (r.circ * r.score) / 100;
              return (
                <circle
                  key={`ring-${i}`}
                  cx="100"
                  cy="100"
                  r={r.radius}
                  fill="none"
                  stroke={r.color}
                  strokeWidth="7.5"
                  strokeLinecap="round"
                  strokeDasharray={`${strokeLength} ${r.circ}`}
                  strokeDashoffset={r.circ * 0.25}
                  transform="rotate(-90 100 100)"
                  filter="url(#glow)"
                  className="animated-radial-ring"
                />
              );
            })}

            <circle cx="100" cy="100" r="28" fill="#ffffff" filter="drop-shadow(0 3px 8px rgba(11,61,92,0.14))" />
            <text x="100" y="98" textAnchor="middle" fill="#0B3D5C" fontSize="16" fontWeight="800" fontFamily="Manrope, sans-serif">
              96%
            </text>
            <text x="100" y="110" textAnchor="middle" fill="#0E7490" fontSize="7" fontWeight="800" letterSpacing="0.08em">
              AI READY
            </text>
          </svg>
        </div>

        <div className="radial-metrics-list">
          {metrics.map((m) => (
            <div key={m.id} className="radial-metric-row">
              <span className="metric-indicator" style={{ background: m.stroke }} />
              <div className="metric-info">
                <strong>{m.name}</strong>
                <small>{m.agents}</small>
              </div>
              <div className="metric-score" style={{ color: m.color }}>
                {m.score}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SosFlow({ onClose, labels }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setStep((value) => Math.min(value + 1, 3)), 2200);
    return () => clearTimeout(timer);
  }, [step]);

  const steps = [
    'Capturing your location...',
    'Alerting nearby vessels & Coast Guard...',
    'Rescue route calculated',
    'Help is on the way'
  ];

  return (
    <motion.div className="sos-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="sos-panel">
        <button className="close-button" onClick={onClose} aria-label="Close SOS" type="button">
          <X />
        </button>
        <div className="sos-symbol">
          <Siren size={34} />
        </div>
        <span className="eyebrow coral-text">Emergency assistance</span>
        <h2>{steps[step]}</h2>
        <p className="sos-coords">GPS {step > 0 ? '9.9312 N · 76.2673 E' : 'Locating...'}</p>
        <div className="progress-steps">
          {steps.map((item, index) => (
            <span key={item} className={index <= step ? 'done' : ''} />
          ))}
        </div>
        {step === 3 ? (
          <>
            <div className="eta">
              <HeartPulse size={22} /> ETA <strong>14 minutes</strong>
            </div>
            <button className="cancel-button" onClick={onClose} type="button">
              {labels.cancel}
            </button>
          </>
        ) : (
          <div className="sos-wait">
            <span className="spinner" /> Please keep this screen open
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AuthScreen({ darkMode, onToggleTheme }) {
  const { register, login } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (mode === 'register') {
      const trimmedName = name.trim();
      const trimmedPhone = phone.trim();
      if (!trimmedName) {
        setError('Please enter your name.');
        return;
      }
      if (!trimmedPhone) {
        setError('Please enter your mobile number.');
        return;
      }
      if (!password) {
        setError('Please enter a password.');
        return;
      }

      register(trimmedName, trimmedPhone, password);

      setMode('login');
      setPhone(trimmedPhone);
      setPassword('');
      setName('');
      setMessage('Account created — please log in.');
      return;
    }

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setError('Please enter your mobile number.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    const result = login(trimmedPhone, password);
    if (!result.success) {
      setError(result.error || 'Mobile number or password is incorrect.');
    }
  };

  const switchMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setError('');
    setMessage('');
  };

  return (
    <div className="auth-screen">
      <div className="auth-top">
        <button className="theme-toggle" onClick={onToggleTheme} type="button">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          {darkMode ? 'Bright mode' : 'Dark mode'}
        </button>
      </div>
      <motion.div className="auth-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <motion.img
          className="auth-logo-image"
          src="/bluemind-logo.jpg"
          alt="BlueMind Agent - ORCA marine intelligence"
          animate={{ y: [0, -7, 0], rotate: [0, 1.5, 0, -1.5, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <p className="auth-kicker">ORCA MARINE INTELLIGENCE</p>
        <h1>{mode === 'login' ? 'Welcome back, sailor' : 'Create your fishing profile'}</h1>
        <p>
          {mode === 'login'
            ? 'Log in to access your sea conditions, safe zones, and emergency support.'
            : 'Get clear sea conditions, safe zones and emergency support in one place.'}
        </p>

        {message && (
          <div className="auth-message success" role="status">
            <CheckCircle2 size={16} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="auth-message error" role="alert">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit}>
          {mode === 'register' && (
            <label>
              Your name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                autoFocus={mode === 'register'}
              />
            </label>
          )}
          <label>
            Mobile number
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your mobile number"
              autoFocus={mode === 'login'}
            />
          </label>
          <label>
            Password
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </label>
          <button className="auth-submit" type="submit">
            {mode === 'login' ? (
              <>
                <LogIn size={17} /> Log in
              </>
            ) : (
              <>
                <UserPlus size={17} /> Register
              </>
            )}
          </button>
        </form>

        <button className="auth-switch" onClick={switchMode} type="button">
          {mode === 'login' ? 'New here? Create an account' : 'Already registered? Log in'}
        </button>
      </motion.div>
    </div>
  );
}

function Home({
  labels,
  language,
  answer,
  agentsOpen,
  setAgentsOpen,
  sourcesOpen,
  setSourcesOpen,
  ask,
  query,
  setQuery,
  setPage
}) {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(
    () => window.localStorage.getItem('orca-onboarded') !== 'true'
  );

  const dismissOnboarding = () => {
    window.localStorage.setItem('orca-onboarded', 'true');
    setShowOnboarding(false);
  };

  return (
    <div className="page home-page">
      {/* Onboarding Tour Banner for First-Time Users (Item G.1) */}
      {showOnboarding && (
        <motion.div className="onboarding-banner" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Sparkles size={24} className="sparkle" />
          <div>
            <strong>{labels?.onboardingTitle || 'Welcome to MAHASAGAR · ORCA'}</strong>
            <p>{labels?.onboardingDesc || '1. Check the daily fishing verdict. 2. Explore safe PFZ zones. 3. Emergency SOS is always ready.'}</p>
          </div>
          <button className="onboarding-dismiss" onClick={dismissOnboarding} type="button">
            {labels?.gotIt || 'Got it, start fishing'}
          </button>
        </motion.div>
      )}

      <div className="page-intro">
        <div>
          <span className="eyebrow">{formatLiveDate()}</span>
          <h1>
            {timeGreeting(labels)}, {user?.name} <span>⌁</span>
          </h1>
          <p>Let&apos;s make today&apos;s trip a safe one.</p>
        </div>
        <div className="safety-status">
          <div className="status-icon">
            <ShieldCheck size={23} />
          </div>
          <div>
            <small>{labels.today}</small>
            <strong>{labels.safe}</strong>
          </div>
          <span className="status-pulse" />
        </div>
      </div>

      <VerdictCard labels={labels} language={language} />

      <div className="dashboard-grid">
        <div className="chat-column">
          <section className="ask-card">
            <div className="ask-title">
              <div className="orca-avatar">
                <Bot size={23} />
              </div>
              <div>
                <strong>{labels.ask}</strong>
                <small>Weather, fishing zones, safety & more</small>
              </div>
              <Sparkles size={17} className="sparkle" />
            </div>
            <div className="question-chips">
              {questions.map((question) => (
                <button key={question} onClick={() => ask(question)} type="button">
                  {question}
                </button>
              ))}
            </div>
            <form
              className="question-form"
              onSubmit={(event) => {
                event.preventDefault();
                ask();
              }}
            >
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={labels.placeholder}
              />
              <button type="button" className="mic-button" aria-label="Voice input">
                <Mic size={20} />
              </button>
              <button type="submit" className="send-button" aria-label="Send question">
                <Send size={18} />
              </button>
            </form>
          </section>

          <AgentActivity active={agentsOpen} onToggle={() => setAgentsOpen((value) => !value)} labels={labels} />

          <motion.section className="answer-card report-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="answer-header">
              <div className="orca-avatar small">
                <Bot size={18} />
              </div>
              <div>
                <strong>ORCA report</strong>
                <small>Ready now · Kochi waters</small>
              </div>
              <StatusPill>
                <CheckCircle2 size={13} /> Safe
              </StatusPill>
            </div>
            <p>{answer.text}</p>
            <div className="answer-stat">
              <div>
                <span>{answer.title}</span>
                <strong>{answer.value}</strong>
              </div>
              {answer.chart ? (
                <MiniChart />
              ) : (
                <div className="answer-visual">
                  <div className="rings">
                    <Fish size={22} />
                  </div>
                  <small>Local conditions</small>
                </div>
              )}
            </div>
            <button className="why-button" onClick={() => setSourcesOpen((value) => !value)} type="button">
              <CircleHelp size={17} />
              Why this answer?
              <ChevronDown size={16} className={sourcesOpen ? 'rotate' : ''} />
            </button>
            <AnimatePresence>
              {sourcesOpen && (
                <motion.div
                  className="sources"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <strong>Data used</strong>
                  <FactorBreakdown />
                  <span>Weather forecast · IMD mock · updated 35 min ago</span>
                  <span>SST & chlorophyll · INCOIS mock · updated 3 hours ago</span>
                  <span>Safety zones · Coast Guard mock · updated 1 hour ago</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        </div>

        <div className="right-column">
          <section className="today-card">
            <div className="card-heading">
              <span><CloudRain size={19} /> {labels.conditionsNow || 'Conditions now'}</span>
              <span className="updated">Updated 10 min ago</span>
            </div>
            <div className="conditions">
              <div>
                <strong>
                  <AnimatedCounter target={29} suffix="°" />
                </strong>
                <span>Partly cloudy</span>
              </div>
              <div className="condition">
                <Waves size={18} />
                <strong>
                  <AnimatedCounter target={1.1} decimals={1} suffix=" m" />
                </strong>
                <span>Waves</span>
              </div>
              <div className="condition">
                <Wind size={18} />
                <strong>
                  <AnimatedCounter target={13} suffix=" km/h" />
                </strong>
                <span>Wind</span>
              </div>
            </div>
            <div className="forecast-row">
              {forecast.slice(0, 4).map((item) => (
                <div key={item.day}>
                  <span>{item.day}</span>
                  <CloudRain size={18} />
                  <strong>{item.temp}°</strong>
                </div>
              ))}
            </div>
          </section>

          <AgentRadialAnalyzer />

          <TrendChart />

          <section className="alerts-preview">
            <div className="card-heading">
              <span><Bell size={19} /> {labels.activeAlerts || 'Active alerts'}</span>
              <button onClick={() => setPage('alerts')} type="button">
                {labels.seeAll} <ChevronRight size={15} />
              </button>
            </div>
            <AlertCard alert={alerts[0]} />
          </section>
        </div>
      </div>
    </div>
  );
}

function MapPage({ labels }) {
  const [safeRouteActive, setSafeRouteActive] = useState(false);
  return (
    <div className="page">
      <div className="section-title">
        <div>
          <span className="eyebrow">MARINE EXPLORER</span>
          <h1>{labels.map}</h1>
          <p>Find the best fishing zones around you.</p>
        </div>
        {safeRouteActive && <StatusPill tone="safe">Safe route ready</StatusPill>}
      </div>
      <MapExplorer labels={labels} onRouteStateChange={setSafeRouteActive} />
    </div>
  );
}

function AlertsPage({ labels }) {
  return (
    <div className="page">
      <div className="section-title">
        <div>
          <span className="eyebrow">STAY AWARE</span>
          <h1>{labels.alerts}</h1>
          <p>Simple warnings to help you return safely.</p>
        </div>
        <span className="alert-count">3 active</span>
      </div>
      <AgentRadialAnalyzer compact />
      <div className="alerts-list">
        {alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
}

function SosPage({ labels, onOpen, user }) {
  const emergencyPhone =
    typeof user?.emergencyContact === 'object'
      ? user.emergencyContact.phone
      : user?.emergencyContact || '+91 98765 43210';

  const contactName =
    typeof user?.emergencyContact === 'object'
      ? user.emergencyContact.name
      : 'Trusted Contact';

  return (
    <div className="page sos-page">
      <div className="sos-copy">
        <span className="eyebrow coral-text">EMERGENCY SUPPORT</span>
        <h1>{labels.sos}</h1>
        <p>One tap shares your location with nearby vessels and the Coast Guard demo network.</p>
      </div>

      <motion.button className="big-sos" onClick={onOpen} whileTap={{ scale: 0.94 }} type="button">
        <span><Siren size={48} /></span>
        <strong>SOS</strong>
        <small>Tap for emergency help</small>
      </motion.button>

      {/* Quick-Dial Buttons for Emergency Contact & Coast Guard (Item G.4) */}
      <div className="sos-dial-box">
        <a href={`tel:${emergencyPhone}`} className="quick-dial-card family">
          <PhoneCall size={22} />
          <div>
            <small>{labels.callContact || 'Call Emergency Contact'}</small>
            <strong>{contactName} · {emergencyPhone}</strong>
          </div>
        </a>

        <a href="tel:1554" className="quick-dial-card coastguard">
          <Radio size={22} />
          <div>
            <small>{labels.callCoastGuard || 'Indian Coast Guard SAR Toll-Free'}</small>
            <strong>1554 (Emergency Marine SAR)</strong>
          </div>
        </a>
      </div>

      <div className="sos-note">
        <ShieldCheck size={21} />
        <span>
          <strong>Your location stays private</strong>
          <small>It is only shared when you press SOS or connect to emergency rescue.</small>
        </span>
      </div>
    </div>
  );
}

function ProfilePage({ labels, language, setLanguage, darkMode, onToggleTheme, highVis, toggleHighVis }) {
  const { user, updateUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    name: user?.name || '',
    hometown: user?.nativePlace || 'Alappuzha, Kerala',
    residence: user?.currentResidence || 'Fort Kochi, Ernakulam',
    emergency:
      typeof user?.emergencyContact === 'object'
        ? `${user?.emergencyContact?.name || ''} · ${user?.emergencyContact?.phone || ''}`
        : user?.emergencyContact || 'Family Contact · +91 98765 43210',
    boatReg: user?.boat?.regNo || 'KL-07-M-221',
    boatName: user?.boat?.name || 'Ocean Star'
  });

  useEffect(() => {
    if (!editing && user) {
      setDraft({
        name: user.name || '',
        hometown: user.nativePlace || 'Alappuzha, Kerala',
        residence: user.currentResidence || 'Fort Kochi, Ernakulam',
        emergency:
          typeof user.emergencyContact === 'object'
            ? `${user.emergencyContact.name || ''} · ${user.emergencyContact.phone || ''}`
            : user.emergencyContact || 'Family Contact · +91 98765 43210',
        boatReg: user?.boat?.regNo || 'KL-07-M-221',
        boatName: user?.boat?.name || 'Ocean Star'
      });
    }
  }, [user, editing]);

  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  const save = () => {
    updateUser({
      name: draft.name.trim() || user?.name,
      nativePlace: draft.hometown,
      currentResidence: draft.residence,
      emergencyContact: draft.emergency,
      boat: { regNo: draft.boatReg, name: draft.boatName }
    });
    setEditing(false);
  };

  const cancel = () => {
    setDraft({
      name: user?.name || '',
      hometown: user?.nativePlace || 'Alappuzha, Kerala',
      residence: user?.currentResidence || 'Fort Kochi, Ernakulam',
      emergency:
        typeof user?.emergencyContact === 'object'
          ? `${user?.emergencyContact?.name || ''} · ${user?.emergencyContact?.phone || ''}`
          : user?.emergencyContact || 'Family Contact · +91 98765 43210',
      boatReg: user?.boat?.regNo || 'KL-07-M-221',
      boatName: user?.boat?.name || 'Ocean Star'
    });
    setEditing(false);
  };

  const avatar = user?.avatarInitials || user?.initials || 'U';

  return (
    <div className="page">
      <div className="section-title">
        <div>
          <span className="eyebrow">YOUR ACCOUNT</span>
          <h1>{labels.profile}</h1>
          <p>Your boat, language, and emergency details.</p>
        </div>
        <button className="edit-profile-button" onClick={() => setEditing((value) => !value)} type="button">
          {editing ? <X size={16} /> : <Pencil size={16} />}
          {editing ? 'Close edit' : 'Edit profile'}
        </button>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">{avatar}</div>
        <div>
          <h2>{user?.name}</h2>
          <p>
            {user?.role || 'Registered fisherman'} · {user?.currentResidence || draft.residence}
          </p>
        </div>
        <StatusPill>Verified</StatusPill>
      </div>

      <section className="emergency-card">
        <div className="setting-icon">
          <HeartPulse size={20} />
        </div>
        <div>
          <strong>Help us reach you and your family faster in an emergency</strong>
          <p>These details are used only for SOS support.</p>
        </div>
      </section>

      {/* Settings list with consistent tappable rows (Item D.3) */}
      <div className="settings-list">
        <div>
          <div className="setting-icon">
            <UserPlus size={20} />
          </div>
          <span>
            <strong>Full name</strong>
            <small>Name shown across your account</small>
          </span>
          {editing ? (
            <input
              aria-label="Full name"
              value={draft.name}
              onChange={(event) => update('name', event.target.value)}
            />
          ) : (
            <b className="saved-value">{user?.name}</b>
          )}
        </div>

        <div>
          <div className="setting-icon">
            <MapPin size={20} />
          </div>
          <span>
            <strong>Native place / hometown</strong>
            <small>Where your family can reach you</small>
          </span>
          {editing ? (
            <input
              aria-label="Native place or hometown"
              value={draft.hometown}
              onChange={(event) => update('hometown', event.target.value)}
            />
          ) : (
            <b className="saved-value">{user?.nativePlace || draft.hometown}</b>
          )}
        </div>

        <div>
          <div className="setting-icon">
            <LocateFixed size={20} />
          </div>
          <span>
            <strong>Current residence / village</strong>
            <small>Where you live now</small>
          </span>
          {editing ? (
            <input
              aria-label="Current residence or village"
              value={draft.residence}
              onChange={(event) => update('residence', event.target.value)}
            />
          ) : (
            <b className="saved-value">{user?.currentResidence || draft.residence}</b>
          )}
        </div>

        <div>
          <div className="setting-icon">
            <Radio size={20} />
          </div>
          <span>
            <strong>Emergency contact</strong>
            <small>Trusted family member or friend</small>
          </span>
          {editing ? (
            <input
              aria-label="Emergency contact name and phone"
              value={draft.emergency}
              onChange={(event) => update('emergency', event.target.value)}
            />
          ) : (
            <b className="saved-value">{typeof user?.emergencyContact === 'string' ? user?.emergencyContact : draft.emergency}</b>
          )}
        </div>

        <div>
          <div className="setting-icon">
            <Anchor size={20} />
          </div>
          <span>
            <strong>Boat details</strong>
            <small>Registration & vessel identity</small>
          </span>
          {editing ? (
            <input
              aria-label="Boat registration and name"
              value={`${draft.boatReg} · ${draft.boatName}`}
              onChange={(event) => {
                const parts = event.target.value.split('·').map((p) => p.trim());
                update('boatReg', parts[0] || '');
                update('boatName', parts[1] || '');
              }}
            />
          ) : (
            <b className="saved-value">{user?.boat?.regNo || draft.boatReg} · {user?.boat?.name || draft.boatName}</b>
          )}
        </div>

        {/* Multi-language Selector (Item G & User Request) */}
        <div>
          <div className="setting-icon">
            <Radio size={20} />
          </div>
          <span>
            <strong>Preferred language</strong>
            <small>5 coastal languages available</small>
          </span>
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label} ({l.short})
              </option>
            ))}
          </select>
        </div>

        {/* High Visibility / Large Text Accessibility Mode (Item G.3) */}
        <div>
          <div className="setting-icon">
            <Eye size={20} />
          </div>
          <span>
            <strong>{labels.highVisibility || 'High visibility / Large text'}</strong>
            <small>{highVis ? 'Large text active for sunlight readability' : 'Standard display text'}</small>
          </span>
          <button className="mode-switch" onClick={toggleHighVis} type="button">
            {highVis ? 'Disable' : 'Enable'}
          </button>
        </div>

        <div>
          <div className="setting-icon">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</div>
          <span>
            <strong>Display mode</strong>
            <small>{darkMode ? 'Dark mode is active' : 'Bright mode is active'}</small>
          </span>
          <button className="mode-switch" onClick={onToggleTheme} type="button">
            {darkMode ? 'Use bright' : 'Use dark'}
          </button>
        </div>

        <div>
          <div className="setting-icon">
            <Bell size={20} />
          </div>
          <span>
            <strong>Safety notifications</strong>
            <small>Critical alerts are always on</small>
          </span>
          <span className="toggle on">
            <i />
          </span>
        </div>
      </div>

      {editing && (
        <div className="profile-actions">
          <button className="cancel-profile" onClick={cancel} type="button">
            <X size={16} /> Cancel
          </button>
          <button className="save-profile" onClick={save} type="button">
            <Save size={16} /> Save changes
          </button>
        </div>
      )}

      {/* Past Trips Log (Item G.2) */}
      <div className="history-card">
        <div className="history-header">
          <strong>{labels.tripHistory || 'Recent Trip Log'}</strong>
          <small>GPS tracked trips</small>
        </div>
        <div className="history-list">
          <div className="history-item">
            <span><Anchor size={15} /> Kochi Harbour &rarr; Kochi South PFZ</span>
            <small>14 km · Safe · Yesterday</small>
          </div>
          <div className="history-item">
            <span><Anchor size={15} /> Kochi Harbour &rarr; Vypin Channel</span>
            <small>8 km · Safe · 3 days ago</small>
          </div>
          <div className="history-item">
            <span><Anchor size={15} /> Kochi Harbour &rarr; Chellanam Reef</span>
            <small>12 km · Safe · 5 days ago</small>
          </div>
        </div>
      </div>

      <button className="profile-logout" onClick={logout} type="button">
        <LogOut size={16} /> Log out
      </button>
    </div>
  );
}

function App() {
  const { user, isAuthenticated } = useAuth();
  const [language, setLanguage] = useState(() => window.localStorage.getItem('orca-lang') || 'en');
  const [page, setPage] = useState('home');
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState(answers['Show weather']);
  const [agentsOpen, setAgentsOpen] = useState(true);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(() => window.localStorage.getItem('orca-theme') === 'dark');
  const [highVis, setHighVis] = useState(() => window.localStorage.getItem('orca-highvis') === 'true');

  const labels = copy[language] || copy.en;

  useEffect(() => {
    document.body.classList.toggle('dark-theme', darkMode);
    window.localStorage.setItem('orca-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    document.body.classList.toggle('high-vis-theme', highVis);
    window.localStorage.setItem('orca-highvis', highVis ? 'true' : 'false');
  }, [highVis]);

  const toggleTheme = () => setDarkMode((value) => !value);
  const toggleHighVis = () => setHighVis((value) => !value);

  const changeLanguage = (code) => {
    setLanguage(code);
    window.localStorage.setItem('orca-lang', code);
  };

  const ask = (question) => {
    const chosen = question || query || 'Show weather';
    setQuery('');
    setAnswer(
      answers[chosen] || {
        text: 'Conditions look manageable near Kochi. Stay close to shore, check your life jacket, and return if the wind becomes strong.',
        title: 'Good to go with care',
        value: 'Caution',
        chart: true
      }
    );
    setAgentsOpen(true);
    setPage('home');
  };

  if (!isAuthenticated) {
    return <AuthScreen darkMode={darkMode} onToggleTheme={toggleTheme} />;
  }

  const initials = user?.avatarInitials || user?.initials || 'U';

  return (
    <div className={`app-shell ${alertOpen ? 'has-banner' : ''}`}>
      <AnimatePresence>
        {alertOpen && (
          <motion.div className="critical-banner" initial={{ y: -80 }} animate={{ y: 0 }} exit={{ y: -80 }}>
            <AlertTriangle size={19} />
            <span>
              <strong>Safety alert:</strong> Strong winds near Lakshadweep. Avoid open water after 6 PM.
            </span>
            <button onClick={() => setAlertOpen(false)} aria-label="Close safety alert" type="button">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <img src="/bluemind-logo.jpg" alt="BlueMind Agent" className="brand-logo-img" />
          </div>
          <div>
            <strong>MAHASAGAR</strong>
            <small>BlueMind · ORCA</small>
          </div>
        </div>

        <div className="location-chip">
          <MapPin size={16} />
          <span>
            <small>YOUR LOCATION · Live location</small>
            <strong>{user?.currentLocation || 'Kochi, Kerala'}</strong>
          </span>
        </div>

        <nav>
          {navItems.map(([id, text, Component]) => (
            <button
              key={id}
              className={page === id ? 'selected' : ''}
              onClick={() => setPage(id)}
              type="button"
            >
              <Component size={20} />
              <span>{labels[id] || text}</span>
              {id === 'alerts' && <b>3</b>}
            </button>
          ))}
        </nav>

        <div className="side-help">
          <LifeBuoy size={25} />
          <strong>Need help at sea?</strong>
          <span>Keep your phone charged</span>
          <button onClick={() => setSosOpen(true)} type="button">Open SOS</button>
        </div>

        {/* Multi-language switcher supporting all 5 coastal languages */}
        <div className="language-switch">
          {languages.map((l) => (
            <button
              key={l.code}
              className={language === l.code ? 'active' : ''}
              onClick={() => changeLanguage(l.code)}
              type="button"
              title={l.label}
            >
              {l.short}
            </button>
          ))}
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open mobile menu" type="button">
            <Menu />
          </button>
          <div className="mobile-brand">
            <img src="/bluemind-logo.jpg" alt="BlueMind" className="mobile-logo-img" /> MAHASAGAR
          </div>
          <div className="top-actions">
            <button className="theme-toggle" onClick={toggleHighVis} type="button" title="Toggle large text">
              <Eye size={17} />
              {highVis ? 'Normal text' : 'Large text'}
            </button>
            <button className="theme-toggle" onClick={toggleTheme} type="button">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              {darkMode ? 'Bright' : 'Dark'}
            </button>
            <button
              className="icon-button"
              onClick={() => setPage('alerts')}
              aria-label="Notifications"
              title="View 3 active safety alerts"
              type="button"
            >
              <Bell size={20} />
              <i />
            </button>
            <button
              className="topbar-user-chip"
              onClick={() => setPage('profile')}
              title="Open Profile & Settings"
              type="button"
            >
              <div className="avatar">{initials}</div>
              <span className="desktop-only">{user?.name || 'Fisherman'}</span>
            </button>
          </div>
        </header>

        {/* Smooth Page Transitions (Item F.1) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -7 }}
            transition={{ duration: 0.18 }}
            className="page-transition"
          >
            {page === 'home' && (
              <Home
                labels={labels}
                language={language}
                answer={answer}
                agentsOpen={agentsOpen}
                setAgentsOpen={setAgentsOpen}
                sourcesOpen={sourcesOpen}
                setSourcesOpen={setSourcesOpen}
                ask={ask}
                query={query}
                setQuery={setQuery}
                setPage={setPage}
              />
            )}
            {page === 'map' && <MapPage labels={labels} />}
            {page === 'alerts' && <AlertsPage labels={labels} />}
            {page === 'sos' && <SosPage labels={labels} onOpen={() => setSosOpen(true)} user={user} />}
            {page === 'profile' && (
              <ProfilePage
                labels={labels}
                language={language}
                setLanguage={changeLanguage}
                darkMode={darkMode}
                onToggleTheme={toggleTheme}
                highVis={highVis}
                toggleHighVis={toggleHighVis}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {sosOpen && (
        <SosFlow
          labels={labels}
          onClose={() => {
            setSosOpen(false);
            setPage('home');
          }}
        />
      )}
    </div>
  );
}

export default App;
