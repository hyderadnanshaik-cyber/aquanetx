import { useState } from 'react';
import { Waves, ArrowRight, ArrowLeft, Check, X } from 'lucide-react';

const STEPS = [
  { title: 'Welcome to AQUANET X', text: "I'm AQUA, your guide. Let me show you around this water intelligence platform." },
  { title: 'Dashboard Overview', text: 'Your overview hub shows flood risk, water stress, weather, active reports, and alerts at a glance.' },
  { title: 'FloodSense Mapping', text: 'The FloodSense map shows real-time and forecast flood risk zones. Zoom in to see affected areas.' },
  { title: 'Weather Intelligence', text: 'Live weather data with animated visuals — rain, clouds, wind. Severe alerts appear here first.' },
  { title: 'Citizen Reports', text: 'Report flooding, drainage issues, or water contamination in your area. Works offline too!' },
  { title: 'Alerts & Notifications', text: 'Flood, water shortage, and infrastructure alerts with severity levels and recommended actions.' },
  { title: 'Emergency SOS', text: 'Configure emergency contacts. Send your GPS location and a safety message with one tap.' },
  { title: 'AQUA AI Assistant', text: 'Ask me anything about floods, water conservation, emergency guidance, or this app. I\'m always here.' },
  { title: 'Offline-First Reliability', text: 'AQUANET X works offline. Reports are saved locally and synced when you reconnect.' },
  { title: 'Setup Complete', text: 'Explore the app. Tap the floating mascot button anytime to replay this walkthrough.' },
];

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingMascot({ onComplete, onSkip }: Props) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [bubbleVisible, setBubbleVisible] = useState(true);

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const next = () => {
    if (isLast) { onComplete(); return; }
    setStep((s) => s + 1);
  };

  const prev = () => setStep((s) => Math.max(0, s - 1));

  const skip = () => { onSkip(); setVisible(false); };

  return (
    <div className="mascot-container">
      {bubbleVisible && (
        <div className="mascot-bubble">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <strong style={{ fontSize: '0.88rem', color: '#fff' }}>{current.title}</strong>
            <button onClick={() => setBubbleVisible(false)} style={{ background: 'none', border: 'none', color: 'rgba(228,250,248,0.5)', cursor: 'pointer', padding: 0 }}>
              <X size={14} />
            </button>
          </div>
          <p>{current.text}</p>
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ width: 20, height: 3, borderRadius: 2, background: i === step ? 'var(--turq)' : 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
          <div className="mascot-controls">
            {step > 0 && (
              <button className="action-btn ghost" style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={prev}>
                <ArrowLeft size={12} /> Back
              </button>
            )}
            <button className="action-btn primary" style={{ padding: '6px 14px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={next}>
              {isLast ? <>Finish <Check size={12} /></> : <>Next <ArrowRight size={12} /></>}
            </button>
            <button onClick={skip} style={{ background: 'none', border: 'none', color: 'rgba(228,250,248,0.4)', cursor: 'pointer', fontSize: '0.75rem', padding: '6px 4px' }}>Skip</button>
          </div>
        </div>
      )}
      <div className="mascot-body" onClick={() => setBubbleVisible((v) => !v)} title="Toggle guide" style={{ display: 'grid', placeItems: 'center' }}>
        <Waves size={24} color="#08141e" />
      </div>
    </div>
  );
}
