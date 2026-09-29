import React, { useState } from 'react';
import { Award, Settings, BookOpen, BarChart3, Users, Globe, Play, Sparkles, ShoppingBag, Calendar, Gift, Zap, Shield, Flame, Trophy, LogIn, LogOut, KeyRound, Smartphone, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundFx } from '../utils/soundEffects';
import { AIDifficulty, DailyChallenge } from '../types/game';
import { ModalWrapper } from './ModalWrapper';

import cairoSalonBg from '../assets/images/egyptian_night_club_table_1790481100679.jpg';
import gameCrest from '../assets/images/basra_egyptian_crest_1790481124683.jpg';

interface MainMenuProps {
  onStartGame: (difficulty: AIDifficulty, isMultiplayer?: boolean) => void;
  onOpenTutorial: () => void;
  onOpenHowToPlay: () => void;
  onOpenStats: () => void;
  onOpenLeaderboard: () => void;
  onOpenStore: () => void;
  onOpenSettings: () => void;
  onOpenEditProfile: () => void;
  onOpenDailyChallenge: () => void;
  onOpenOnlineLobby: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenApkExport?: () => void;
  isLoggedIn: boolean;
  dailyChallenge: DailyChallenge;
  coins: number;
  userProfile: {
    name: string;
    avatar: string;
    frameId: string;
  };
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenTutorial,
  onOpenHowToPlay,
  onOpenStats,
  onOpenLeaderboard,
  onOpenStore,
  onOpenSettings,
  onOpenEditProfile,
  onOpenDailyChallenge,
  onOpenOnlineLobby,
  onOpenAuth,
  onSignOut,
  onOpenApkExport,
  isLoggedIn,
  dailyChallenge,
  coins,
  userProfile,
}) => {
  const [showDifficultySelect, setShowDifficultySelect] = useState(false);

  const handleDifficultySelect = (diff: AIDifficulty) => {
    soundFx.playClick();
    setShowDifficultySelect(false);
    onStartGame(diff, false);
  };

  return (
    <div
      className="relative w-full h-full overflow-x-hidden overflow-y-auto overscroll-y-contain flex flex-col justify-between p-2.5 sm:p-6 lg:p-8 select-none font-['Cairo',sans-serif] bg-neutral-950 touch-pan-y pb-32 custom-scrollbar"
      style={{
        backgroundImage: `radial-gradient(ellipse at 50% 30%, rgba(10, 25, 18, 0.6) 0%, rgba(8, 6, 4, 0.92) 80%), url(${cairoSalonBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        touchAction: 'pan-y',
      }}
    >
      {/* Strictly contained atmospheric glows so they never cause horizontal slipping */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      {/* TOP BAR: Brand Header & Player Profile Card */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full flex items-center justify-between gap-3 bg-[#140E0A]/85 backdrop-blur-md px-3 sm:px-6 py-2.5 rounded-2xl border border-[#523A25] shadow-2xl"
      >
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 2 }}
            className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-xl overflow-hidden border-2 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.35)] shrink-0 bg-black cursor-pointer"
          >
            <img
              src={gameCrest}
              alt="شعار باصرة المعلمين"
              className="w-full h-full object-cover"
            />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 font-['El_Messiri',serif] tracking-wide">
                باصرة المعلمين
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-amber-950/90 text-amber-300 border border-amber-600/50 text-[10px] font-black">
                إصدار القهوة الأصيل
              </span>
            </div>
            <p className="text-[11px] text-amber-200/70 hidden xs:block">
              لعبة الورق التراثية المصرية وقوانين الكومي والولد القشاش
            </p>
          </div>
        </div>

        {/* Right: Coins & Interactive Profile Badge */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Leaderboard Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              soundFx.playClick();
              onOpenLeaderboard();
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-b from-amber-950/80 to-[#1A1009] border border-amber-500/60 text-amber-300 text-xs sm:text-sm font-black hover:border-amber-400 transition-all shadow-md group"
            title="سلم كبار المعلمين ولوحة المتصدرين الحقيقية"
          >
            <Trophy className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline font-bold">المتصدرين</span>
          </motion.button>

          {/* Gold Wallet */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              soundFx.playClick();
              onOpenStore();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-b from-[#2A180E] to-[#1E110A] border border-amber-500/60 text-amber-300 text-xs sm:text-sm font-black hover:border-amber-400 transition-all shadow-md"
            title="رصيد الذهب - افتح المتجر"
          >
            <span className="text-base sm:text-lg">🪙</span>
            <span className="font-mono tabular-nums">{coins}</span>
            <span className="text-[10px] text-amber-400/80 hidden sm:inline">+</span>
          </motion.button>

          {/* Login or SignOut Button */}
          {!isLoggedIn ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                soundFx.playClick();
                onOpenAuth();
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:brightness-110 text-neutral-950 font-black text-xs sm:text-sm shadow-md transition-all active:scale-95"
              title="سجل حسابك لحفظ النقاط واللعب أونلاين"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">دخول / حساب</span>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                soundFx.playClick();
                onSignOut();
              }}
              className="flex items-center gap-1 p-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 hover:text-white transition-all text-xs font-bold"
              title="تسجيل خروج من الحساب"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline text-[11px]">خروج</span>
            </motion.button>
          )}

          {/* Player Profile Widget */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              soundFx.playClick();
              if (!isLoggedIn) {
                onOpenAuth();
              } else {
                onOpenEditProfile();
              }
            }}
            className="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-white/5 transition-all group text-right border border-transparent hover:border-amber-700/50"
            title={isLoggedIn ? 'اضغط لتغيير اسمك وصورتك' : 'اضغط لتسجيل الدخول'}
          >
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-1 justify-end">
                <span className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">تعديل ✏️</span>
                <span className="text-xs sm:text-sm font-bold text-neutral-100 group-hover:text-amber-200 transition-colors">
                  {userProfile.name}
                </span>
              </div>
              <span className="text-[10px] text-amber-300/70 block">
                {isLoggedIn ? 'معلّم مسجل ✓' : 'ضيف الترابيزة'}
              </span>
            </div>

            <div className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden border-2 transition-transform group-hover:scale-105 shrink-0 ${
              userProfile.frameId === 'frame_royal_blue'
                ? 'border-blue-400 ring-2 ring-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.7)]'
                : userProfile.frameId === 'frame_pharaoh_gold'
                ? 'border-amber-400 ring-2 ring-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.7)]'
                : 'border-amber-700'
            }`}>
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.button>

        </div>
      </motion.header>

      {/* CENTER HERO AREA: Dynamic Gaming Portal */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center my-4 sm:my-6 px-2">
        
        {/* Banner with Slogan */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="text-center max-w-xl mx-auto mb-5 sm:mb-7"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-amber-950/80 border border-amber-600/40 text-amber-300 text-xs sm:text-sm font-bold shadow-lg mb-3">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>صالون اللعب المصري الحر · اربح الباصرات واقش الترابيزة</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-amber-100 font-['El_Messiri',serif] drop-shadow-md">
            جاهز تنزل صكة المعلمين؟
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 mt-2 font-medium">
            السبعة الكومي بتلم والولد بيقش.. احسبها صح وورّينا حرافتك
          </p>
        </motion.div>

        {/* PRIMARY ACTION CARDS GRID (Modern, clean, and distinct) */}
        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 touch-pan-y">
          
          {/* Card 1: العب الآن ضد الذكاء الاصطناعي (Hero Primary) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            style={{ touchAction: 'pan-y' }}
            onClick={() => {
              soundFx.playClick();
              setShowDifficultySelect(true);
            }}
            className="group relative cursor-pointer p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#5C1616] via-[#7B1E1E] to-[#450F0F] border-2 border-[#D94C4C]/60 hover:border-amber-400 text-white shadow-xl hover:shadow-[0_0_25px_rgba(217,76,76,0.6)] transition-all overflow-hidden touch-pan-y"
          >
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform pointer-events-none" />
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-black/30 border border-white/20 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                🃏
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-neutral-950 text-[10px] font-black shadow">
                الأساسي 🔥
              </span>
            </div>
            <h3 className="text-xl font-black font-['El_Messiri',serif] mt-3 group-hover:text-amber-200 transition-colors">
              ابدأ صكة كوتشينة
            </h3>
            <p className="text-xs text-rose-200/80 mt-1 leading-relaxed">
              تحدي معلمين القهوة (سهل، متوسط، وحريف) حتى ١٠١ نقطة
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-xs font-black text-amber-300">
              <Play className="w-4 h-4 fill-current" />
              <span>دخول الترابيزة فوراً ←</span>
            </div>
          </motion.div>

          {/* Card 2: التحدي اليومي المتجدد */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            style={{ touchAction: 'pan-y' }}
            onClick={() => {
              soundFx.playClick();
              onOpenDailyChallenge();
            }}
            className="group relative cursor-pointer p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#2D1D12] via-[#3D2718] to-[#1E120A] border-2 border-amber-600/60 hover:border-amber-400 text-white shadow-xl hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all overflow-hidden touch-pan-y"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-2xl shadow-inner group-hover:rotate-12 transition-transform">
                🎯
              </div>
              {dailyChallenge.completed && !dailyChallenge.claimed ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-neutral-950 text-[10px] font-black animate-bounce shadow">
                  جائزتك جاهزة 🎁
                </span>
              ) : dailyChallenge.claimed ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/50 text-[10px] font-bold">
                  تم الاستلام ✓
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-600/50 text-[10px] font-bold">
                  +{dailyChallenge.rewardCoins} ذهب 🪙
                </span>
              )}
            </div>
            <h3 className="text-xl font-black font-['El_Messiri',serif] mt-3 group-hover:text-amber-200 transition-colors">
              مهمة اليوم اليومية
            </h3>
            <p className="text-xs text-amber-200/80 mt-1 line-clamp-2 leading-relaxed">
              {dailyChallenge.title}
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-xs font-black text-amber-400">
              <Calendar className="w-4 h-4" />
              <span>استعراض المهمة والجوائز ←</span>
            </div>
          </motion.div>

          {/* Card 3: صالون اللعب أونلاين والغرف */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            style={{ touchAction: 'pan-y' }}
            onClick={() => {
              soundFx.playClick();
              onOpenOnlineLobby();
            }}
            className="group relative cursor-pointer p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#12241F] via-[#1A3830] to-[#0E1B17] border-2 border-emerald-600/60 hover:border-emerald-400 text-white shadow-xl hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all overflow-hidden touch-pan-y"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                🌐
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-900/90 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                غرف مباشرة
              </span>
            </div>
            <h3 className="text-xl font-black font-['El_Messiri',serif] mt-3 group-hover:text-emerald-200 transition-colors">
              صالون القاهرة أونلاين
            </h3>
            <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
              انضم لترابيزات قهوة الفيشاوي والحرافيش وراهن بالذهب
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-xs font-black text-emerald-300">
              <Globe className="w-4 h-4" />
              <span>دخول الغرف الحية ←</span>
            </div>
          </motion.div>

        </div>

        {/* Mobile Swipe-Up Helper Prompt */}
        <div className="w-full max-w-4xl mt-5 mb-2 flex items-center justify-between px-2 text-amber-200/80">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-black font-['El_Messiri',serif] text-amber-200">
              باقي القوائم والألعاب والخدمات
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-[#24170E] px-2.5 py-1 rounded-full border border-amber-600/40">
            <span>اسحب للأعلى</span>
            <span className="text-xs animate-bounce inline-block">⇣</span>
          </div>
        </div>

        {/* ALL REMAINING MENUS GRID (Rich 2-cols mobile / 4-cols desktop) */}
        <div className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 touch-pan-y">
          
          {/* 1. تدريب الحريف */}
          <button
            style={{ touchAction: 'pan-y' }}
            onClick={() => {
              soundFx.playClick();
              onOpenTutorial();
            }}
            className="p-3 rounded-2xl bg-gradient-to-br from-[#26180E] to-[#1A1009] border border-[#5A3F27] hover:border-amber-400 text-right flex flex-col justify-between transition-all active:scale-95 shadow-md group touch-pan-y"
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-amber-400 font-bold">تعليم</span>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black text-amber-100 block group-hover:text-amber-300 transition-colors">
                تدريب الحريف
              </span>
              <span className="text-[10px] text-neutral-400">مدرسة أصول اللعب</span>
            </div>
          </button>

          {/* 2. جهاز واحد (٢ لاعبين) */}
          <button
            style={{ touchAction: 'pan-y' }}
            onClick={() => {
              soundFx.playClick();
              onStartGame('medium', true);
            }}
            className="p-3 rounded-2xl bg-gradient-to-br from-[#121B26] to-[#0D131C] border border-[#2B4360] hover:border-blue-400 text-right flex flex-col justify-between transition-all active:scale-95 shadow-md group touch-pan-y"
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-blue-300 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-blue-400 font-bold">محلي</span>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black text-blue-100 block group-hover:text-blue-300 transition-colors">
                جهاز واحد (٢ لاعبين)
              </span>
              <span className="text-[10px] text-neutral-400">لعب وجهاً لوجه</span>
            </div>
          </button>

          {/* 3. قوانين اللعبة */}
          <button
            style={{ touchAction: 'pan-y' }}
            onClick={() => {
              soundFx.playClick();
              onOpenHowToPlay();
            }}
            className="p-3 rounded-2xl bg-gradient-to-br from-[#26180E] to-[#1A1009] border border-[#5A3F27] hover:border-amber-400 text-right flex flex-col justify-between transition-all active:scale-95 shadow-md group touch-pan-y"
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-amber-400 font-bold">دليل</span>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black text-amber-100 block group-hover:text-amber-300 transition-colors">
                قوانين اللعبة
              </span>
              <span className="text-[10px] text-neutral-400">الكومي والولد القشاش</span>
            </div>
          </button>

          {/* 4. سلم المتصدرين */}
          <button
            style={{ touchAction: 'pan-y' }}
            onClick={() => {
              soundFx.playClick();
              onOpenLeaderboard();
            }}
            className="p-3 rounded-2xl bg-gradient-to-br from-[#2E1C0A] to-[#1F1306] border border-amber-500/50 hover:border-amber-300 text-right flex flex-col justify-between transition-all active:scale-95 shadow-md group touch-pan-y"
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-amber-900/80 border border-amber-400/50 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                <Trophy className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-amber-300 font-bold">ترتيب</span>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black text-amber-200 block group-hover:text-amber-300 transition-colors">
                سلم المتصدرين
              </span>
              <span className="text-[10px] text-amber-300/70">أبطال باصرة مصر</span>
            </div>
          </button>

          {/* 5. سجل المعلم (الإحصائيات) */}
          <button
            style={{ touchAction: 'pan-y' }}
            onClick={() => {
              soundFx.playClick();
              onOpenStats();
            }}
            className="p-3 rounded-2xl bg-gradient-to-br from-[#26180E] to-[#1A1009] border border-[#5A3F27] hover:border-amber-400 text-right flex flex-col justify-between transition-all active:scale-95 shadow-md group touch-pan-y"
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-amber-400 font-bold">أرقام</span>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black text-amber-100 block group-hover:text-amber-300 transition-colors">
                سجل المعلم
              </span>
              <span className="text-[10px] text-neutral-400">الفوز والباصرات</span>
            </div>
          </button>

          {/* 6. المتجر الملكي */}
          <button
            style={{ touchAction: 'pan-y' }}
            onClick={() => {
              soundFx.playClick();
              onOpenStore();
            }}
            className="p-3 rounded-2xl bg-gradient-to-br from-[#29170E] to-[#1C0F08] border border-amber-600/40 hover:border-amber-300 text-right flex flex-col justify-between transition-all active:scale-95 shadow-md group touch-pan-y"
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-amber-400 font-bold">تسوق</span>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black text-amber-100 block group-hover:text-amber-300 transition-colors">
                المتجر الملكي
              </span>
              <span className="text-[10px] text-neutral-400">براويز وخلفيات</span>
            </div>
          </button>

          {/* 7. الخيارات والإعدادات */}
          <button
            style={{ touchAction: 'pan-y' }}
            onClick={() => {
              soundFx.playClick();
              onOpenSettings();
            }}
            className="p-3 rounded-2xl bg-gradient-to-br from-[#26180E] to-[#1A1009] border border-[#5A3F27] hover:border-amber-400 text-right flex flex-col justify-between transition-all active:scale-95 shadow-md group touch-pan-y"
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-neutral-300 group-hover:scale-110 transition-transform">
                <Settings className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-neutral-400 font-bold">ضبط</span>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black text-neutral-200 block group-hover:text-amber-300 transition-colors">
                خيارات اللعبة
              </span>
              <span className="text-[10px] text-neutral-400">الصوت والسرعة</span>
            </div>
          </button>

          {/* 8. تطبيق APK للموبايل */}
          {onOpenApkExport ? (
            <button
              style={{ touchAction: 'pan-y' }}
              onClick={() => {
                soundFx.playClick();
                onOpenApkExport();
              }}
              className="p-3 rounded-2xl bg-gradient-to-br from-[#0F261C] to-[#0A1812] border border-emerald-500/50 hover:border-emerald-300 text-right flex flex-col justify-between transition-all active:scale-95 shadow-md group touch-pan-y"
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-400/50 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-emerald-300 font-bold">تثبيت 📱</span>
              </div>
              <div>
                <span className="text-xs sm:text-sm font-black text-emerald-200 block group-hover:text-emerald-300 transition-colors">
                  تطبيق APK
                </span>
                <span className="text-[10px] text-emerald-400/80">تثبيت للأندرويد</span>
              </div>
            </button>
          ) : (
            <button
              style={{ touchAction: 'pan-y' }}
              onClick={() => {
                soundFx.playClick();
                onOpenEditProfile();
              }}
              className="p-3 rounded-2xl bg-gradient-to-br from-[#26180E] to-[#1A1009] border border-[#5A3F27] hover:border-amber-400 text-right flex flex-col justify-between transition-all active:scale-95 shadow-md group touch-pan-y"
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300">
                  <Award className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-amber-400 font-bold">بروفايل</span>
              </div>
              <div>
                <span className="text-xs sm:text-sm font-black text-amber-100 block">
                  تعديل المعلم
                </span>
                <span className="text-[10px] text-neutral-400">الاسم والشخصية</span>
              </div>
            </button>
          )}

        </div>

      </main>

      {/* DIFFICULTY SELECTION MODAL WITH FRAMER MOTION */}
      <ModalWrapper
        isOpen={showDifficultySelect}
        onClose={() => setShowDifficultySelect(false)}
        maxWidth="max-w-sm"
      >
        <div className="w-full bg-[#1A120B] border-2 border-[#8C6D46] rounded-2xl shadow-2xl p-5 text-neutral-100 text-center">
          <h3 className="text-2xl font-black text-amber-300 font-['El_Messiri',serif] mb-1">
            اختر ترابيزة المنافسة
          </h3>
          <p className="text-xs text-neutral-400 mb-4">حدد مستوى خصمك في صالون اللعب</p>

          <div className="space-y-2.5">
            <button
              onClick={() => handleDifficultySelect('easy')}
              className="w-full p-3 rounded-xl bg-[#24170E] hover:bg-[#332114] border border-[#543D24] text-right flex items-center justify-between transition-colors group"
            >
              <div>
                <span className="font-bold text-sm text-emerald-400 block group-hover:text-emerald-300">مبتدئ (ترابيزة الهواة)</span>
                <span className="text-xs text-neutral-400">لعب تدريبي ممتع وخفيف</span>
              </div>
              <span className="text-xl">☕</span>
            </button>

            <button
              onClick={() => handleDifficultySelect('medium')}
              className="w-full p-3 rounded-xl bg-[#24170E] hover:bg-[#332114] border border-[#543D24] text-right flex items-center justify-between transition-colors group"
            >
              <div>
                <span className="font-bold text-sm text-amber-400 block group-hover:text-amber-300">متوسط (ترابيزة المحترفين)</span>
                <span className="text-xs text-neutral-400">لا يفوّت باصرة ويجمع أوراق الطاولة</span>
              </div>
              <span className="text-xl">🎲</span>
            </button>

            <button
              onClick={() => handleDifficultySelect('hard')}
              className="w-full p-3 rounded-xl bg-gradient-to-r from-[#3B1510] to-[#24170E] hover:from-[#4D1C16] border border-red-700/60 text-right flex items-center justify-between transition-colors group"
            >
              <div>
                <span className="font-bold text-sm text-red-400 block group-hover:text-red-300">معلّم القعدة (صعب جداً)</span>
                <span className="text-xs text-neutral-400">يحفظ الورق المرمي ويصطاد الكومي بذكاء</span>
              </div>
              <span className="text-xl">👑</span>
            </button>
          </div>

          <button
            onClick={() => setShowDifficultySelect(false)}
            className="mt-4 px-4 py-1.5 text-xs text-neutral-400 hover:text-white font-bold"
          >
            إلغاء
          </button>
        </div>
      </ModalWrapper>

    </div>
  );
};


