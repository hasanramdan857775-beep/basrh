import React, { useState } from 'react';
import { X, Copy, Check, Share2, Globe, Users, ArrowRight, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModalWrapper } from './ModalWrapper';
import { soundFx } from '../utils/soundEffects';
import { createOnlineRoom, joinOnlineRoom } from '../utils/firebase';
import { OnlineRoomData } from '../types/game';

interface OnlineLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: {
    name: string;
    avatar: string;
    frameId: string;
  };
  onRoomJoined: (room: OnlineRoomData, isHost: boolean) => void;
  initialRoomCode?: string;
}

export const OnlineLobbyModal: React.FC<OnlineLobbyModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onRoomJoined,
  initialRoomCode = '',
}) => {
  const [tab, setTab] = useState<'create' | 'join'>(initialRoomCode ? 'join' : 'create');
  const [targetScore, setTargetScore] = useState<number>(101);
  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode);
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const getDirectLink = (code: string) => {
    return `${window.location.origin}${window.location.pathname}?room=${code}`;
  };

  const handleCreateRoom = async () => {
    soundFx.playClick();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const myPlayerId = `player-${userProfile.name}-${Date.now().toString(36)}`;
      // Save playerId in session
      sessionStorage.setItem('basra_online_player_id', myPlayerId);

      const roomId = await createOnlineRoom({
        hostId: myPlayerId,
        hostName: userProfile.name,
        hostAvatar: userProfile.avatar,
        hostFrameId: userProfile.frameId,
        targetScore,
      });

      setCreatedRoomId(roomId);
      soundFx.playCardFlip();
    } catch (err: any) {
      console.error('Error creating room:', err);
      setErrorMsg('تعذر إنشاء الغرفة. تأكد من اتصالك بالإنترنت.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (codeToJoin?: string) => {
    const code = (codeToJoin || roomCodeInput).trim().toUpperCase();
    if (!code || code.length < 4) {
      setErrorMsg('يرجى كتابة كود الترابيزة الصحيح (مثال: AHWA88)');
      return;
    }

    soundFx.playClick();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      let myPlayerId = sessionStorage.getItem('basra_online_player_id');
      if (!myPlayerId) {
        myPlayerId = `player-${userProfile.name}-${Date.now().toString(36)}`;
        sessionStorage.setItem('basra_online_player_id', myPlayerId);
      }

      const roomData = await joinOnlineRoom(code, {
        guestId: myPlayerId,
        guestName: userProfile.name,
        guestAvatar: userProfile.avatar,
        guestFrameId: userProfile.frameId,
      });

      soundFx.playWin();
      onRoomJoined(roomData, false);
      onClose();
    } catch (err: any) {
      console.error('Error joining room:', err);
      setErrorMsg(err.message || 'تعذر الانضمام للترابيزة.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = (code: string) => {
    const url = getDirectLink(code);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    soundFx.playCardFlip();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareLink = async (code: string) => {
    const url = getDirectLink(code);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'باصرة مصرية أونلاين - تعال العب معايا!',
          text: `المعلم ${userProfile.name} عازمك على صكة باصرة أونلاين! ادخل من الرابط:`,
          url,
        });
      } catch {}
    } else {
      handleCopyLink(code);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="relative w-full max-h-[88dvh] flex flex-col bg-[#160E08] border-2 border-[#8C6D46] rounded-2xl shadow-2xl overflow-hidden text-neutral-100">
        
        {/* Header */}
        <div className="relative flex flex-col items-center pt-5 pb-3 border-b border-[#523A25] bg-gradient-to-b from-[#24170E] to-[#160E08] shrink-0">
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="absolute top-4 left-4 p-1.5 rounded-full bg-neutral-800/80 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-amber-400 animate-pulse" />
            <h2 className="text-2xl font-black text-[#E8C288] font-['El_Messiri',serif] tracking-wide">
              صالون اللعب أونلاين
            </h2>
          </div>
          <p className="text-xs text-amber-200/70 mt-1">
            العب مع أصحابك مباشرة عبر رابط دعوة سريع وغرف سحابية مباشرة
          </p>

          {/* Navigation Tabs (Only if not waiting in created room) */}
          {!createdRoomId && (
            <div className="flex items-center gap-2 mt-4 p-1 bg-black/40 rounded-xl border border-amber-900/40">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setTab('create');
                  setErrorMsg(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === 'create'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                فتح ترابيزة جديدة ➕
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setTab('join');
                  setErrorMsg(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === 'join'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                انضمام بكود أو رابط 🔗
              </button>
            </div>
          )}
        </div>

        {/* Modal Body - Smooth vertical scrollable */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain custom-scrollbar">
          
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2 font-medium"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* STATE 1: ROOM CREATED & WAITING FOR GUEST */}
          {createdRoomId ? (
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/60 to-black/80 border-2 border-amber-500/50 shadow-inner">
                <span className="text-xs text-amber-300 font-bold uppercase tracking-wider block mb-1">
                  كود الترابيزة المباشر
                </span>
                <div className="text-4xl sm:text-5xl font-mono font-black text-amber-200 tracking-widest my-2 select-all">
                  {createdRoomId}
                </div>
                <p className="text-[11px] text-neutral-300">
                  شارك هذا الكود مع صديقك أو انسخ الرابط المباشر أدناه للدخول فوراً بدون كتابة
                </p>
              </div>

              {/* Direct Link Share Actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => handleCopyLink(createdRoomId)}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-neutral-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-950" />
                      <span>تم نسخ الرابط المباشر! ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>نسخ رابط الترابيزة المباشر</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleShareLink(createdRoomId)}
                  className="py-3 px-4 rounded-xl bg-[#2A1D13] hover:bg-[#3D2718] border border-amber-600/50 text-amber-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  <span>مشاركة عبر واتساب أو تليجرام</span>
                </button>
              </div>

              {/* Waiting Radar Animation */}
              <div className="flex flex-col items-center justify-center py-4 border-t border-[#442D19] mt-3">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-amber-500 animate-ping opacity-35" />
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                </div>
                <p className="text-sm font-black text-amber-200 mt-2 font-['El_Messiri',serif]">
                  في انتظار دخول المعلم الثاني...
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  بمجرد دخول صديقك ستبدأ صكة الباصرة فوراً تلقائياً!
                </p>
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    // Go to table as host (it will wait there with live snapshot)
                    const myPlayerId = sessionStorage.getItem('basra_online_player_id') || '';
                    onRoomJoined(
                      {
                        roomId: createdRoomId,
                        hostId: myPlayerId,
                        hostName: userProfile.name,
                        hostAvatar: userProfile.avatar,
                        hostFrameId: userProfile.frameId,
                        status: 'waiting',
                        targetScore,
                        currentTurn: myPlayerId,
                        roundNumber: 1,
                        tableCards: [],
                        deck: [],
                        hostHand: [],
                        guestHand: [],
                        hostCapturedCards: [],
                        guestCapturedCards: [],
                        hostBasras: 0,
                        guestBasras: 0,
                        hostScore: 0,
                        guestScore: 0,
                        chatMessages: [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      },
                      true
                    );
                    onClose();
                  }}
                  className="px-6 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <span>الدخول لترابيزة اللعب والانتظار هناك ←</span>
                </button>
              </div>
            </div>
          ) : tab === 'create' ? (
            /* TAB: CREATE NEW ROOM */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#22160D] border border-[#523A25] space-y-2">
                <label className="text-xs font-bold text-amber-300 block">
                  نقاط الفوز بالصكة:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[51, 101, 151].map((pts) => (
                    <button
                      key={pts}
                      onClick={() => {
                        soundFx.playClick();
                        setTargetScore(pts);
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        targetScore === pts
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'bg-neutral-900/60 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {pts === 51 ? '٥١ نقطة (سريعة)' : pts === 101 ? '١٠١ نقطة (كلاسيك)' : '١٥١ نقطة (طويلة)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#22160D] border border-[#523A25] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={userProfile.avatar}
                    alt={userProfile.name}
                    className="w-10 h-10 rounded-full border-2 border-amber-500 object-cover"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">{userProfile.name}</span>
                    <span className="text-[10px] text-amber-400 font-semibold">مضيف الترابيزة (Host)</span>
                  </div>
                </div>
                <span className="text-[11px] text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  متصل ومستعد
                </span>
              </div>

              <button
                disabled={isLoading}
                onClick={handleCreateRoom}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-neutral-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-current" />
                    <span>إنشاء الترابيزة وتوليد الرابط المباشر ⚡</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* TAB: JOIN ROOM */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#22160D] border border-[#523A25] space-y-2">
                <label className="text-xs font-bold text-amber-300 block">
                  أدخل كود الترابيزة أو الصق الرابط المباشر:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="مثال: AHWA88 أو الصق رابط الغرفة"
                    value={roomCodeInput}
                    onChange={(e) => {
                      let val = e.target.value;
                      // If user pasted a full URL with ?room=CODE
                      if (val.includes('room=')) {
                        const match = val.match(/room=([A-Za-z0-9_-]+)/);
                        if (match && match[1]) {
                          val = match[1];
                        }
                      }
                      setRoomCodeInput(val.toUpperCase());
                      setErrorMsg(null);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-black/50 border border-amber-600/50 text-amber-200 placeholder-neutral-500 text-sm font-mono tracking-widest uppercase focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  {roomCodeInput && (
                    <button
                      onClick={() => setRoomCodeInput('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <button
                disabled={isLoading || !roomCodeInput.trim()}
                onClick={() => handleJoinRoom()}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>دخول الترابيزة وبدء اللعب الآن 🃏</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>

      </div>
    </ModalWrapper>
  );
};
