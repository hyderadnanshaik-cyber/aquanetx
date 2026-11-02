import { useState, useEffect, useRef } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { Bot, Send, Trash2, WifiOff, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConnectivity } from '../../contexts/ConnectivityContext';
import { db, type ChatMessage } from '../../db';

interface OutletContextType {
  currentLocation?: {
    name: string;
    lat: number;
    lon: number;
    state?: string;
  };
}

const SESSION_ID = `chat-${Date.now()}`;

const SUGGESTED_QUESTIONS = [
  'What is the current flood risk in Hyderabad?',
  'How can I conserve water during a shortage?',
  'What should I do if I see flooding near my home?',
  'Explain rainwater harvesting for urban areas.',
  'What are signs of water contamination?',
  'Emergency water safety tips.',
];

const OFFLINE_RESPONSES: Record<string, string> = {
  flood: 'During a flood:\n- Move to higher ground immediately.\n- Avoid walking or driving through floodwater.\n- Turn off utilities if safe to do so.\n- Call emergency services.\n- Never ignore a flood warning.',
  water: 'Water conservation tips:\n- Fix leaks promptly.\n- Use water-efficient fixtures.\n- Collect rainwater for non-drinking uses.\n- Water plants in early morning.\n- Take shorter showers.',
  emergency: 'Emergency water safety:\n- Boil water for at least **1 minute** before drinking if supply is compromised.\n- Use bottled water if available.\n- Do not use floodwater for drinking or cooking.',
  contamination: 'Signs of water contamination:\n- Unusual colour, odour, or taste.\n- Skin irritation after contact.\n- Nearby industrial or agricultural activity.\n\n**Do not drink or use the water** — contact your water authority immediately.',
  default: 'AQUA AI is operating in **offline mode**.\n\nFor life-safety emergencies, contact municipal emergency services.\n\nStandard guidance is available for:\n- Flood response\n- Water conservation\n- Emergency safety\n- Contamination detection',
};

function getOfflineResponse(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('flood')) return OFFLINE_RESPONSES.flood;
  if (q.includes('water') && (q.includes('conserv') || q.includes('sav') || q.includes('tip'))) return OFFLINE_RESPONSES.water;
  if (q.includes('emergency') || q.includes('safe')) return OFFLINE_RESPONSES.emergency;
  if (q.includes('contamin') || q.includes('pollut') || q.includes('dirty')) return OFFLINE_RESPONSES.contamination;
  return OFFLINE_RESPONSES.default;
}

/**
 * Pure inline markdown-to-HTML renderer — no external library dependency.
 * Handles: ### headings, **bold**, *italic*, `code`, - lists, * lists, 1. lists, ---, > blockquotes
 */
function renderMarkdown(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  let inUL = false;
  let inOL = false;

  const closeList = () => {
    if (inUL) { out.push('</ul>'); inUL = false; }
    if (inOL) { out.push('</ol>'); inOL = false; }
  };

  const inline = (s: string) =>
    s
      .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:700;color:#0B2E42">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em style="color:#334155">$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:rgba(0,0,0,.08);border-radius:4px;padding:1px 5px;font-family:monospace;font-size:.87em;color:#0F4C75">$1</code>');

  for (const raw of lines) {
    const line = raw.trimEnd();

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      closeList();
      out.push('<hr style="border:none;border-top:1px solid #E2E8F0;margin:10px 0"/>');
      continue;
    }
    // ### Heading
    const hm = line.match(/^(#{1,3})\s+(.+)/);
    if (hm) {
      closeList();
      out.push(`<p style="font-weight:700;font-size:.93rem;margin:10px 0 4px;color:#0B2E42">${inline(hm[2])}</p>`);
      continue;
    }
    // > Blockquote
    if (/^>\s?/.test(line)) {
      closeList();
      const bq = line.replace(/^>\s?/, '');
      out.push(`<blockquote style="border-left:3px solid #39D8D0;margin:6px 0;padding:4px 10px;color:#475569;font-style:italic;background:rgba(57,216,208,.06);border-radius:0 6px 6px 0">${inline(bq)}</blockquote>`);
      continue;
    }
    // Ordered list: "1. item"
    const olm = line.match(/^\d+\.\s+(.*)/);
    if (olm) {
      if (!inOL) { closeList(); out.push('<ol style="margin:4px 0 4px 20px;padding:0;color:#1E293B">'); inOL = true; }
      out.push(`<li style="margin:3px 0;color:#1E293B">${inline(olm[1])}</li>`);
      continue;
    }
    // Unordered list: "- item" or "* item" (but not **bold**)
    const ulm = line.match(/^[*\-]\s+(.*)/);
    if (ulm && !line.match(/^\*\*/)) {
      if (!inUL) { closeList(); out.push('<ul style="margin:4px 0 4px 20px;padding:0;color:#1E293B">'); inUL = true; }
      out.push(`<li style="margin:3px 0;color:#1E293B">${inline(ulm[1])}</li>`);
      continue;
    }
    // Blank line
    if (line.trim() === '') {
      closeList();
      continue;
    }
    // Normal paragraph
    closeList();
    out.push(`<p style="margin:4px 0;line-height:1.65;color:#1E293B">${inline(line)}</p>`);
  }

  closeList();
  return out.join('');
}

/** Renders AQUA AI response as formatted HTML — no external deps */
function AquaMarkdown({ content }: { content: string }) {
  return (
    <div
      style={{ fontSize: '0.92rem', lineHeight: 1.65, color: '#1E293B' }}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}

export default function AquaAIPage() {
  const { user } = useAuth();
  const { online } = useConnectivity();
  const routerLocation = useLocation();
  const outletCtx = useOutletContext<OutletContextType>();
  const activeLocation = outletCtx?.currentLocation || {
    name: 'Hyderabad, Telangana, India',
    lat: 17.3850,
    lon: 78.4867,
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [_error, _setError] = useState('');
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    db.chatMessages
      .where('sessionId')
      .equals(SESSION_ID)
      .sortBy('createdAt')
      .then((stored) => {
        if (stored && stored.length > 0) {
          setMessages(stored);
        } else {
          setMessages([
            {
              sessionId: SESSION_ID,
              role: 'assistant',
              content:
                "Hello. I am **AQUA AI**, your water intelligence and emergency safety assistant for AQUANET X.\n\nI can assist you with:\n- **Real-Time Hydrological Status:** Flood forecasts, SCS-CN runoff, and CWC telemetry for your location.\n- **Water Stress & Groundwater Quality:** Potability, TDS, fluoride, and nitrate analytics across 15,177 CGWB stations.\n- **Rainwater Harvesting (RWH):** Rooftop sizing, runoff formulas, and government subsidies.\n- **Water Contamination:** Testing indicators, purification, and safety protocols.\n\nHow can I help you today?",
              createdAt: Date.now(),
            },
          ]);
        }
      })
      .catch(() => {
        setMessages([
          {
            sessionId: SESSION_ID,
            role: 'assistant',
            content:
              "Hello. I am **AQUA AI**, your water intelligence and emergency safety assistant for AQUANET X.\n\nHow can I help you today?",
            createdAt: Date.now(),
          },
        ]);
      });

    const state = routerLocation.state as { question?: string } | null;
    if (state?.question) {
      setInput(state.question);
      window.history.replaceState({}, '');
    }
  }, []);

  useEffect(() => {
    // Scroll only the internal messages container, never the page/window
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content) return;
    setInput('');
    _setError('');

    const userMsg: ChatMessage = { sessionId: SESSION_ID, role: 'user', content, createdAt: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    if (!online) {
      setTyping(true);
      await new Promise((r) => setTimeout(r, 600));
      const offlineReply: ChatMessage = {
        sessionId: SESSION_ID,
        role: 'assistant',
        content: `**Offline Mode — Stored Safety Protocol**\n\n${getOfflineResponse(content)}`,
        createdAt: Date.now(),
      };
      setMessages([...newMessages, offlineReply]);
      setTyping(false);
      return;
    }

    setTyping(true);
    try {
      let token = 'demo';
      if (!user?.isDemo) {
        try {
          const { getAuth } = await import('firebase/auth');
          token = (await getAuth().currentUser?.getIdToken()) || 'demo';
        } catch { /* use demo */ }
      }

      const conversationHistory = messages
        .filter((m) => !m.content.startsWith('Chat session cleared') && !m.content.startsWith('Hello. I am **AQUA AI**'))
        .slice(-6)
        .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', content: m.content }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: content,
          location: activeLocation,
          history: conversationHistory,
        }),
        signal: AbortSignal.timeout(90000),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = { sessionId: SESSION_ID, role: 'assistant', content: data.response, createdAt: Date.now() };
      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);

      await db.chatMessages.bulkAdd([userMsg, assistantMsg]);
    } catch (e: unknown) {
      const msg = (e as Error)?.message || 'Unknown error';
      if (msg.includes('timed out') || msg.includes('timeout') || msg.includes('AbortError')) {
        // Instant graceful fallback on latency spike: provide verified offline protocol immediately
        const fallbackAnswer = getOfflineResponse(content);
        const timeoutMsg: ChatMessage = {
          sessionId: SESSION_ID,
          role: 'assistant',
          content: `${fallbackAnswer}\n\n*(Note: Cloud AI response took longer than expected. Stored water safety protocol served instantly.)*`,
          createdAt: Date.now(),
        };
        setMessages([...newMessages, timeoutMsg]);
      } else if (msg.includes('not configured') || msg.includes('demo')) {
        const demoMsg: ChatMessage = {
          sessionId: SESSION_ID,
          role: 'assistant',
          content: `**Notice:** Live AI engine unavailable.\n\n${getOfflineResponse(content)}`,
          createdAt: Date.now(),
        };
        setMessages([...newMessages, demoMsg]);
      } else {
        _setError(msg);
        const errMsg: ChatMessage = { sessionId: SESSION_ID, role: 'assistant', content: `**Advisory Error:** ${msg}\n\nPlease retry your question.`, createdAt: Date.now() };
        setMessages([...newMessages, errMsg]);
      }
    } finally {
      setTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([{
      sessionId: SESSION_ID,
      role: 'assistant',
      content: "Chat session cleared. How may I assist you?",
      createdAt: Date.now(),
    }]);
  };

  return (
    <div style={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
      <div className="page-header" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h1 className="page-title">AQUA AI Intelligence</h1>
            <p className="page-desc">
              Conversational water intelligence engine with real-time telemetry for{' '}
              <strong style={{ color: 'var(--dash-aqua)' }}>{activeLocation.name.split(',')[0]}</strong>.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, background: '#F8FAFC', border: '1px solid var(--dash-border)', fontSize: '0.78rem', color: 'var(--dash-text)', fontWeight: 600 }}>
              <MapPin size={12} color="var(--dash-aqua)" />
              <span>{activeLocation.name.split(',')[0]} Active</span>
            </span>
            {!online && (
              <span className="demo-label" style={{ background: 'rgba(255,140,0,0.12)', color: '#D97706', borderColor: 'rgba(255,140,0,0.3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <WifiOff size={12} /> Offline Mode
              </span>
            )}
            <button className="action-btn ghost" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={clearChat}>
              <Trash2 size={13} /> Clear
            </button>
          </div>
        </div>
      </div>

      {/* Suggested questions - scrollable strip, clipped to container */}
      {messages.length <= 1 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', overflowY: 'hidden', paddingBottom: 8, flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', width: '100%', maxWidth: '100%', boxSizing: 'border-box', marginBottom: 12 }}>
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              style={{
                flexShrink: 0,
                whiteSpace: 'nowrap',
                background: '#FFFFFF',
                border: '1px solid var(--dash-border)',
                borderRadius: 20,
                padding: '6px 14px',
                color: 'var(--dash-text)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 500,
                boxShadow: 'var(--dash-shadow-sm)',
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="chat-container" style={{ height: 'calc(100vh - 250px)', minHeight: 400, overflow: 'hidden' }}>
        <div className="chat-messages" ref={chatMessagesRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.role}`}>
              {msg.role === 'assistant' && (
                <div style={{ fontSize: '0.72rem', color: 'var(--dash-muted)', marginBottom: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Bot size={13} color="var(--turq)" />
                  <span>AQUA AI</span>
                </div>
              )}
              {msg.role === 'assistant' ? (
                <AquaMarkdown content={msg.content} />
              ) : (
                <div style={{ lineHeight: 1.6 }}>{msg.content}</div>
              )}
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: 6, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                {new Date(msg.createdAt).toLocaleTimeString()}
              </div>
            </div>
          ))}

          {typing && (
            <div className="chat-msg assistant">
              <div style={{ fontSize: '0.72rem', color: 'var(--dash-muted)', marginBottom: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Bot size={13} color="var(--turq)" />
                <span>AQUA AI</span>
              </div>
              <div className="typing-dots">
                <span /><span /><span />
              </div>
            </div>
          )}
        </div>

        <div className="chat-input-area">
          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder={online ? 'Ask about flood risk, water quality, conservation, or safety protocols…' : 'Offline — standard emergency safety protocols available'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="action-btn primary"
            style={{ padding: '10px 18px', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => sendMessage()}
            disabled={typing || !input.trim()}
          >
            {typing ? '…' : <Send size={15} />}
          </button>
        </div>
      </div>

      {!online && (
        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#94A3B8', marginTop: 10 }}>
          Offline mode: locally verified emergency protocols active. Full AI activates when online.
        </p>
      )}
    </div>
  );
}
