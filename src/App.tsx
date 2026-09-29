/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MainMenu } from './components/MainMenu';
import { TableBoard } from './components/TableBoard';
import { OnlineTableBoard } from './components/OnlineTableBoard';
import { OnlineLobbyModal } from './components/OnlineLobbyModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { StatsModal } from './components/StatsModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { AuthModal } from './components/AuthModal';
import { StoreAchievementsModal } from './components/StoreAchievementsModal';
import { SettingsModal } from './components/SettingsModal';
import { ApkExportModal } from './components/ApkExportModal';
import { TutorialPractice } from './components/TutorialPractice';
import { EditProfileModal } from './components/EditProfileModal';
import { DailyChallengeModal } from './components/DailyChallengeModal';
import { AIDifficulty, GameSettings, Achievement, StoreItem, DailyChallenge, OnlineRoomData } from './types/game';
import { soundFx } from './utils/soundEffects';
import { loadSavedDailyChallenge, saveDailyChallenge } from './utils/dailyChallenge';
import {
  testFirestoreConnection,
  subscribeToAuth,
  signOutPlayer,
  updateUserStatsInFirestore,
  AppUserData,
} from './utils/firebase';

import avatarYoung from './assets/images/avatar_young_cairo_1790480291364.jpg';

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach_5_wins',
    title: 'حماسية - اكسب 5 ماتشات',
    description: 'اثبت جدارتك على ترابيزة القهوة واكسب ٥ مباريات',
    rewardCoins: 15,
    currentProgress: 1,
    maxProgress: 5,
    completed: false,
    category: 'wins',
  },
  {
    id: 'ach_15_wins',
    title: 'نجم القهوة - اكسب 15 ماتش',
    description: 'كن سيد القعدة واهزم كل المعلمين ١٥ مرة',
    rewardCoins: 25,
    currentProgress: 1,
    maxProgress: 15,
    completed: false,
    category: 'wins',
  },
  {
    id: 'ach_10_basras',
    title: 'قناص الباصرات - اعمل 10 باصرات',
    description: 'امسح الترابيزة واعمل ١٠ باصرات في المباريات',
    rewardCoins: 15,
    currentProgress: 3,
    maxProgress: 10,
    completed: false,
    category: 'basras',
  },
  {
    id: 'ach_30_basras',
    title: 'رعب القعدة - اعمل 30 باصرة',
    description: 'اجعل خصمك يرتعب من رميتك بـ ٣٠ باصرة',
    rewardCoins: 30,
    currentProgress: 3,
    maxProgress: 30,
    completed: false,
    category: 'basras',
  },
  {
    id: 'ach_friends',
    title: 'عال الشيشة - اكسب ماتش مع صحابك',
    description: 'العب ماتش محلي pass-and-play مع صديقك واكسبه',
    rewardCoins: 10,
    currentProgress: 0,
    maxProgress: 1,
    completed: false,
    category: 'games',
  },
  {
    id: 'ach_50_pts',
    title: 'دوانة معتقة - اجمع 50 نقطة',
    description: 'اجمع ٥٠ نقطة أو أكثر في صكة واحدة بفضل الكومة والباصرات',
    rewardCoins: 20,
    currentProgress: 24,
    maxProgress: 50,
    completed: false,
    category: 'games',
  },
  {
    id: 'ach_jack_basra',
    title: 'ولد الحريف - باصرة ولد على ولد',
    description: 'حقق الضربة القاضية بباصرة ولد على ولد (+٢٠ نقطة)',
    rewardCoins: 25,
    currentProgress: 0,
    maxProgress: 1,
    completed: false,
    category: 'basras',
  },
];

const INITIAL_STORE_ITEMS: StoreItem[] = [
  {
    id: 'frame_royal_blue',
    type: 'frame',
    name: 'إطار أزرق ملكي متوهج',
    price: 0,
    previewColor: '#3B82F6',
    unlocked: true,
  },
  {
    id: 'frame_pharaoh_gold',
    type: 'frame',
    name: 'إطار ذهبي فرعوني',
    price: 80,
    previewColor: '#F59E0B',
    unlocked: false,
  },
  {
    id: 'frame_vintage_wood',
    type: 'frame',
    name: 'إطار خشب قهوة بلدي',
    price: 40,
    previewColor: '#92400E',
    unlocked: true,
  },
  {
    id: 'frame_diamond',
    type: 'frame',
    name: 'إطار ألماسي فاخر',
    price: 150,
    previewColor: '#06B6D4',
    unlocked: false,
  },
];

interface UserProfile {
  name: string;
  avatar: string;
  frameId: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'game' | 'online-game'>('menu');
  const [activeDifficulty, setActiveDifficulty] = useState<AIDifficulty>('medium');
  const [isMultiplayer, setIsMultiplayer] = useState(false);

  // Online multiplayer state
  const [isOnlineLobbyOpen, setIsOnlineLobbyOpen] = useState(false);
  const [onlineRoom, setOnlineRoom] = useState<OnlineRoomData | null>(null);
  const [initialRoomCode, setInitialRoomCode] = useState<string>('');

  // Modals
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isApkExportOpen, setIsApkExportOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isDailyChallengeOpen, setIsDailyChallengeOpen] = useState(false);

  // Authenticated user state from Firebase Auth
  const [currentUserData, setCurrentUserData] = useState<AppUserData | null>(null);

  // Daily Challenge state
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge>(() => loadSavedDailyChallenge());

  // User Profile with localStorage memory
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('basra_user_profile');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      name: 'حسن رمضان',
      avatar: avatarYoung,
      frameId: 'frame_royal_blue',
    };
  });

  const handleSaveProfile = (name: string, avatar: string) => {
    const updated: UserProfile = { ...userProfile, name, avatar };
    setUserProfile(updated);
    try {
      localStorage.setItem('basra_user_profile', JSON.stringify(updated));
    } catch {}
    if (currentUserData?.userId) {
      updateUserStatsInFirestore(currentUserData.userId, {
        name,
        avatar,
      }).catch((e) => console.warn('Could not sync profile to firestore:', e));
    }
  };

  // Currency & Progress
  const [coins, setCoins] = useState(150);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [storeItems, setStoreItems] = useState<StoreItem[]>(INITIAL_STORE_ITEMS);

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    targetScore: 101,
    soundVolume: 0.8,
    ambientSound: true,
    voiceCallouts: true,
    showHints: true,
    cardBackId: 'classic_red',
    fastAnimations: true,
    singleTapPlay: true,
    jackBasraValue: 20,
    displayMode: 'auto',
  });

  // Test Firestore connection on boot, check URL room code, and subscribe to Firebase Auth
  useEffect(() => {
    testFirestoreConnection();

    try {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setInitialRoomCode(roomParam.toUpperCase());
        setIsOnlineLobbyOpen(true);
      }
    } catch {}

    const unsubscribe = subscribeToAuth((user, userData) => {
      if (user && userData) {
        setCurrentUserData(userData);
        setUserProfile({
          name: userData.name,
          avatar: userData.avatar,
          frameId: userData.frameId || 'frame_royal_blue',
        });
        setCoins(userData.coins);
        setStats(prev => ({
          ...prev,
          matchesPlayed: userData.matchesPlayed,
          matchesWon: userData.matchesWon,
          totalBasras: userData.totalBasras,
          highestMatchScore: userData.highestMatchScore,
          coinsEarned: userData.coins,
        }));
      } else {
        setCurrentUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    soundFx.playClick();
    try {
      await signOutPlayer();
      setCurrentUserData(null);
    } catch (e) {
      console.warn('Sign out error:', e);
    }
  };

  // Stats
  const [stats, setStats] = useState({
    matchesPlayed: 4,
    matchesWon: 3,
    totalBasras: 7,
    totalJackBasras: 1,
    totalEatenCards: 68,
    highestMatchScore: 112,
    coinsEarned: 240,
  });

  const handleStartGame = (diff: AIDifficulty, multiplayer: boolean = false) => {
    setActiveDifficulty(diff);
    setIsMultiplayer(multiplayer);
    setCurrentScreen('game');
  };

  const handleMatchFinished = (
    won: boolean,
    basras: number,
    jackBasras: number,
    score: number,
    telemetry?: {
      playedAnySeven: boolean;
      scoreDifference: number;
      wonMajorityRounds: number;
    }
  ) => {
    const earnedCoins = won ? 30 : 10;
    setCoins(prev => prev + earnedCoins);

    // Update Daily Challenge progress if not completed
    setDailyChallenge(prev => {
      if (prev.completed) return prev;

      let newProgress = prev.progress;
      if (prev.type === 'no_sevens' && won && !telemetry?.playedAnySeven) {
        newProgress = 1;
      } else if (prev.type === 'three_basras' && basras >= 3) {
        newProgress = Math.max(newProgress, basras);
      } else if (prev.type === 'jack_basra' && jackBasras >= 1) {
        newProgress = 1;
      } else if (prev.type === 'majority_win' && (telemetry?.wonMajorityRounds || 0) > 0) {
        newProgress = Math.min(prev.target, prev.progress + (telemetry?.wonMajorityRounds || 0));
      } else if (prev.type === 'speed_win' && won && (telemetry?.scoreDifference || 0) >= 30) {
        newProgress = 1;
      }

      const isCompleted = newProgress >= prev.target;
      const updatedChallenge: DailyChallenge = {
        ...prev,
        progress: newProgress,
        completed: isCompleted,
      };
      saveDailyChallenge(updatedChallenge);
      return updatedChallenge;
    });

    setStats(prev => ({
      ...prev,
      matchesPlayed: prev.matchesPlayed + 1,
      matchesWon: won ? prev.matchesWon + 1 : prev.matchesWon,
      totalBasras: prev.totalBasras + basras,
      totalJackBasras: prev.totalJackBasras + jackBasras,
      highestMatchScore: Math.max(prev.highestMatchScore, score),
      coinsEarned: prev.coinsEarned + earnedCoins,
    }));

    // Sync real stats to Firestore user document
    if (currentUserData?.userId) {
      updateUserStatsInFirestore(currentUserData.userId, {
        matchesPlayed: stats.matchesPlayed + 1,
        matchesWon: won ? stats.matchesWon + 1 : stats.matchesWon,
        totalBasras: stats.totalBasras + basras,
        coins: coins + earnedCoins,
        highestMatchScore: Math.max(stats.highestMatchScore, score),
      }).catch((e) => console.warn('Could not sync user stats:', e));
    }

    // Update achievements progress
    setAchievements(prev =>
      prev.map(ach => {
        if (ach.id === 'ach_5_wins' && won) {
          const next = Math.min(ach.maxProgress, ach.currentProgress + 1);
          return { ...ach, currentProgress: next };
        }
        if (ach.id === 'ach_15_wins' && won) {
          const next = Math.min(ach.maxProgress, ach.currentProgress + 1);
          return { ...ach, currentProgress: next };
        }
        if (ach.id === 'ach_10_basras') {
          const next = Math.min(ach.maxProgress, ach.currentProgress + basras);
          return { ...ach, currentProgress: next };
        }
        if (ach.id === 'ach_30_basras') {
          const next = Math.min(ach.maxProgress, ach.currentProgress + basras);
          return { ...ach, currentProgress: next };
        }
        if (ach.id === 'ach_jack_basra' && jackBasras > 0) {
          return { ...ach, currentProgress: 1 };
        }
        if (ach.id === 'ach_50_pts' && score > ach.currentProgress) {
          return { ...ach, currentProgress: Math.min(ach.maxProgress, score) };
        }
        if (ach.id === 'ach_friends' && isMultiplayer && won) {
          return { ...ach, currentProgress: 1 };
        }
        return ach;
      })
    );
  };

  const handleClaimAchievement = (id: string) => {
    const ach = achievements.find(a => a.id === id);
    if (!ach || ach.completed) return;

    setCoins(prev => prev + ach.rewardCoins);
    setAchievements(prev =>
      prev.map(a => (a.id === id ? { ...a, completed: true } : a))
    );
  };

  const handleClaimDailyChallenge = () => {
    if (!dailyChallenge.completed || dailyChallenge.claimed) return;
    setCoins(prev => prev + dailyChallenge.rewardCoins);
    const updated: DailyChallenge = {
      ...dailyChallenge,
      claimed: true,
    };
    setDailyChallenge(updated);
    saveDailyChallenge(updated);
  };

  const handleSelectFrame = (id: string) => {
    setUserProfile(prev => ({ ...prev, frameId: id }));
    if (currentUserData?.userId) {
      updateUserStatsInFirestore(currentUserData.userId, {
        frameId: id,
      }).catch((e) => console.warn('Could not sync frame to firestore:', e));
    }
  };

  const handleUnlockItem = (id: string, price: number) => {
    if (coins < price) return;
    setCoins(prev => prev - price);
    setStoreItems(prev =>
      prev.map(item => (item.id === id ? { ...item, unlocked: true } : item))
    );
    setUserProfile(prev => ({ ...prev, frameId: id }));
  };

  return (
    <main className="w-full min-h-[100dvh] bg-neutral-950 text-neutral-100 select-none overflow-x-hidden overflow-y-auto overscroll-y-contain font-['Cairo',sans-serif]">
      {currentScreen === 'menu' && (
        <MainMenu
          onStartGame={handleStartGame}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
          onOpenStats={() => setIsStatsOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenStore={() => setIsStoreOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenEditProfile={() => setIsEditProfileOpen(true)}
          onOpenDailyChallenge={() => setIsDailyChallengeOpen(true)}
          onOpenOnlineLobby={() => setIsOnlineLobbyOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onSignOut={handleSignOut}
          onOpenApkExport={() => setIsApkExportOpen(true)}
          isLoggedIn={!!currentUserData}
          dailyChallenge={dailyChallenge}
          coins={coins}
          userProfile={userProfile}
        />
      )}

      {currentScreen === 'game' && (
        <TableBoard
          difficulty={activeDifficulty}
          settings={settings}
          userProfile={userProfile}
          onBackToMenu={() => setCurrentScreen('menu')}
          onMatchFinished={handleMatchFinished}
          isMultiplayer={isMultiplayer}
          onUpdateSettings={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
        />
      )}

      {currentScreen === 'online-game' && onlineRoom && (
        <OnlineTableBoard
          initialRoom={onlineRoom}
          myPlayerId={sessionStorage.getItem('basra_online_player_id') || `player-${userProfile.name}`}
          settings={settings}
          onUpdateSettings={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
          onLeaveRoom={() => {
            setOnlineRoom(null);
            setCurrentScreen('menu');
          }}
          userProfile={userProfile}
        />
      )}

      {/* ONLINE LOBBY MODAL */}
      <OnlineLobbyModal
        isOpen={isOnlineLobbyOpen}
        onClose={() => setIsOnlineLobbyOpen(false)}
        userProfile={userProfile}
        onRoomJoined={(room) => {
          setOnlineRoom(room);
          setCurrentScreen('online-game');
        }}
        initialRoomCode={initialRoomCode}
      />

      {/* MODALS */}
      <DailyChallengeModal
        isOpen={isDailyChallengeOpen}
        onClose={() => setIsDailyChallengeOpen(false)}
        challenge={dailyChallenge}
        onClaimReward={handleClaimDailyChallenge}
        onPlayNow={() => handleStartGame('medium', false)}
      />

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentName={userProfile.name}
        currentAvatar={userProfile.avatar}
        currentFrameId={userProfile.frameId}
        onSaveProfile={handleSaveProfile}
      />

      <TutorialPractice
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onCompleteTutorial={() => {
          soundFx.playCoin();
          setCoins(prev => prev + 20);
        }}
      />

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        playerName={userProfile.name}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentUser={{
          userId: currentUserData?.userId,
          name: userProfile.name,
          avatar: userProfile.avatar,
          frameId: userProfile.frameId,
          coins: coins,
          matchesWon: stats.matchesWon,
          matchesPlayed: stats.matchesPlayed,
          totalBasras: stats.totalBasras,
        }}
      />

      {/* AUTHENTICATION MODAL (LOGIN / SIGN UP WITH REAL FIREBASE AUTH) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(data) => {
          setCurrentUserData(data);
          setUserProfile({
            name: data.name,
            avatar: data.avatar,
            frameId: data.frameId || 'frame_royal_blue',
          });
          setCoins(data.coins);
          setStats(prev => ({
            ...prev,
            matchesPlayed: data.matchesPlayed,
            matchesWon: data.matchesWon,
            totalBasras: data.totalBasras,
            highestMatchScore: data.highestMatchScore,
            coinsEarned: data.coins,
          }));
        }}
      />

      <StoreAchievementsModal
        isOpen={isStoreOpen}
        onClose={() => setIsStoreOpen(false)}
        coins={coins}
        onUpdateCoins={setCoins}
        achievements={achievements}
        onClaimAchievement={handleClaimAchievement}
        storeItems={storeItems}
        selectedFrameId={userProfile.frameId}
        onSelectFrame={handleSelectFrame}
        selectedCardBackId={settings.cardBackId}
        onSelectCardBack={(id) => setSettings(prev => ({ ...prev, cardBackId: id }))}
        onUnlockItem={handleUnlockItem}
        playerName={userProfile.name}
        playerAvatar={userProfile.avatar}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
      />

      <ApkExportModal
        isOpen={isApkExportOpen}
        onClose={() => setIsApkExportOpen(false)}
      />
    </main>
  );
}
