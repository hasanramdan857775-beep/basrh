import React, { useState } from 'react';
import { X, Send, Smile, MessageSquare, Flame, Sparkles } from 'lucide-react';
import { soundFx } from '../utils/soundEffects';
import { ModalWrapper } from './ModalWrapper';

export interface EmoteItem {
  id: string;
  emoji: string;
  label: string;
  category: 'joy' | 'worry' | 'laughter' | 'ahwa';
}

export const POPULAR_EGYPTIAN_EMOTES: EmoteItem[] = [
  // فرح وفخر (Joy & Pride)
  { id: 'joy_1', emoji: '🔥', label: 'ولعت!', category: 'joy' },
  { id: 'joy_2', emoji: '👑', label: 'يا معلم!', category: 'joy' },
  { id: 'joy_3', emoji: '😎', label: 'حريف!', category: 'joy' },
  { id: 'joy_4', emoji: '👏', label: 'عاش يا برنس', category: 'joy' },
  { id: 'joy_5', emoji: '🎯', label: 'باصرة!', category: 'joy' },
  { id: 'joy_6', emoji: '💪', label: 'وحش اللعبة', category: 'joy' },

  // ضحك وطقطقة (Laughter & Banter)
  { id: 'laugh_1', emoji: '😂', label: 'ههههه!', category: 'laughter' },
  { id: 'laugh_2', emoji: '🤣', label: 'مش قادر!', category: 'laughter' },
  { id: 'laugh_3', emoji: '😜', label: 'اتعلم بقى', category: 'laughter' },
  { id: 'laugh_4', emoji: '☕', label: 'شاي على حسابك', category: 'ahwa' },
  { id: 'laugh_5', emoji: '👌', label: 'على الرايق', category: 'ahwa' },

  // قلق وحظ وصدمة (Worry & Shock)
  { id: 'worry_1', emoji: '😱', label: 'يا نهار!', category: 'worry' },
  { id: 'worry_2', emoji: '😅', label: 'إيه الحظ ده!', category: 'worry' },
  { id: 'worry_3', emoji: '👀', label: 'مراقبك صح', category: 'worry' },
  { id: 'worry_4', emoji: '🤦‍♂️', label: 'ضيعت الولد!', category: 'worry' },
  { id: 'worry_5', emoji: '😭', label: 'حرام كده', category: 'worry' },
  { id: 'worry_6', emoji: '⏳', label: 'الصبر طيب', category: 'worry' },
];

export const QUICK_CAFE_MESSAGES = [
  'يا مساء الفل يا معلّم! ☕',
  'الباصرة دي جاية جاية! 🎯',
  'عاش اللعب يا حريف! 👏',
  'يا نهار أبيض على الحظ! 😅',
  'الصبر طيب يا صاحبي ⏳',
  'الولد القشاش في جيبي! 👑',
  'متستعجلش.. اللعبة لسه طويلة! 🃏',
  'هات شاي يا معلّم على حساب الخسران! 🫖',
];

interface ChatAndEmotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmote: (emote: EmoteItem) => void;
  onSendMessage: (text: string) => void;
}

export const ChatAndEmotesModal: React.FC<ChatAndEmotesModalProps> = ({
  isOpen,
  onClose,
  onSelectEmote,
  onSendMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'emotes' | 'phrases' | 'custom'>('emotes');
  const [filterCategory, setFilterCategory] = useState<'all' | 'joy' | 'laughter' | 'worry'>('all');
  const [customText, setCustomText] = useState('');

  const handlePickEmote = (emote: EmoteItem) => {
    soundFx.playClick();
    onSelectEmote(emote);
    onClose();
  };

  const handlePickPhrase = (phrase: string) => {
    soundFx.playClick();
    onSendMessage(phrase);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customText.trim();
    if (!trimmed) return;
    soundFx.playClick();
    onSendMessage(trimmed);
    setCustomText('');
    onClose();
  };

  const filteredEmotes = filterCategory === 'all'
    ? POPULAR_EGYPTIAN_EMOTES
    : POPULAR_EGYPTIAN_EMOTES.filter(
        (e) => e.category === filterCategory || (filterCategory === 'laughter' && e.category === 'ahwa')
      );

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="w-full bg-[#1A120B] border-2 border-[#8C6D46] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh] text-neutral-100 select-none font-['Cairo',sans-serif]">
        
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-[#2A180E] via-[#3D2515] to-[#2A180E] border-b border-[#5C442A] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Smile className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-amber-300 font-['El_Messiri',serif] leading-tight">
                تعبيرات وملصقات اللعب 🎭
              </h3>
              <p className="text-[10px] text-amber-200/70">تظهر فوق صورتك والترابيزة للخصم</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 border border-[#5C442A] flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Tabs */}
        <div className="grid grid-cols-3 border-b border-[#5C442A] bg-[#120B06] text-xs font-bold shrink-0">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('emotes');
            }}
            className={`py-2.5 text-center flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'emotes'
                ? 'bg-[#2A180E] text-amber-300 border-b-2 border-amber-400 shadow-inner'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ملصقات</span>
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('phrases');
            }}
            className={`py-2.5 text-center flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'phrases'
                ? 'bg-[#2A180E] text-amber-300 border-b-2 border-amber-400 shadow-inner'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            <span>جمل القهوة</span>
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('custom');
            }}
            className={`py-2.5 text-center flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'custom'
                ? 'bg-[#2A180E] text-amber-300 border-b-2 border-amber-400 shadow-inner'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-amber-400" />
            <span>رسالة خاصة</span>
          </button>
        </div>

        {/* Body Content with Scroll Area */}
        <div className="p-3.5 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* TAB 1: EMOTES & STICKERS */}
          {activeTab === 'emotes' && (
            <div className="space-y-3">
              {/* Category Filter Chips */}
              <div className="flex items-center justify-center gap-1.5 pb-1">
                {[
                  { id: 'all' as const, label: 'الكل' },
                  { id: 'joy' as const, label: '🔥 فرح وفخر' },
                  { id: 'laughter' as const, label: '😂 ضحك وطقطقة' },
                  { id: 'worry' as const, label: '😱 قلق وحظ' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      soundFx.playClick();
                      setFilterCategory(cat.id);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      filterCategory === cat.id
                        ? 'bg-amber-600 text-white shadow border border-amber-400'
                        : 'bg-[#24170E] text-neutral-400 hover:text-amber-200 border border-[#442E1B]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Grid of Emotes */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {filteredEmotes.map((emote) => (
                  <button
                    key={emote.id}
                    onClick={() => handlePickEmote(emote)}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#24170E] hover:bg-[#3D2515] border border-[#523A23] hover:border-amber-400 text-neutral-100 transition-all hover:scale-105 active:scale-95 group shadow-sm"
                  >
                    <span className="text-3xl mb-1 transform group-hover:scale-125 transition-transform drop-shadow">
                      {emote.emoji}
                    </span>
                    <span className="text-[11px] font-bold text-amber-200 text-center truncate w-full">
                      {emote.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: QUICK CAFE PHRASES */}
          {activeTab === 'phrases' && (
            <div className="flex flex-col gap-2">
              {QUICK_CAFE_MESSAGES.map((msg, i) => (
                <button
                  key={i}
                  onClick={() => handlePickPhrase(msg)}
                  className="w-full text-right px-3.5 py-2.5 rounded-xl bg-[#24170E] hover:bg-[#382315] border border-[#4D351F] hover:border-amber-500/70 text-neutral-200 hover:text-white text-xs sm:text-sm font-bold transition-all active:scale-98 shadow-sm flex items-center justify-between"
                >
                  <span>{msg}</span>
                  <span className="text-[10px] text-amber-400 opacity-60">إرسال ↵</span>
                </button>
              ))}
            </div>
          )}

          {/* TAB 3: CUSTOM MESSAGE */}
          {activeTab === 'custom' && (
            <form onSubmit={handleCustomSubmit} className="space-y-3 py-2">
              <div>
                <label className="text-xs font-bold text-amber-300 block mb-1.5 text-right">
                  اكتب رسالتك أو قفشتك الخاصة للخصم:
                </label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="مثلاً: متستعجلش على رزقك يا معلم..."
                  maxLength={45}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#24170E] border-2 border-[#543D24] focus:border-amber-400 text-neutral-100 placeholder-neutral-500 text-xs sm:text-sm font-bold outline-none transition-all shadow-inner"
                  autoFocus
                />
                <div className="text-[10px] text-neutral-400 text-left mt-1">
                  {customText.length} / 45 حرف
                </div>
              </div>

              <button
                type="submit"
                disabled={!customText.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-950 font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>إرسال الرسالة إلى الترابيزة</span>
              </button>
            </form>
          )}

        </div>

      </div>
    </ModalWrapper>
  );
};
