import { useState, useEffect } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  MapPin,
  Navigation,
  Pencil,
  Trash2,
  Users,
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConnectivity } from '../../contexts/ConnectivityContext';
import { db, type EmergencyContact, type EmergencyMessage } from '../../db';

const DEFAULT_MESSAGE = "EMERGENCY! I may need assistance. My current location is: [GPS]. Map: https://maps.google.com/?q=[LAT],[LNG]. Please contact me immediately. — AQUANET X Emergency";

export default function EmergencyPage() {
  const { user } = useAuth();
  const { online, incrementPending } = useConnectivity();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [messages, setMessages] = useState<EmergencyMessage[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');
  const [customMsg, setCustomMsg] = useState(DEFAULT_MESSAGE);
  const [locating, setLocating] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [sosStatus, setSosStatus] = useState('');
  const [currentLoc, setCurrentLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [c, m] = await Promise.all([
      db.emergencyContacts.where('userId').equals(user.uid).toArray(),
      db.emergencyMessages.where('userId').equals(user.uid).reverse().sortBy('createdAt'),
    ]);
    setContacts(c);
    setMessages(m.slice(0, 10));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Contact name is required.';
    if (!phone.trim()) e.phone = 'Valid phone number is required.';
    if (!/^\+?[\d\s\-()]{7,}$/.test(phone.trim())) e.phone = 'Enter a valid international or local phone number.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveContact = async () => {
    if (!user || !validate()) return;
    if (editingId) {
      await db.emergencyContacts.update(editingId, { name: name.trim(), phone: phone.trim(), relation: relation.trim() });
    } else {
      await db.emergencyContacts.add({ userId: user.uid, name: name.trim(), phone: phone.trim(), relation: relation.trim() });
    }
    setName(''); setPhone(''); setRelation(''); setEditingId(null); setShowAddForm(false); setErrors({});
    loadData();
  };

  const handleDeleteContact = async (id: number) => {
    if (!confirm('Remove this emergency contact?')) return;
    await db.emergencyContacts.delete(id);
    loadData();
  };

  const handleEditContact = (c: EmergencyContact) => {
    setEditingId(c.id!);
    setName(c.name); setPhone(c.phone); setRelation(c.relation || '');
    setShowAddForm(true);
  };

  const getLocation = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return; }
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentLoc(loc);
          setLocating(false);
          resolve(loc);
        },
        () => { setLocating(false); resolve(null); },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  };

  const handleSOS = async () => {
    if (contacts.length === 0) {
      alert('Add at least one emergency contact before triggering SOS.');
      return;
    }
    if (!confirm(`Transmit emergency SOS dispatch to ${contacts.length} contact(s)?`)) return;
    setSosActive(true);
    setSosStatus('Acquiring high-accuracy GPS coordinates…');

    const loc = await getLocation();
    setSosStatus('Formatting emergency dispatch payloads…');

    const msgTemplate = customMsg
      .replace('[GPS]', loc ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}` : 'unavailable')
      .replace('[LAT]', loc ? String(loc.lat.toFixed(5)) : '0')
      .replace('[LNG]', loc ? String(loc.lng.toFixed(5)) : '0');

    for (const contact of contacts) {
      const entry: EmergencyMessage = {
        userId: user!.uid,
        contactName: contact.name,
        contactPhone: contact.phone,
        message: msgTemplate,
        lat: loc?.lat,
        lng: loc?.lng,
        status: 'queued',
        createdAt: Date.now(),
      };
      const id = await db.emergencyMessages.add(entry);

      const smsLink = `sms:${contact.phone}?body=${encodeURIComponent(msgTemplate)}`;
      window.open(smsLink, '_blank');

      await db.emergencyMessages.update(id, { status: 'sent', sentAt: Date.now() });
    }

    if (!online) incrementPending();

    setSosStatus(`SMS dispatch prepared for ${contacts.length} contact(s). Confirm transmission in messaging client.`);
    setTimeout(() => { setSosActive(false); setSosStatus(''); loadData(); }, 6000);
    loadData();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Emergency SOS Dispatch</h1>
        <p className="page-desc">Pre-configure emergency response contacts and broadcast coordinates with priority routing.</p>
      </div>

      {/* Important notice */}
      <div style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: 14, padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#DC2626', marginBottom: 6, fontSize: '0.9rem' }}>
          <AlertTriangle size={16} />
          <span>Operational Safety Notice</span>
        </div>
        <p style={{ color: '#334155', fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>
          Triggering SOS formats a direct SMS payload with real-time GPS telemetry and launches the device messaging client.
          For immediate life-threatening events, contact national disaster authorities directly on <strong>112</strong>.
        </p>
      </div>

      {/* SOS button */}
      <div style={{ marginBottom: 28 }}>
        {sosStatus ? (
          <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
            <AlertOctagon size={32} color="#ff6b6b" style={{ margin: '0 auto 8px' }} />
            <div style={{ color: '#DC2626', fontWeight: 600 }}>{sosStatus}</div>
          </div>
        ) : (
          <button className="sos-btn" onClick={handleSOS} disabled={sosActive || contacts.length === 0}>
            <AlertOctagon size={20} />
            <span>TRANSMIT EMERGENCY SOS</span>
          </button>
        )}
        {contacts.length === 0 && !sosStatus && (
          <p style={{ textAlign: 'center', color: 'var(--dash-muted)', fontSize: '0.82rem', marginTop: 10 }}>
            Configure at least one emergency contact below to enable the dispatch trigger.
          </p>
        )}
      </div>

      {/* Current location */}
      <div style={{ background: '#FFFFFF', boxShadow: 'var(--dash-shadow-sm)', border: '1px solid var(--dash-border)', borderRadius: 14, padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(24, 182, 210, 0.12)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <MapPin size={18} color="var(--dash-aqua)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--dash-text)', marginBottom: 2 }}>Current Telemetry Coordinates</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--dash-muted)' }}>
            {currentLoc ? `${currentLoc.lat.toFixed(5)}, ${currentLoc.lng.toFixed(5)}` : 'Coordinates uninitialized — GPS locks automatically on SOS trigger'}
          </div>
        </div>
        <button className="action-btn ghost" style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={getLocation} disabled={locating}>
          <Navigation size={14} />
          <span>{locating ? 'Acquiring…' : 'Detect Location'}</span>
        </button>
      </div>

      {/* Emergency contacts */}
      <div className="section-header">
        <h2 className="section-title" style={{ fontSize: '1.1rem' }}>Designated Emergency Contacts</h2>
        <button className="action-btn primary" style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => { setShowAddForm(true); setEditingId(null); setName(''); setPhone(''); setRelation(''); }}>
          <Plus size={15} />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Add / edit contact form */}
      {showAddForm && (
        <div style={{ background: '#FFFFFF', boxShadow: 'var(--dash-shadow-sm)', border: '1px solid var(--dash-border)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: 'var(--dash-text)' }}>{editingId ? 'Modify Contact Information' : 'Register New Contact'}</h3>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className={`form-input ${errors.name ? 'error' : ''}`} placeholder="e.g. Aarav Kumar" value={name} onChange={(e) => setName(e.target.value)} />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <input className={`form-input ${errors.phone ? 'error' : ''}`} placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
            {errors.phone && <div className="field-error">{errors.phone}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Relation / Role</label>
            <input className="form-input" placeholder="e.g. Municipal Officer, Family, Primary Responder" value={relation} onChange={(e) => setRelation(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="action-btn primary" onClick={handleSaveContact}>Save Contact</button>
            <button className="action-btn ghost" onClick={() => { setShowAddForm(false); setErrors({}); }}>Cancel</button>
          </div>
        </div>
      )}

      {contacts.length === 0 && !showAddForm ? (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: '#94A3B8', background: '#FFFFFF', boxShadow: 'var(--dash-shadow-sm)', borderRadius: 16, marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
            <Users size={28} color="#94A3B8" />
          </div>
          <p style={{ color: 'var(--dash-text)', fontWeight: 600 }}>No emergency contacts registered</p>
          <button className="action-btn primary" style={{ marginTop: 12 }} onClick={() => setShowAddForm(true)}>Add Primary Contact</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {contacts.map((c) => (
            <div key={c.id} className="contact-card">
              <div className="contact-avatar">{c.name[0]?.toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--dash-text)', fontSize: '0.95rem' }}>{c.name}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--dash-muted)' }}>{c.phone}{c.relation ? ` · ${c.relation}` : ''}</div>
              </div>
              <button className="action-btn ghost" style={{ padding: '8px 12px', fontSize: '0.78rem' }} onClick={() => handleEditContact(c)} title="Edit contact">
                <Pencil size={14} />
              </button>
              <button className="action-btn danger" style={{ padding: '8px 12px', fontSize: '0.78rem' }} onClick={() => handleDeleteContact(c.id!)} title="Remove contact">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Custom message editor */}
      <div style={{ background: '#FFFFFF', boxShadow: 'var(--dash-shadow-sm)', border: '1px solid var(--dash-border)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: 'var(--dash-text)' }}>Emergency Dispatch Payload Template</h3>
        <p style={{ color: 'var(--dash-muted)', fontSize: '0.82rem', marginBottom: 12 }}>
          Dynamic parameter placeholders: <code style={{ background: '#F1F5F9', color: 'var(--dash-aqua)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>[GPS]</code>, <code style={{ background: '#F1F5F9', color: 'var(--dash-aqua)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>[LAT]</code>, <code style={{ background: '#F1F5F9', color: 'var(--dash-aqua)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>[LNG]</code>
        </p>
        <textarea
          className="form-textarea"
          value={customMsg}
          onChange={(e) => setCustomMsg(e.target.value)}
          rows={4}
        />
        <button className="action-btn ghost" style={{ marginTop: 10, padding: '6px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setCustomMsg(DEFAULT_MESSAGE)}>
          <RotateCcw size={13} />
          <span>Reset Default Template</span>
        </button>
      </div>

      {/* Recent SOS history */}
      {messages.length > 0 && (
        <div>
          <h2 className="section-title" style={{ fontSize: '1.1rem', marginBottom: 14 }}>Transmission History</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map((m) => (
              <div key={m.id} style={{ background: '#FFFFFF', boxShadow: 'var(--dash-shadow-sm)', border: '1px solid var(--dash-border)', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div>
                  {m.status === 'sent' ? (
                    <CheckCircle2 size={16} color="#4CAF50" />
                  ) : m.status === 'queued' ? (
                    <Clock size={16} color="#ffb450" />
                  ) : (
                    <XCircle size={16} color="#ff6b6b" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', color: 'var(--dash-text)', fontWeight: 500 }}>Recipient: {m.contactName} ({m.contactPhone})</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {new Date(m.createdAt).toLocaleString()} ·{' '}
                    <span style={{ color: m.status === 'sent' ? '#4CAF50' : '#ffb450', fontWeight: 600 }}>
                      {m.status === 'sent' ? 'SMS Client Dispatched' : m.status === 'queued' ? 'Queued' : 'Failed'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
