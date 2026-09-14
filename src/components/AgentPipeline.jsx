import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, CloudRain, Database, FileText, LifeBuoy, LineChart, Map, MessageSquare, ShieldAlert, Waves, Workflow } from 'lucide-react';
import './AgentPipeline.css';

const pipeline = [
  ['User Interaction', 'Reading your question', 'Question understood', MessageSquare, '#0E7490'],
  ['Planning & Orchestration', 'Choosing what to check', 'Plan ready', Workflow, '#7C5CFC'],
  ['Marine Data Discovery', 'Checking 3 data feeds', 'Sources found', Database, '#D97706'],
  ['Weather Intelligence', 'Checking wind and rain', 'Forecast ready', CloudRain, '#0284C7'],
  ['Ocean Analytics', 'Checking waves and sea', 'Ocean conditions ready', Waves, '#0891B2'],
  ['Geospatial Reasoning', 'Comparing nearby zones', 'Zones mapped', Map, '#16A34A'],
  ['Risk Assessment & Geofencing', 'Checking hazards nearby', 'Risk scored', ShieldAlert, '#DC2626'],
  ['SOS & Emergency Coordination', 'Checking help nearby', 'Help network ready', LifeBuoy, '#EA580C'],
  ['Visualization', 'Preparing your map', 'Map ready', LineChart, '#9333EA'],
  ['Reporting & Synthesis', 'Writing a clear answer', 'Answer ready', FileText, '#0F766E'],
];

export default function AgentPipeline({ open, onToggle, labels }) {
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (!open) return undefined;
    setActiveIndex(-1);
    let index = 0;
    const timer = window.setInterval(() => {
      setActiveIndex(index);
      index += 1;
      if (index === pipeline.length) window.clearInterval(timer);
    }, 480);
    return () => window.clearInterval(timer);
  }, [open]);

  return <section className="activity-card">
    <button className="activity-heading" onClick={onToggle} aria-expanded={open}>
      <span className="icon-box cyan"><Workflow size={20} /></span>
      <span><strong>{labels.activity}</strong><small>10 specialists working together</small></span>
      <span className="live-label"><span />{labels.live}<span className="pipeline-chevron">⌄</span></span>
    </button>
    <AnimatePresence initial={false}>
      {open && <motion.div className="agent-grid pipeline-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        {pipeline.map(([name, working, doneText, AgentIcon, color], index) => {
          const state = index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'pending';
          return <motion.div className={`agent-item pipeline-agent ${state}`} key={name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .04 }}>
            <div className="agent-line"><motion.span className="agent-node" style={{ '--agent-color': color }} animate={state === 'active' ? { scale: [1, 1.14, 1] } : { scale: 1 }} transition={{ duration: 1, repeat: state === 'active' ? Infinity : 0 }}><AgentIcon size={14} /></motion.span>{index < pipeline.length - 1 && <span className="flow-line"><i style={{ height: `${Math.max(0, Math.min(100, (activeIndex - index) * 100))}%` }} /></span>}{state === 'done' && <span className="agent-check"><Check size={9} /></span>}</div>
            <div><strong>{name}</strong><small>{state === 'done' ? doneText : state === 'active' ? working : 'Waiting for plan'}</small></div>
          </motion.div>;
        })}
      </motion.div>}
    </AnimatePresence>
  </section>;
}
