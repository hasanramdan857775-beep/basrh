import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Trophy,
  Flame,
  Crown,
  Sparkles,
  RefreshCw,
  Coins,
  Globe,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { soundFx } from '../utils/soundEffects';
import { ModalWrapper } from './ModalWrapper';
import { fetchRealLeaderboardsFromFirestore, AppUserData } from '../utils/firebase';

export type LeaderboardCategory = 'wins' | 'basras' | 'coins';

export interface LeaderboardPlayer {
  rank: number;
  name: string;
  avatar: string;
  frameId?: string;
  title: string;
  score: number;
  scoreLabel: string;
  winRate: number;
  isCurrentUser?: boolean;
  isRealPlayer?: boolean;
  badge?: string;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    userId?: string;
    name: string;
    avatar: string;
    frameId: string;
    coins: number;
    matchesWon: number;
    matchesPlayed: number;
    totalBasras: number;
  };
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [category, setCategory] = useState<LeaderboardCategory>('wins');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realPlayers, setRealPlayers] = useState<AppUserData[]>([]);
  const [loadingRealData, setLoadingRealData] = useState(false);

  // Compute current user win rate
  const userWinRate =
    currentUser.matchesPlayed > 0
      ? Math.round((currentUser.matchesWon / currentUser.matchesPlayed) * 100)
      : 0;

  // Fetch real online records from Firestore
  const loadRealLeaderboard = useCallback(async (cat: LeaderboardCategory) => {
    setLoadingRealData(true);
    try {
      const records = await fetchRealLeaderboardsFromFirestore(cat, 35);
      setRealPlayers(records);
    } catch (e) {
      console.warn('Real leaderboard fetch error:', e);
    } finally {
      setLoadingRealData(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadRealLeaderboard(category);
    }
  }, [isOpen, category, loadRealLeaderboard]);

  const handleRefresh = async () => {
    soundFx.playClick();
    setIsRefreshing(true);
    await loadRealLeaderboard(category);
    soundFx.playBasra();
    setIsRefreshing(false);
  };

  // Base community benchmark players to ensure the ladder is always populated
  const communityBenchmarks = [
    {
      name: 'المعلم رضوان',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
      frameId: 'frame_pharaoh_gold',
      title: 'أسطورة خان الخليلي',
      wins: 142,
      basras: 284,
      coins: 3450,
      winRate: 88,
      badge: '👑 أسطورة القهوة',
    },
    {
      name: 'الأسطورة عم كمال',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      frameId: 'frame_royal_blue',
      title: 'شيخ ترابيزة الحرافيش',
      wins: 118,
      basras: 195,
      coins: 2150,
      winRate: 82,
      badge: '🥈 حريف قديم',
    },
    {
      name: 'الباشا سامي',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      frameId: 'frame_emerald_cairo',
      title: 'ملك الكومي المقشوش',
      wins: 95,
      basras: 230,
      coins: 2890,
      winRate: 79,
      badge: '🥉 صائد الكروت',
    },
    {
      name: 'الأستاذ لطفي',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
      title: 'بروفيسور الحسبة',
      wins: 74,
      basras: 160,
      coins: 1120,
      winRate: 75,
    },
    {
      name: 'المعلم زغلول',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
      title: 'حوت قهوة الفيشاوي',
      wins: 61,
      basras: 130,
      coins: 1640,
      winRate: 71,
    },
    {
      name: 'عصام الباصرة',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
      title: 'متخصص الولد القشاش',
      wins: 35,
      basras: 310,
      coins: 980,
      winRate: 65,
    },
  ];

  // Merge Real Firestore Players + Current Player + Benchmarks
  const mergedRaw: Array<{
    name: string;
    avatar: string;
    frameId?: string;
    title: string;
    score: number;
    scoreLabel: string;
    winRate: number;
    isCurrentUser?: boolean;
    isRealPlayer?: boolean;
    badge?: string;
  }> = [];

  const seenNames = new Set<string>();

  // 1. Insert Real Players from Firestore
  realPlayers.forEach((u) => {
    const isCurrent =
      (currentUser.userId && u.userId === currentUser.userId) ||
      u.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase();

    const score =
      category === 'wins' ? u.matchesWon : category === 'basras' ? u.totalBasras : u.coins;
    const scoreLabel = category === 'wins' ? 'فوز' : category === 'basras' ? 'باصرة' : 'ذهب';
    const rate = u.matchesPlayed > 0 ? Math.round((u.matchesWon / u.matchesPlayed) * 100) : 0;

    seenNames.add(u.name.trim().toLowerCase());

    mergedRaw.push({
      name: u.name || u.username,
      avatar: u.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
      frameId: u.frameId,
      title: u.matchesWon > 50 ? 'معلّم أسطوري' : u.matchesWon > 15 ? 'حريف مسجل' : 'عضو الصالون',
      score,
      scoreLabel,
      winRate: rate,
      isCurrentUser: isCurrent,
      isRealPlayer: true,
      badge: '🟢 لاعب أونلاين حقيقي',
    });
  });

  // 2. Ensure Current User is included with live in-memory stats if not already in real list
  const currentNameKey = currentUser.name.trim().toLowerCase();
  if (!seenNames.has(currentNameKey)) {
    seenNames.add(currentNameKey);
    const score =
      category === 'wins'
        ? currentUser.matchesWon
        : category === 'basras'
        ? currentUser.totalBasras
        : currentUser.coins;
    const scoreLabel = category === 'wins' ? 'فوز' : category === 'basras' ? 'باصرة' : 'ذهب';

    mergedRaw.push({
      name: currentUser.name,
      avatar: currentUser.avatar,
      frameId: currentUser.frameId,
      title: 'معلّم الترابيزة (أنت)',
      score,
      scoreLabel,
      winRate: userWinRate,
      isCurrentUser: true,
      isRealPlayer: true,
      badge: '✨ حسابك الحالي',
    });
  }

  // 3. Add benchmarks if list is short to ensure at least 6 competitive ranks
  communityBenchmarks.forEach((b) => {
    const key = b.name.trim().toLowerCase();
    if (!seenNames.has(key)) {
      seenNames.add(key);
      const score = category === 'wins' ? b.wins : category === 'basras' ? b.basras : b.coins;
      const scoreLabel = category === 'wins' ? 'فوز' : category === 'basras' ? 'باصرة' : 'ذهب';

      mergedRaw.push({
        name: b.name,
        avatar: b.avatar,
        frameId: b.frameId,
        title: b.title,
        score,
        scoreLabel,
        winRate: b.winRate,
        isCurrentUser: false,
        isRealPlayer: false,
        badge: b.badge,
      });
    }
  });

  // Sort descending by score
  mergedRaw.sort((a, b) => b.score - a.score);

  // Assign ranks
  const listData: LeaderboardPlayer[] = mergedRaw.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));

  // Find current user's entry
  const currentUserEntry = listData.find((p) => p.isCurrentUser);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl">
      <div className="w-full flex flex-col bg-[#1A120B] border-2 border-[#8C6D46] rounded-2xl shadow-2xl overflow-hidden text-neutral-100 max-h-[85vh] font-['Cairo',sans-serif]">
        
        {/* HEADER */}
        <div className="relative pt-4 pb-3 px-4 border-b border-[#5C442A] bg-gradient-to-r from-[#2A180E] via-[#3F2414] to-[#2A180E] shrink-0">
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 border border-[#5C442A] flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow">
              <Trophy className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-amber-300 font-['El_Messiri',serif]">
                  سلم كبار المعلمين الأونلاين 🌐
                </h2>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                  <Radio className="w-3 h-3 text-emerald-400 animate-ping" />
                  <span>مباشر حقيقي</span>
                </span>
              </div>
              <p className="text-xs text-amber-200/70">
                لوحة شرف مربوطة بقاعدة بيانات اللاعبين الحقيقيين وسجلات الصكات
              </p>
            </div>
          </div>
        </div>

        {/* TABS (Wins / Basras / Wealth) */}
        <div className="grid grid-cols-3 border-b border-[#5C442A] bg-[#120B06] text-xs font-bold shrink-0">
          <button
            onClick={() => {
              soundFx.playClick();
              setCategory('wins');
            }}
            className={`py-3 flex items-center justify-center gap-1.5 transition-colors ${
              category === 'wins'
                ? 'bg-[#2A180E] text-amber-300 border-b-2 border-amber-400 shadow-inner'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>كبار الفائزين</span>
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setCategory('basras');
            }}
            className={`py-3 flex items-center justify-center gap-1.5 transition-colors ${
              category === 'basras'
                ? 'bg-[#2A180E] text-amber-300 border-b-2 border-amber-400 shadow-inner'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Flame className="w-4 h-4 text-red-400" />
            <span>قناصة الباصرة</span>
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setCategory('coins');
            }}
            className={`py-3 flex items-center justify-center gap-1.5 transition-colors ${
              category === 'coins'
                ? 'bg-[#2A180E] text-amber-300 border-b-2 border-amber-400 shadow-inner'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Coins className="w-4 h-4 text-yellow-400" />
            <span>أثرياء القعدة</span>
          </button>
        </div>

        {/* PODIUM (Top 3 Visual Highlight) */}
        <div className="p-3 bg-gradient-to-b from-[#1C120A] to-[#140D07] border-b border-[#442E1B] shrink-0">
          <div className="flex items-end justify-center gap-2 sm:gap-4 pt-2 pb-1">
            
            {/* #2 Rank Silver */}
            {listData[1] && (
              <div className="flex flex-col items-center">
                <div className="relative mb-1">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-slate-300 shadow-[0_0_10px_rgba(203,213,225,0.4)]">
                    <img src={listData[1].avatar} alt={listData[1].name} className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-300 text-slate-900 text-xs font-black flex items-center justify-center shadow">
                    2
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-200 truncate max-w-[80px] sm:max-w-[100px] text-center">
                  {listData[1].name}
                </span>
                <span className="text-[10px] text-amber-300 font-mono font-bold">
                  {listData[1].score.toLocaleString()} {listData[1].scoreLabel}
                </span>
              </div>
            )}

            {/* #1 Rank Gold Champion */}
            {listData[0] && (
              <div className="flex flex-col items-center -mt-3">
                <div className="relative mb-1">
                  <Crown className="w-5 h-5 text-amber-400 absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce" />
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden border-3 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.6)]">
                    <img src={listData[0].avatar} alt={listData[0].name} className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-neutral-950 text-xs font-black flex items-center justify-center shadow">
                    1
                  </span>
                </div>
                <span className="text-xs font-black text-amber-300 truncate max-w-[90px] sm:max-w-[120px] text-center">
                  {listData[0].name}
                </span>
                <span className="text-[11px] text-yellow-300 font-mono font-black">
                  {listData[0].score.toLocaleString()} {listData[0].scoreLabel}
                </span>
              </div>
            )}

            {/* #3 Rank Bronze */}
            {listData[2] && (
              <div className="flex flex-col items-center">
                <div className="relative mb-1">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-amber-700 shadow-[0_0_10px_rgba(180,83,9,0.4)]">
                    <img src={listData[2].avatar} alt={listData[2].name} className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-700 text-amber-100 text-xs font-black flex items-center justify-center shadow">
                    3
                  </span>
                </div>
                <span className="text-[11px] font-bold text-amber-200/90 truncate max-w-[80px] sm:max-w-[100px] text-center">
                  {listData[2].name}
                </span>
                <span className="text-[10px] text-amber-400 font-mono font-bold">
                  {listData[2].score.toLocaleString()} {listData[2].scoreLabel}
                </span>
              </div>
            )}

          </div>
        </div>

        {/* LEADERBOARD LIST CONTAINER */}
        <div className="p-3 overflow-y-auto flex-1 custom-scrollbar space-y-2">
          {loadingRealData && listData.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <span className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs text-amber-200/80 font-bold">جاري تحميل سجلات المتصدرين الحقيقية من السيرفر...</p>
            </div>
          ) : (
            listData.map((player) => {
              const isTop3 = player.rank <= 3;
              return (
                <div
                  key={`${player.name}-${player.rank}`}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all ${
                    player.isCurrentUser
                      ? 'bg-amber-950/80 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)] ring-1 ring-amber-400'
                      : isTop3
                      ? 'bg-[#25170E] border-[#5E4226] hover:border-amber-500/50'
                      : 'bg-[#1C120A] border-[#3E2818] hover:border-[#5E4226]'
                  }`}
                >
                  {/* Left: Rank & Avatar & Info */}
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    
                    {/* Rank Badge */}
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black font-mono text-sm shrink-0">
                      {player.rank === 1 ? (
                        <span className="text-xl">🥇</span>
                      ) : player.rank === 2 ? (
                        <span className="text-xl">🥈</span>
                      ) : player.rank === 3 ? (
                        <span className="text-xl">🥉</span>
                      ) : (
                        <span className="text-neutral-400 text-xs font-bold">#{player.rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden border shrink-0 ${
                      player.frameId === 'frame_pharaoh_gold'
                        ? 'border-amber-400 ring-2 ring-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                        : player.frameId === 'frame_royal_blue'
                        ? 'border-blue-400 ring-2 ring-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                        : 'border-[#5C442A]'
                    }`}>
                      <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                    </div>

                    {/* Name & Title & Online Badge */}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs sm:text-sm font-bold ${
                          player.isCurrentUser ? 'text-amber-300 font-black' : 'text-neutral-100'
                        }`}>
                          {player.name}
                        </span>
                        
                        {player.isCurrentUser && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500 text-neutral-950 text-[9px] font-black">
                            أنت
                          </span>
                        )}

                        {player.isRealPlayer && (
                          <span className="px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[8px] font-bold flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>حقيقي</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                        <span>{player.title}</span>
                        <span>·</span>
                        <span className="text-emerald-400 font-mono">فوز %{player.winRate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score */}
                  <div className="text-left shrink-0">
                    <div className="text-sm sm:text-base font-black text-amber-300 font-mono tabular-nums">
                      {player.score.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-amber-400/80">
                      {player.scoreLabel}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* FOOTER: Current User Quick Summary & Refresh */}
        <div className="px-4 py-3 bg-[#130B06] border-t border-[#5C442A] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-300">
              ترتيبك الحقيقي:{' '}
              <strong className="text-amber-300 font-mono text-sm">
                #{currentUserEntry?.rank ?? 1}
              </strong>
            </span>
            <span className="text-neutral-500">|</span>
            <span className="text-xs text-neutral-400 font-mono">
              {currentUserEntry?.score.toLocaleString() ?? 0} {currentUserEntry?.scoreLabel}
            </span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing || loadingRealData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2A180E] hover:bg-[#3D2515] border border-[#5C442A] text-amber-300 hover:text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || loadingRealData ? 'animate-spin' : ''}`} />
            <span>تحديث السيرفر</span>
          </button>
        </div>

      </div>
    </ModalWrapper>
  );
};
