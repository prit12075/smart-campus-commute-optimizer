import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Search, ArrowLeft, MoreVertical, Phone, MapPin, Smile, Paperclip, CheckCheck, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PageWrapper from '../components/common/PageWrapper';

// --- Mock data (replace with real socket/API later) ---
const CONVERSATIONS = [
  {
    id: '1',
    name: 'Arjun Kumar',
    regNo: 'AP21110011001',
    online: true,
    lastMsg: 'At gate by 8am, come!',
    time: '9m',
    unread: 2,
    messages: [
      { id: 1, from: 'them', text: 'Hey, are you taking the ride to campus?', time: '8:45 AM' },
      { id: 2, from: 'me', text: 'Yes! Leaving at 8. Want to join?', time: '8:46 AM' },
      { id: 3, from: 'them', text: 'At gate by 8am, come!', time: '8:51 AM' },
    ],
  },
  {
    id: '2',
    name: 'Priya S',
    regNo: 'AP21110012345',
    online: true,
    lastMsg: 'Can we share the ride?',
    time: '1h',
    unread: 0,
    messages: [
      { id: 1, from: 'them', text: 'Hi! I saw your ride post for tomorrow', time: '7:30 AM' },
      { id: 2, from: 'them', text: 'Can we share the ride?', time: '7:31 AM' },
      { id: 3, from: 'me', text: 'Sure! There is one seat left', time: '7:45 AM' },
    ],
  },
  {
    id: '3',
    name: 'Rahul M',
    regNo: 'AP21110009876',
    online: false,
    lastMsg: 'Thanks for the ride!',
    time: '3h',
    unread: 0,
    messages: [
      { id: 1, from: 'me', text: 'Reached safely?', time: '6:00 PM' },
      { id: 2, from: 'them', text: 'Yes! Thanks for the ride!', time: '6:05 PM' },
    ],
  },
];

function Avatar({ name, online, size = 10 }) {
  const initials = name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const colors = ['from-violet-500 to-purple-600', 'from-emerald-500 to-teal-600', 'from-blue-500 to-indigo-600', 'from-pink-500 to-rose-600'];
  const color = colors[name?.charCodeAt(0) % colors.length];
  return (
    <div className="relative shrink-0">
      <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold`}
        style={{ fontSize: size < 10 ? '0.6rem' : '0.75rem' }}>
        {initials}
      </div>
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${online ? 'bg-emerald-400' : 'bg-slate-300'}`} />
      )}
    </div>
  );
}

function ConversationList({ convos, active, onSelect }) {
  const [q, setQ] = useState('');
  const filtered = convos.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex flex-col h-full border-r border-slate-200 bg-white">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-800 mb-3">Messages</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-violet-400 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-50 text-left ${active?.id === c.id ? 'bg-violet-50 border-l-2 border-l-violet-500' : ''}`}
          >
            <Avatar name={c.name} online={c.online} size={10} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-sm font-semibold truncate ${active?.id === c.id ? 'text-violet-700' : 'text-slate-800'}`}>{c.name}</span>
                <span className="text-[10px] text-slate-400 shrink-0 ml-2">{c.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 truncate">{c.lastMsg}</p>
                {c.unread > 0 && (
                  <span className="ml-2 shrink-0 w-4 h-4 rounded-full bg-violet-600 text-white text-[9px] font-bold flex items-center justify-center">{c.unread}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* New chat hint */}
      <div className="px-4 py-3 border-t border-slate-100 text-center">
        <p className="text-[11px] text-slate-400">Chat with co-riders after booking a ride</p>
      </div>
    </div>
  );
}

function ChatWindow({ convo, onBack }) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState(convo?.messages || []);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    setMsgs(convo?.messages || []);
    setText('');
  }, [convo?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const send = () => {
    if (!text.trim()) return;
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setMsgs((prev) => [...prev, { id: Date.now(), from: 'me', text: text.trim(), time: now }]);
    setText('');
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  if (!convo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mb-4">
          <Send size={28} className="text-violet-400" />
        </div>
        <p className="text-slate-700 font-semibold mb-1">Select a conversation</p>
        <p className="text-sm text-slate-400">Choose a co-rider to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-w-0">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
        <button onClick={onBack} className="md:hidden p-1 rounded-lg hover:bg-slate-100">
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <Avatar name={convo.name} online={convo.online} size={9} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{convo.name}</p>
          <p className="text-[11px] text-slate-400">{convo.online ? 'Online now' : 'Offline'} · {convo.regNo}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <Phone size={16} className="text-slate-500" />
          </button>
          <button className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <MapPin size={16} className="text-violet-500" />
          </button>
          <button className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <MoreVertical size={16} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {msgs.map((m) => {
          const isMe = m.from === 'me';
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              {!isMe && (
                <div className="mr-2 mt-1">
                  <Avatar name={convo.name} size={7} />
                </div>
              )}
              <div className={`max-w-[72%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? 'bg-violet-600 text-white rounded-tr-sm'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm shadow-sm'
                }`}>
                  {m.text}
                </div>
                <div className={`flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-[10px] text-slate-400">{m.time}</span>
                  {isMe && <CheckCheck size={11} className="text-violet-400" />}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 focus-within:border-violet-400 focus-within:bg-white transition-all">
          <button className="p-1 rounded-lg hover:bg-slate-100">
            <Smile size={18} className="text-slate-400" />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
          />
          <button className="p-1 rounded-lg hover:bg-slate-100">
            <Paperclip size={18} className="text-slate-400" />
          </button>
          <button
            onClick={send}
            disabled={!text.trim()}
            className="w-8 h-8 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 flex items-center justify-center transition-all active:scale-95 shrink-0"
          >
            <Send size={14} className={text.trim() ? 'text-white' : 'text-slate-400'} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Messages() {
  const [active, setActive] = useState(null);
  const [showChat, setShowChat] = useState(false);

  const handleSelect = (c) => { setActive(c); setShowChat(true); };
  const handleBack = () => setShowChat(false);

  return (
    <PageWrapper>
      <div className="flex h-screen max-h-screen overflow-hidden">
        {/* Sidebar list — hidden on mobile when chat open */}
        <div className={`w-full md:w-80 shrink-0 ${showChat ? 'hidden md:flex md:flex-col' : 'flex flex-col'}`}>
          <ConversationList convos={CONVERSATIONS} active={active} onSelect={handleSelect} />
        </div>

        {/* Chat window — full screen on mobile */}
        <div className={`flex-1 min-w-0 ${showChat ? 'flex flex-col' : 'hidden md:flex'}`}>
          <ChatWindow convo={active} onBack={handleBack} />
        </div>
      </div>
    </PageWrapper>
  );
}
