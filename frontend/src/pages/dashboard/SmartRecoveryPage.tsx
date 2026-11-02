import { useState } from 'react';
import {
  CloudRain,
  Recycle,
  Wrench,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Calculator,
  Download,
  ExternalLink,
  X,
  Sparkles,
} from 'lucide-react';
import { useConnectivity } from '../../contexts/ConnectivityContext';

interface StrategyItem {
  id: number;
  category: string;
  icon: any;
  title: string;
  priority: 'high' | 'moderate' | 'low';
  potentialLitres: number;
  potentialPeriod: string;
  savings: string;
  effort: string;
  desc: string;
  steps: string[];
  tags: string[];
  subsidyName: string;
  subsidyAmount: string;
  subsidyAuthority: string;
}

const STRATEGIES: StrategyItem[] = [
  {
    id: 1,
    category: 'Rainwater Harvesting',
    icon: CloudRain,
    title: 'Rooftop Collection & Infiltration Well System',
    priority: 'high',
    potentialLitres: 42000,
    potentialPeriod: 'per year',
    savings: '₹18,400 / yr',
    effort: 'Medium (3-5 days)',
    desc: 'Install rooftop gutters and first-flush diverters to channel monsoon precipitation into a percolation pit or underground storage cistern. With average 750 mm rainfall and 150 m² roof area, estimated capture is 42,000 L/year at 85% runoff coefficient.',
    steps: [
      'Survey rooftop drainage gradient and install UV-stabilized PVC gutters',
      'Fit first-flush diverter (discarding initial 1-2 mm contaminated runoff)',
      'Construct a 3m deep percolation pit with graded sand-gravel-charcoal filtration bed',
      'Connect recharge overflow to municipal storm trench or storage tank',
    ],
    tags: ['Subsidy Eligible (GHMC/Jal Shakti)', 'High ROI', 'Recharges Aquifer'],
    subsidyName: 'National Jal Jeevan & State RWH Mandatory Rebate Scheme',
    subsidyAmount: 'Up to 50% capital subsidy or ₹25,000 per residential unit',
    subsidyAuthority: 'Ministry of Jal Shakti & Municipal Corporation (GHMC / GHMC Building Rules)',
  },
  {
    id: 2,
    category: 'Greywater Reuse',
    icon: Recycle,
    title: 'Decentralized Domestic Greywater Biofilter',
    priority: 'moderate',
    potentialLitres: 28000,
    potentialPeriod: 'per year',
    savings: '₹9,200 / yr',
    effort: 'Low (1-2 days)',
    desc: 'Divert non-sewage wastewater from laundry, washbasins, and shower lines through a decentralized multi-layer reed-bed biofilter. Treated effluent is suitable for toilet flushing, landscaping, and construction use.',
    steps: [
      'Install twin-pipe diverter valve on washbasin and shower outlets',
      'Assemble a dual-chamber gravel-sand-activated charcoal biological filter',
      'Route filtered effluent into an automated garden drip irrigation line',
      'Perform monthly sediment backwashing and charcoal media replacement',
    ],
    tags: ['Low Cost', 'Quick Install', 'Reduces Water Demand by 35%'],
    subsidyName: 'AMRUT 2.0 Urban Wastewater Circularity Grant',
    subsidyAmount: 'Direct municipal rebate on property water sewerage tariff',
    subsidyAuthority: 'State Urban Development Department & CPCB',
  },
  {
    id: 3,
    category: 'Infrastructure',
    icon: Wrench,
    title: 'Ultrasonic Micro-Leak Acoustic Sensors',
    priority: 'low',
    potentialLitres: 14600,
    potentialPeriod: 'per year',
    savings: '₹4,800 / yr',
    effort: 'Low (4 hours)',
    desc: 'Deploy clamp-on acoustic flow meters at building water intake points. Real-time telemetry detects subterranean seepage and continuous night flow anomalies before pipe bursts cause structural damage.',
    steps: [
      'Audit internal plumbing line network with ultrasonic pressure test',
      'Install ultrasonic flow transducer on main overhead tank delivery pipe',
      'Calibrate baseline nighttime non-consumption flow threshold',
      'Enable push notifications on AQUANET X for abnormal pressure drop warnings',
    ],
    tags: ['IoT Enabled', 'Zero Disruption', 'Prevents Structural Seepage'],
    subsidyName: 'Smart City Mission Smart Metering Incentive',
    subsidyAmount: 'Free sensor deployment for registered municipal apartments',
    subsidyAuthority: 'Smart Cities Mission & Municipal Water Board',
  },
];

export default function SmartRecoveryPage() {
  const { online } = useConnectivity();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expanded, setExpanded] = useState<number | null>(1);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [subsidyModalItem, setSubsidyModalItem] = useState<StrategyItem | null>(null);

  // Interactive Calculator State
  const [roofArea, setRoofArea] = useState<number>(150);
  const [rainfallMm, setRainfallMm] = useState<number>(750);
  const [householdMembers, setHouseholdMembers] = useState<number>(4);

  // Formula: Volume (L) = Area (m²) * Rainfall (mm) * Runoff Coefficient (0.85)
  const calculatedHarvestLitres = Math.round(roofArea * rainfallMm * 0.85);
  // Tariff: ~₹40 per kL (commercial/urban domestic blend)
  const calculatedSavingsRupees = Math.round((calculatedHarvestLitres / 1000) * 45);
  // Days of household water security (based on 135 LPCD standard):
  const daysOfWaterSecurity = Math.round(calculatedHarvestLitres / (householdMembers * 135));

  const toggleStep = (key: string) => {
    setCompletedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredStrategies = selectedCategory === 'All'
    ? STRATEGIES
    : STRATEGIES.filter((s) => s.category === selectedCategory);

  const exportStrategyReport = () => {
    const content = `AQUANET X — SMART WATER RECOVERY STRATEGY BRIEF
Generated: ${new Date().toLocaleString('en-IN')}

==================================================
1. INTERACTIVE HARVESTING CALCULATION
- Roof Area: ${roofArea} m²
- Annual Precipitation: ${rainfallMm} mm
- Household Members: ${householdMembers} persons
- Estimated Annual Capture: ${calculatedHarvestLitres.toLocaleString()} Litres
- Projected Financial Savings: ₹${calculatedSavingsRupees.toLocaleString()} per year
- Water Independence Equivalent: ${daysOfWaterSecurity} full days of water security

==================================================
2. ACTIONABLE INTERVENTIONS
${STRATEGIES.map((s) => `
[${s.category}] ${s.title} (${s.priority.toUpperCase()} PRIORITY)
Potential: ${s.potentialLitres.toLocaleString()} L ${s.potentialPeriod}
Estimated Savings: ${s.savings}
Implementation Steps:
${s.steps.map((st, i) => `  ${i + 1}. [${completedSteps[`${s.id}-${i}`] ? 'X' : ' '}] ${st}`).join('\n')}
Subsidy: ${s.subsidyName} (${s.subsidyAmount})
`).join('\n')}
==================================================
Produced by AQUANET X Water Intelligence Platform
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AquaNetX_Water_Recovery_Plan_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">Smart Water Recovery & Circularity</h1>
            <p className="page-desc">Algorithmic planning for rainwater harvesting, greywater reuse, and municipal infrastructure rebates.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={exportStrategyReport}
              className="action-btn ghost"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              title="Download personalized strategy brief"
            >
              <Download size={14} /> Export Plan
            </button>
            <span className="live-label">
              <CheckCircle2 size={12} /> BIS IS 15797:2008 Standard
            </span>
            <span style={{
              padding: '4px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
              background: online ? 'rgba(57,216,208,0.15)' : 'rgba(255,100,100,0.15)',
              color: online ? '#159A9C' : '#DC2626',
              border: `1px solid ${online ? 'rgba(57,216,208,0.3)' : 'rgba(255,100,100,0.3)'}`,
            }}>
              {online ? 'Cloud Sync Ready' : 'Offline Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Rainwater Harvesting Yield Calculator */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--dash-border)', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: 'var(--dash-shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(24, 182, 210, 0.12)', display: 'grid', placeItems: 'center' }}>
            <Calculator size={20} color="var(--dash-aqua)" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--dash-text)' }}>
              Interactive Catchment Yield & Savings Calculator
            </h2>
            <p style={{ margin: '2px 0 0', color: 'var(--dash-muted)', fontSize: '0.82rem' }}>
              Formula-based engineering computation using Central Ground Water Board (CGWB) empirical runoff coefficients.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 20 }}>
          {/* Rooftop Area Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--dash-text)' }}>Rooftop Catchment Area</label>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--dash-aqua)' }}>{roofArea} m²</span>
            </div>
            <input
              type="range"
              min="30"
              max="1000"
              step="10"
              value={roofArea}
              onChange={(e) => setRoofArea(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: 'var(--dash-aqua)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94A3B8', marginTop: 2 }}>
              <span>30 m² (Apartment terrace)</span>
              <span>1000 m² (Commercial/School)</span>
            </div>
          </div>

          {/* Annual Rainfall Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--dash-text)' }}>Annual Precipitation</label>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0284C7' }}>{rainfallMm} mm</span>
            </div>
            <input
              type="range"
              min="300"
              max="2500"
              step="50"
              value={rainfallMm}
              onChange={(e) => setRainfallMm(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: '#0284C7' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94A3B8', marginTop: 2 }}>
              <span>300 mm (Arid)</span>
              <span>750 mm (Hyderabad)</span>
              <span>2500 mm (Coastal)</span>
            </div>
          </div>

          {/* Household Size */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--dash-text)' }}>Household Size</label>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#16A34A' }}>{householdMembers} persons</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={householdMembers}
              onChange={(e) => setHouseholdMembers(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: '#16A34A' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94A3B8', marginTop: 2 }}>
              <span>1 person</span>
              <span>4 (Average Family)</span>
              <span>20 (Apartment Block)</span>
            </div>
          </div>
        </div>

        {/* Calculated Results Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, background: '#F8FAFC', padding: 18, borderRadius: 12, border: '1px solid #E2E8F0' }}>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--dash-muted)', fontWeight: 600 }}>ESTIMATED ANNUAL YIELD</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dash-aqua)', marginTop: 2 }}>
              {calculatedHarvestLitres.toLocaleString()} L
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 2 }}>At 85% concrete catchment factor</div>
          </div>

          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--dash-muted)', fontWeight: 600 }}>WATER BILL SAVINGS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16A34A', marginTop: 2 }}>
              ₹{calculatedSavingsRupees.toLocaleString()} / yr
            </div>
            <div style={{ fontSize: '0.72rem', color: '#16A34A', marginTop: 2 }}>Based on ₹45/kL municipal tariff</div>
          </div>

          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--dash-muted)', fontWeight: 600 }}>WATER INDEPENDENCE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0284C7', marginTop: 2 }}>
              {daysOfWaterSecurity} Days
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 2 }}>Full household consumption supply</div>
          </div>

          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--dash-muted)', fontWeight: 600 }}>AQUIFER RECHARGE POTENTIAL</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#9333EA', marginTop: 2 }}>
              {Math.round(calculatedHarvestLitres * 0.001)} m³
            </div>
            <div style={{ fontSize: '0.72rem', color: '#9333EA', marginTop: 2 }}>Direct groundwater table injection</div>
          </div>
        </div>
      </div>

      {/* Category Filter Buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {['All', 'Rainwater Harvesting', 'Greywater Reuse', 'Infrastructure'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className="action-btn"
            style={{
              padding: '7px 16px',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: selectedCategory === cat ? 'var(--dash-aqua)' : '#FFFFFF',
              border: `1px solid ${selectedCategory === cat ? 'var(--dash-aqua)' : 'var(--dash-border)'}`,
              color: selectedCategory === cat ? '#FFFFFF' : 'var(--dash-text)',
              boxShadow: 'var(--dash-shadow-sm)',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Strategy Recommendation Cards with Interactive Steps & Subsidy Modal Trigger */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredStrategies.map((rec) => {
          const isOpen = expanded === rec.id;
          const Icon = rec.icon;
          const completedCount = rec.steps.filter((_, i) => completedSteps[`${rec.id}-${i}`]).length;
          const progressPct = Math.round((completedCount / rec.steps.length) * 100);

          return (
            <div
              key={rec.id}
              className="dash-card"
              style={{
                border: isOpen ? '1px solid var(--dash-aqua)' : '1px solid var(--dash-border)',
                borderRadius: 16,
                padding: 22,
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(24, 182, 210, 0.12)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon size={22} color="var(--dash-aqua)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--dash-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                      {rec.category}
                    </span>
                    <span className={`risk-badge risk-${rec.priority}`}>
                      {rec.priority.toUpperCase()} PRIORITY
                    </span>
                    <span style={{ fontSize: '0.75rem', color: progressPct === 100 ? '#16A34A' : '#64748B', fontWeight: 600 }}>
                      Progress: {completedCount}/{rec.steps.length} steps completed ({progressPct}%)
                    </span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--dash-text)', marginBottom: 6 }}>{rec.title}</div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--dash-muted)', marginBottom: 8 }}>
                    <span>Capacity: <strong>{rec.potentialLitres.toLocaleString()} L</strong> {rec.potentialPeriod}</span>
                    <span>Savings: <strong style={{ color: '#16A34A' }}>{rec.savings}</strong></span>
                    <span>Effort: <strong>{rec.effort}</strong></span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {rec.tags.map((t, idx) => (
                      <span key={idx} style={{ fontSize: '0.72rem', background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={() => setSubsidyModalItem(rec)}
                    className="action-btn primary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Sparkles size={12} /> Claim Subsidy
                  </button>
                  <button
                    onClick={() => setExpanded(isOpen ? null : rec.id)}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
                  >
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--dash-border)' }}>
                  <p style={{ color: '#334155', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 16 }}>
                    {rec.desc}
                  </p>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: '0.76rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 700 }}>
                      Interactive Implementation Plan (Check each step as you complete it)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {rec.steps.map((st, i) => {
                        const stepKey = `${rec.id}-${i}`;
                        const isDone = Boolean(completedSteps[stepKey]);
                        return (
                          <div
                            key={i}
                            onClick={() => toggleStep(stepKey)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '8px 12px',
                              borderRadius: 8,
                              background: isDone ? 'rgba(22, 163, 74, 0.08)' : '#F8FAFC',
                              border: `1px solid ${isDone ? '#86EFAC' : '#E2E8F0'}`,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => toggleStep(stepKey)}
                              style={{ width: 16, height: 16, accentColor: '#16A34A', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.84rem', color: isDone ? '#166534' : 'var(--dash-text)', textDecoration: isDone ? 'line-through' : 'none', fontWeight: isDone ? 600 : 500 }}>
                              {st}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Government Subsidy Scheme Modal */}
      {subsidyModalItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: 16 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid var(--dash-border)', padding: 24, width: 'min(500px, 100%)', boxShadow: 'var(--dash-shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="var(--dash-aqua)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--dash-text)' }}>Official Subsidy Application</h3>
              </div>
              <button onClick={() => setSubsidyModalItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.92rem', marginBottom: 2 }}>
                {subsidyModalItem.subsidyName}
              </div>
              <div style={{ color: '#15803D', fontSize: '0.84rem' }}>
                Rebate Value: <strong>{subsidyModalItem.subsidyAmount}</strong>
              </div>
              <div style={{ color: '#64748B', fontSize: '0.78rem', marginTop: 4 }}>
                Issuing Authority: {subsidyModalItem.subsidyAuthority}
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5, marginBottom: 18 }}>
              Under Ministry of Jal Shakti directives and State Municipal Building Bye-Laws, residential buildings installing certified RWH and greywater diversion are entitled to direct property tax rebates and structural grants.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="action-btn ghost"
                onClick={() => setSubsidyModalItem(null)}
              >
                Close
              </button>
              <a
                href="https://jaljeevanmission.gov.in"
                target="_blank"
                rel="noreferrer"
                className="action-btn primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
              >
                <span>Proceed to Jal Shakti Portal</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
