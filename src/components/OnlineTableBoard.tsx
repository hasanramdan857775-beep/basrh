import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  Share2,
  Users,
  Trophy,
  Loader2,
  MessageCircle,
  Smartphone,
  Monitor,
  Flame,
  Volume2,
  VolumeX,
  Coffee,
  MessageSquare,
  Smile,
} from 'lucide-react';
import { Card, OnlineRoomData, GameSettings, DisplayMode } from '../types/game';
import { PlayingCard } from './PlayingCard';
import { ChatAndEmotesModal, EmoteItem } from './ChatAndEmotesModal';
import { TableParticlesOverlay, TableParticlesHandle } from './TableParticlesOverlay';
import {
  subscribeToRoom,
  playOnlineCard,
  sendOnlineChatMessage,
  restartOnlineMatch,
  leaveOnlineRoom,
} from '../utils/firebase';
import { soundFx } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

import tableFeltImg from '../assets/images/table_felt_texture_1790479618945.jpg';
import cardBackImg from '../assets/images/kotshina_card_back_1790479632765.jpg';

interface OnlineTableBoardProps {
  initialRoom: OnlineRoomData;
  myPlayerId: string;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onLeaveRoom: () => void;
  userProfile: {
    name: string;
    avatar: string;
    frameId: string;
  };
}

export const OnlineTableBoard: React.FC<OnlineTableBoardProps> = ({
  initialRoom,
  myPlayerId,
  settings,
  onUpdateSettings,
  onLeaveRoom,
  userProfile,
}) => {
  const [room, setRoom] = useState<OnlineRoomData>(initialRoom);
  const particlesRef = useRef<TableParticlesHandle | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeBasraBanner, setActiveBasraBanner] = useState<{
    text: string;
    subText: string;
    points: number;
  } | null>(null);
  const [lastActionText, setLastActionText] = useState<string>('بدأت الجولة أونلاين!');
  const [floatingEmotes, setFloatingEmotes] = useState<{ [playerId: string]: EmoteItem }>({});
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const lastActionTimestamp = useRef<number>(0);

  const isHost = myPlayerId === room.hostId;
  const isMyTurn = room.currentTurn === myPlayerId;

  // Me & Opponent details
  const myName = isHost ? room.hostName : room.guestName || userProfile.name;
  const myAvatar = isHost ? room.hostAvatar : room.guestAvatar || userProfile.avatar;
  const myFrameId = isHost ? room.hostFrameId : room.guestFrameId;
  const myScore = isHost ? room.hostScore : room.guestScore;
  const myCapturedCount = isHost ? (room.hostCapturedCards || []).length : (room.guestCapturedCards || []).length;
  const myBasraCount = isHost ? room.hostBasras : room.guestBasras;
  const myHand = isHost ? (room.hostHand || []) : (room.guestHand || []);

  const opponentName = isHost ? room.guestName || 'في انتظار الخصم...' : room.hostName;
  const opponentAvatar = isHost ? room.guestAvatar : room.hostAvatar;
  const opponentFrameId = isHost ? room.guestFrameId : room.hostFrameId;
  const opponentScore = isHost ? room.guestScore : room.hostScore;
  const opponentCapturedCount = isHost ? (room.guestCapturedCards || []).length : (room.hostCapturedCards || []).length;
  const opponentBasraCount = isHost ? room.guestBasras : room.hostBasras;
  const opponentHandCount = isHost ? (room.guestHand || []).length : (room.hostHand || []).length;

  // Keyboard shortcut support (1, 2, 3, 4) for desktop online gameplay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isMyTurn || room.status !== 'playing') return;
      if (['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        const targetCard = myHand[index];
        if (targetCard) {
          if (selectedCardId === targetCard.id) {
            setSelectedCardId(null);
            handlePlayCard(targetCard);
          } else {
            setSelectedCardId(targetCard.id);
            soundFx.playCardFlip();
          }
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (selectedCardId) {
          const targetCard = myHand.find((c) => c.id === selectedCardId);
          if (targetCard) {
            setSelectedCardId(null);
            handlePlayCard(targetCard);
          }
        }
      } else if (e.key === 'Escape') {
        setSelectedCardId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMyTurn, room.status, myHand, selectedCardId]);

  // Click on card: single-tap if enabled, or 1st click selects & 2nd click plays
  const handleCardClick = (card: Card) => {
    if (!isMyTurn || room.status !== 'playing') return;

    if (settings.singleTapPlay) {
      setSelectedCardId(null);
      handlePlayCard(card);
      return;
    }

    if (selectedCardId === card.id) {
      // Second click on the selected card: Play it!
      setSelectedCardId(null);
      handlePlayCard(card);
    } else {
      // First click: Select card
      setSelectedCardId(card.id);
      soundFx.playCardFlip();
    }
  };

  // Activate Ahwa ambience on online match start
  useEffect(() => {
    soundFx.setVolume(settings.soundVolume);
    if (settings.ambientSound) {
      soundFx.startAhwaAtmosphere(true);
    }
    return () => {
      soundFx.stopAhwaAtmosphere();
    };
  }, [settings.ambientSound, settings.soundVolume]);

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToRoom(
      room.roomId,
      (updatedRoom) => {
        setRoom(updatedRoom);

        // Check if a new action happened
        if (
          updatedRoom.lastAction &&
          updatedRoom.lastAction.timestamp !== lastActionTimestamp.current
        ) {
          lastActionTimestamp.current = updatedRoom.lastAction.timestamp;
          const act = updatedRoom.lastAction;

          if (act.isBasra) {
            soundFx.playBasra();
            particlesRef.current?.trigger(
              act.isJackBasra ? 'jack_basra' : 'basra',
              undefined,
              undefined,
              act.basraPoints
            );
            setActiveBasraBanner({
              text: act.isJackBasra ? 'باصرة ولد نار! 🔥' : 'باصرة يا معلم! 💥',
              subText: `${act.playerName} مسح الترابيزة (+${act.basraPoints} نقطة)`,
              points: act.basraPoints,
            });
            setTimeout(() => setActiveBasraBanner(null), 2500);
          } else if (act.eatCount > 0) {
            soundFx.playCardEat();
            if (act.card.rank === 'J') {
              particlesRef.current?.trigger('sweep');
            } else {
              particlesRef.current?.trigger('eat');
            }
            setLastActionText(`${act.playerName} أكل ${act.eatCount} كروت بـ ${act.card.rank}`);
          } else {
            soundFx.playCardFlip();
            setLastActionText(`${act.playerName} رمى ${act.card.rank} على الترابيزة`);
          }
        }
      },
      (err) => {
        console.error('Subscription error:', err);
      }
    );

    return () => unsubscribe();
  }, [room.roomId]);

  // Handle playing a card
  const handlePlayCard = async (card: Card) => {
    if (!isMyTurn || room.status !== 'playing') {
      return;
    }
    soundFx.playCardFlip();
    try {
      await playOnlineCard(room, myPlayerId, card, settings.jackBasraValue);
    } catch (err) {
      console.error('Error playing online card:', err);
    }
  };

  // Handle in-game chat message
  const handleSendMessage = (text: string) => {
    soundFx.playClick();
    sendOnlineChatMessage(room.roomId, {
      senderId: myPlayerId,
      senderName: myName,
      text,
      isEmote: false,
    });
  };

  // Handle in-game sticker or emote
  const handleSendSticker = (sticker: string) => {
    soundFx.playClick();
    sendOnlineChatMessage(room.roomId, {
      senderId: myPlayerId,
      senderName: myName,
      text: sticker,
      isEmote: true,
    });
  };

  const handleSelectEmote = (emote: EmoteItem) => {
    soundFx.playClick();
    setFloatingEmotes((prev) => ({ ...prev, [myPlayerId]: emote }));
    setTimeout(() => {
      setFloatingEmotes((prev) => {
        const copy = { ...prev };
        delete copy[myPlayerId];
        return copy;
      });
    }, 3000);

    sendOnlineChatMessage(room.roomId, {
      senderId: myPlayerId,
      senderName: myName,
      text: `${emote.emoji} ${emote.label}`,
      isEmote: true,
    });
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${room.roomId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    soundFx.playCardFlip();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleToggleDisplayMode = () => {
    const next: DisplayMode =
      settings.displayMode === 'auto'
        ? 'mobile'
        : settings.displayMode === 'mobile'
        ? 'desktop'
        : 'auto';
    onUpdateSettings({ displayMode: next });
    soundFx.playClick();
  };

  const isMatchOver = room.status === 'completed';
  const winnerIsMe = room.winnerId === myPlayerId;

  // Layout mode classes
  const isMobileMode = settings.displayMode === 'mobile';
  const isDesktopMode = settings.displayMode === 'desktop';

  const containerClasses = isMobileMode
    ? 'w-full max-w-md mx-auto min-h-screen sm:border-x-4 sm:border-amber-900/60 sm:shadow-[0_0_50px_rgba(0,0,0,0.9)]'
    : isDesktopMode
    ? 'w-full max-w-7xl mx-auto min-h-screen'
    : 'w-full min-h-screen';

  return (
    <div
      className={`relative flex flex-col justify-between select-none min-h-[100dvh] overflow-x-hidden overflow-y-auto overscroll-y-contain font-['Cairo',sans-serif] bg-neutral-950 text-neutral-100 touch-manipulation ${containerClasses}`}
      style={{
        backgroundImage: `radial-gradient(ellipse at 50% 50%, rgba(5, 46, 22, 0.7) 0%, rgba(8, 20, 14, 0.95) 75%), url(${tableFeltImg})`,
        backgroundSize: 'cover',
      }}
    >
      {/* Decorative Table Felt Border */}
      <div className="absolute inset-0 pointer-events-none border-[8px] sm:border-[16px] border-[#2A180E] shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] z-0" />
      <div className="absolute inset-[6px] sm:inset-[14px] pointer-events-none border border-[#8C6D46]/40 z-0" />

      {/* TOP HEADER: Opponent HUD, Room Code & Display Switcher */}
      <header className="relative z-20 w-full px-3 sm:px-6 pt-2.5 sm:pt-4 flex items-center justify-between gap-2">
        
        {/* Opponent Info (Top) */}
        <div className="flex items-center gap-2 sm:gap-3 bg-[#160E08]/90 border border-[#5C442A] p-1.5 sm:p-2 rounded-xl shadow-lg">
          <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-lg overflow-hidden border-2 border-amber-700 shadow shrink-0 bg-black/50 flex items-center justify-center">
            {opponentAvatar ? (
              <img
                src={opponentAvatar}
                alt={opponentName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Users className="w-5 h-5 text-amber-400 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-neutral-100 truncate max-w-[110px] sm:max-w-[150px]">
                {opponentName}
              </span>
              {room.status === 'playing' && room.currentTurn !== myPlayerId && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-amber-300">
              <span>سكور: <strong className="font-mono text-xs">{opponentScore}</strong></span>
              <span>·</span>
              <span>لمّة: <strong className="font-mono">{opponentCapturedCount}</strong></span>
              {opponentBasraCount > 0 && (
                <span className="text-red-400 font-bold">· باصرة: {opponentBasraCount}</span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Room Code Badge & Direct Link Copy */}
        <div className="flex flex-col items-center">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 border border-amber-500/60 hover:border-amber-400 text-amber-300 text-[11px] sm:text-xs font-mono font-black shadow-md transition-all active:scale-95 cursor-pointer"
            title="انقر لنسخ رابط الغرفة المباشر"
          >
            <span>ترابيزة: {room.roomId}</span>
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <span className="text-[9px] sm:text-[10px] text-amber-200/70 mt-0.5 font-bold">
            هدف الصكة: {room.targetScore} نقطة
          </span>
        </div>

        {/* Right Controls: Display Mode & Exit */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Quick Display Mode Toggle */}
          <button
            onClick={handleToggleDisplayMode}
            className="px-2 py-1.5 rounded-lg bg-[#1A120B]/80 border border-[#5C442A] text-amber-200 hover:text-white text-xs font-bold transition-colors shadow flex items-center gap-1"
            title={`الوضع الحالي: ${
              settings.displayMode === 'mobile'
                ? 'موبايل 📱'
                : settings.displayMode === 'desktop'
                ? 'كمبيوتر 💻'
                : 'تلقائي 🔄'
            }`}
          >
            {settings.displayMode === 'mobile' ? (
              <Smartphone className="w-4 h-4 text-amber-400" />
            ) : settings.displayMode === 'desktop' ? (
              <Monitor className="w-4 h-4 text-emerald-400" />
            ) : (
              <span className="text-xs">🔄</span>
            )}
            <span className="hidden md:inline text-[10px]">
              {settings.displayMode === 'mobile'
                ? 'موبايل'
                : settings.displayMode === 'desktop'
                ? 'كمبيوتر'
                : 'تلقائي'}
            </span>
          </button>

          {/* Quick Ahwa Ambience Toggle */}
          <button
            onClick={() => {
              const nextVal = !settings.ambientSound;
              onUpdateSettings({ ambientSound: nextVal });
              if (nextVal) {
                soundFx.startAhwaAtmosphere(true);
              } else {
                soundFx.stopAhwaAtmosphere();
              }
              soundFx.playClick();
            }}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border transition-all flex items-center justify-center shadow ${
              settings.ambientSound
                ? 'bg-amber-950/80 border-amber-500/80 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'bg-[#1A120B]/80 border-[#5C442A] text-neutral-500 hover:text-amber-200'
            }`}
            title={`أجواء القهوة الشعبية (كراسي، شاي، غلي قهوة): ${settings.ambientSound ? 'مفعلة ☕' : 'مكتومة 🔇'}`}
          >
            <Coffee className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Exit Room */}
          <button
            onClick={() => {
              soundFx.playClick();
              if (window.confirm('هل أنت متأكد من مغادرة هذه الترابيزة المباشرة؟')) {
                leaveOnlineRoom(room.roomId, myPlayerId);
                onLeaveRoom();
              }
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1A120B]/80 border border-[#5C442A] flex items-center justify-center text-amber-200 hover:text-white transition-colors shadow"
            title="مغادرة الترابيزة"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

      </header>

      {/* OPPONENT HAND (Cards face-down) */}
      <div className="relative z-10 flex flex-col items-center mt-1">
        {room.status === 'waiting' ? (
          <div className="py-2 px-4 rounded-xl bg-amber-950/80 border border-amber-600/40 text-amber-300 text-xs flex items-center gap-2 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span>في انتظار انضمام الخصم عبر الكود أو الرابط...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center -space-x-3 sm:-space-x-5">
            {Array.from({ length: opponentHandCount }).map((_, idx) => (
              <div
                key={idx}
                className="transform transition-transform"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <PlayingCard
                  card={{ id: `opp-${idx}`, suit: 'hearts', rank: 'A', value: 1 }}
                  isFaceUp={false}
                  size={isMobileMode ? 'xs' : 'sm'}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CENTER PLAYING FELT */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-2 sm:px-4 py-2 w-full">
        {/* Dynamic Card Eating & Basra Particles Overlay */}
        <TableParticlesOverlay ref={particlesRef} />
        
        {/* Remaining Deck Pile on the Side */}
        <div className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none opacity-80 sm:opacity-100">
          <div className="relative w-10 h-14 sm:w-14 sm:h-20">
            {room.deck && room.deck.length > 0 ? (
              <>
                <div className="absolute inset-0 bg-red-950 rounded-md border border-amber-900/50 shadow-md translate-x-0.5 translate-y-0.5" />
                <PlayingCard
                  card={{ id: 'deck-top', suit: 'hearts', rank: 'A', value: 1 }}
                  isFaceUp={false}
                  size="xs"
                />
              </>
            ) : (
              <div className="w-10 h-14 sm:w-14 sm:h-20 rounded-md border-2 border-dashed border-amber-700/40 flex items-center justify-center text-[8px] sm:text-[10px] text-amber-400 font-bold">
                فرغت
              </div>
            )}
          </div>
          <span className="text-[9px] sm:text-[11px] font-bold text-amber-200 mt-0.5 font-mono tabular-nums">
            {(room.deck || []).length} كارت
          </span>
        </div>

        {/* Center Cards on Table */}
        <div className="relative flex flex-wrap items-center justify-center gap-2 sm:gap-4 max-w-xl min-h-[120px] sm:min-h-[160px] p-3 rounded-2xl bg-black/25 backdrop-blur-[2px] border border-emerald-900/30">
          {(!room.tableCards || room.tableCards.length === 0) ? (
            <div className="text-center text-emerald-200/70 font-bold text-xs sm:text-sm py-6 animate-pulse">
              الترابيزة ممسوحة نظيفة! ارمي ورقة من يدك 🃏
            </div>
          ) : (
            room.tableCards.map((card, idx) => {
              const rotationDeg = ((idx % 5) - 2) * 2.5;
              return (
                <div
                  key={card.id || idx}
                  style={{ transform: `rotate(${rotationDeg}deg)` }}
                >
                  <PlayingCard
                    card={card}
                    isFaceUp={true}
                    size={isMobileMode ? 'sm' : 'md'}
                    className="transition-all duration-300"
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Turn & Action Status Indicator */}
        <div className="mt-3 px-4 py-1.5 rounded-full bg-[#120C07]/85 border border-[#5C442A] text-amber-200 text-xs sm:text-sm font-bold shadow-md flex items-center gap-2">
          {isMyTurn ? (
            <span className="text-emerald-400 flex items-center gap-1 animate-pulse">
              ● دورك الآن: العب كارت
            </span>
          ) : (
            <span className="text-amber-400 flex items-center gap-1">
              ● دور الخصم يفكر...
            </span>
          )}
          <span className="text-neutral-400">|</span>
          <span className="truncate max-w-[200px]">{lastActionText}</span>
        </div>

        {/* Basra Celebration Banner (Overlay Animation) */}
        {activeBasraBanner && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none animate-in zoom-in-75 duration-300">
            <div className="flex flex-col items-center px-8 py-5 rounded-2xl bg-gradient-to-b from-[#8B1A1A] to-[#4A0E0E] border-4 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.8)] text-center">
              <span className="text-3xl sm:text-5xl font-black text-amber-300 font-['El_Messiri',serif] tracking-wider drop-shadow-lg animate-bounce">
                {activeBasraBanner.text}
              </span>
              <span className="text-base sm:text-xl font-bold text-white mt-1">
                {activeBasraBanner.subText}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* BOTTOM AREA: Player Hand and Player Profile HUD */}
      <footer className="relative z-20 w-full px-2.5 sm:px-6 pb-2.5 sm:pb-4 flex flex-col items-center">
        
        {/* Floating Emote for player */}
        {floatingEmotes[myPlayerId] && (
          <div className="mb-2 px-3 py-1.5 rounded-2xl bg-amber-500 text-neutral-950 text-xs sm:text-sm font-black shadow-[0_4px_25px_rgba(245,158,11,0.8)] border-2 border-white flex items-center gap-1.5 animate-in zoom-in duration-200">
            <span className="text-2xl">{floatingEmotes[myPlayerId].emoji}</span>
            <span>{floatingEmotes[myPlayerId].label}</span>
          </div>
        )}

        {/* Selected Card Action Prompt (Double-Click indicator) */}
        {selectedCardId && (
          <div
            onClick={() => {
              const card = myHand.find((c) => c.id === selectedCardId);
              if (card) {
                handleCardClick(card);
              }
            }}
            className="mb-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 text-xs font-black shadow-[0_0_20px_rgba(245,158,11,0.7)] border-2 border-white flex items-center gap-2 cursor-pointer animate-bounce select-none"
          >
            <span>🎯 انقر الكارت مجدداً (أو اضغط هنا) لرميه على الترابيزة</span>
          </div>
        )}

        {/* My Hand Cards (Interactive with Double-Click or Single-Tap) */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-3 mb-2 touch-manipulation">
          {myHand.map((card, idx) => (
            <div
              key={card.id || idx}
              className="animate-card-slide-bottom touch-manipulation"
              style={{ animationDelay: `${idx * 0.04}s` }}
            >
              <PlayingCard
                card={card}
                isFaceUp={true}
                isSelectable={isMyTurn && room.status === 'playing'}
                isSelected={selectedCardId === card.id}
                onClick={() => handleCardClick(card)}
                size={isMobileMode ? 'md' : 'lg'}
              />
            </div>
          ))}
        </div>

        {/* Bottom Bar: In-Game Chat & My Profile Badge */}
        <div className="w-full flex items-center justify-between gap-2">
          
          {/* Chat & Emotes */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playClick();
                setIsChatModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1A120B]/90 hover:bg-[#2A180E] border border-[#5C442A] hover:border-amber-400 text-amber-300 hover:text-white text-xs font-bold shadow-lg transition-all active:scale-95 group"
              title="تعبيرات وملصقات ودردشة اللعب"
            >
              <MessageSquare className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">شات وملصقات</span>
              <Smile className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            </button>

            <div className="text-[11px] sm:text-xs text-amber-200/90 font-bold hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-amber-900/40">
              {selectedCardId ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-amber-300">الكارت محدد 👆 انقر عليه ثانية للنزول</span>
                </>
              ) : (
                <>
                  <span className="text-amber-400">👆</span>
                  <span>نقرة لتحديد الكارت، ونقرة ثانية للنزول على الترابيزة</span>
                </>
              )}
            </div>
          </div>

          {/* Player Profile Badge */}
          <div className="flex items-center gap-2 sm:gap-3 bg-[#1A120B]/90 border border-[#5C442A] p-1.5 sm:p-2 rounded-xl shadow-lg shrink-0">
            <div className="text-left sm:text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="font-bold text-xs sm:text-sm text-neutral-100">{myName} (أنت)</span>
                {isMyTurn && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
              </div>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-amber-300">
                <span>سكور: <strong className="font-mono text-xs sm:text-sm">{myScore}</strong></span>
                <span>·</span>
                <span>لمّة: <strong className="font-mono">{myCapturedCount}</strong></span>
                {myBasraCount > 0 && (
                  <span className="text-red-400 font-bold">· باصرة: {myBasraCount}</span>
                )}
              </div>
            </div>

            {/* Profile Avatar with Emote Button */}
            <div className="relative">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setIsChatModalOpen(true);
                }}
                className="absolute -top-2 -right-2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 bg-[#2A180E]/95 hover:bg-[#3D2515] text-amber-300 hover:text-white border-amber-500/80 hover:scale-105 active:scale-90 flex items-center justify-center shadow-lg transition-all"
                title="أرسل تعبير أو ملصق"
              >
                <Smile className="w-4 h-4 sm:w-4.5 sm:h-4.5 animate-pulse" />
              </button>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden border-2 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                <img
                  src={myAvatar}
                  alt={myName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

        </div>

      </footer>

      {/* UNIFIED CHAT AND EMOTES MODAL (FIXED & RESPONSIVE - NEVER CUT OFF) */}
      <ChatAndEmotesModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        onSelectEmote={handleSelectEmote}
        onSendMessage={handleSendMessage}
      />

      {/* MATCH VICTORY / GAME OVER OVERLAY */}
      {isMatchOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#1A120B] border-2 border-[#8C6D46] rounded-2xl shadow-2xl p-6 text-neutral-100 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-950/80 border border-amber-500 flex items-center justify-center text-amber-300 mb-3 shadow-[0_0_25px_rgba(245,158,11,0.5)]">
              <Trophy className="w-9 h-9" />
            </div>

            <h3 className="text-3xl font-black text-amber-300 font-['El_Messiri',serif]">
              {winnerIsMe ? 'مبروك الفوز يا معلم! 🏆' : 'هاردلك.. الماتش للخصم! 👏'}
            </h3>
            <p className="text-xs text-neutral-300 mt-1">
              النتيجة النهائية: {myName} ({myScore}) ضد {opponentName} ({opponentScore})
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  soundFx.playClick();
                  restartOnlineMatch(room.roomId, room.targetScore);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-neutral-950 font-black text-sm shadow-xl transition-all active:scale-95"
              >
                صكة تانية (Rematch) 🃏
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  onLeaveRoom();
                }}
                className="py-3 px-4 rounded-xl bg-[#24170E] hover:bg-[#382315] border border-amber-600/40 text-amber-300 font-bold text-xs transition-colors"
              >
                خروج للقائمة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
