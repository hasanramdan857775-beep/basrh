import React, { useState } from 'react';
import { X, LogIn, UserPlus, KeyRound, User, Lock, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { soundFx } from '../utils/soundEffects';
import { ModalWrapper } from './ModalWrapper';
import { signUpPlayer, signInPlayer, AppUserData } from '../utils/firebase';

import avatarYoung from '../assets/images/avatar_young_cairo_1790480291364.jpg';

const AVATAR_OPTIONS = [
  {
    id: 'avatar_young',
    url: avatarYoung,
    label: 'حريف شاب',
  },
  {
    id: 'avatar_1',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    label: 'معلّم القهوة',
  },
  {
    id: 'avatar_2',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    label: 'شيخ الطاولة',
  },
  {
    id: 'avatar_3',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    label: 'باشا القعدة',
  },
  {
    id: 'avatar_4',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    label: 'كابتن الصكة',
  },
];

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userData: AppUserData) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  
  // Sign in state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Sign up state
  const [signUpName, setSignUpName] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(avatarYoung);

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'signin') {
      const trimmedId = identifier.trim();
      if (!trimmedId || !password) {
        setErrorMsg('يرجى إدخال اسم المستخدم وكلمة المرور.');
        return;
      }

      setIsLoading(true);
      soundFx.playClick();

      try {
        const userData = await signInPlayer(trimmedId, password);
        soundFx.playCoin();
        setSuccessMsg(`أهلاً بك يا معلّم ${userData.name}! تم تسجيل الدخول بنجاح.`);
        setTimeout(() => {
          onAuthSuccess(userData);
          onClose();
        }, 800);
      } catch (err: unknown) {
        const errStr = String(err);
        if (errStr.includes('user-not-found') || errStr.includes('invalid-credential')) {
          setErrorMsg('بيانات الدخول غير صحيحة. تأكد من اسم المستخدم وكلمة المرور.');
        } else if (errStr.includes('wrong-password')) {
          setErrorMsg('كلمة المرور غير صحيحة.');
        } else {
          setErrorMsg('حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Sign Up
      const trimmedName = signUpName.trim();
      const trimmedUsername = signUpUsername.trim();

      if (!trimmedName) {
        setErrorMsg('يرجى إدخال اسم الشهرة على الترابيزة.');
        return;
      }
      if (!trimmedUsername || trimmedUsername.length < 3) {
        setErrorMsg('اسم المستخدم يجب أن يتكون من ٣ حروف على الأقل (أرقام أو حروف إنجليزية).');
        return;
      }
      if (signUpPassword.length < 6) {
        setErrorMsg('كلمة المرور يجب أن تكون ٦ خانات أو رموز على الأقل.');
        return;
      }

      setIsLoading(true);
      soundFx.playClick();

      try {
        const userData = await signUpPlayer({
          usernameOrEmail: trimmedUsername,
          password: signUpPassword,
          name: trimmedName,
          avatar: selectedAvatar,
          initialCoins: 200,
        });

        soundFx.playCoin();
        setSuccessMsg(`مبروك يا معلّم ${userData.name}! تم فتح حسابك وحصلت على ٢٠٠ ذهب هدية 🪙`);
        setTimeout(() => {
          onAuthSuccess(userData);
          onClose();
        }, 1000);
      } catch (err: unknown) {
        const errStr = String(err);
        if (errStr.includes('email-already-in-use')) {
          setErrorMsg('اسم المستخدم هذا محجوز لمعلّم آخر، اختر اسماً آخر.');
        } else if (errStr.includes('weak-password')) {
          setErrorMsg('كلمة المرور ضعيفة. يرجى اختيار كلمة مرور أقوى.');
        } else {
          setErrorMsg('حدث خطأ أثناء إنشاء الحساب. حاول مرة أخرى.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="w-full flex flex-col bg-[#1A120B] border-2 border-[#8C6D46] rounded-2xl shadow-2xl overflow-hidden text-neutral-100 font-['Cairo',sans-serif]">
        
        {/* Header */}
        <div className="relative pt-4 pb-3 px-4 border-b border-[#5C442A] bg-gradient-to-r from-[#2A180E] via-[#3F2414] to-[#2A180E] text-center">
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

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-md mb-2">
            <KeyRound className="w-6 h-6 animate-pulse" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-amber-300 font-['El_Messiri',serif]">
            {mode === 'signin' ? 'تسجيل دخول المعلمين' : 'إنشاء حساب معلّم جديد'}
          </h2>
          <p className="text-xs text-amber-200/70 mt-1">
            لحفظ باصراتك، رصيد ذهبك، ومنافستك على سلم المتصدرين الأونلاين الحقيقي
          </p>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 border-b border-[#5C442A] bg-[#120B06] text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`py-3 flex items-center justify-center gap-1.5 transition-colors ${
              mode === 'signin'
                ? 'bg-[#2A180E] text-amber-300 border-b-2 border-amber-400 shadow-inner'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <LogIn className="w-4 h-4 text-amber-400" />
            <span>تسجيل الدخول</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`py-3 flex items-center justify-center gap-1.5 transition-colors ${
              mode === 'signup'
                ? 'bg-[#2A180E] text-amber-300 border-b-2 border-amber-400 shadow-inner'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>حساب جديد (+٢٠٠ ذهب)</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
          
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SIGN IN FIELDS */}
          {mode === 'signin' && (
            <>
              <div>
                <label className="text-xs font-bold text-amber-200 block mb-1">
                  اسم المستخدم أو البريد الإلكتروني:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="مثال: hassan_cairo أو ايميلك"
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-[#24170E] border border-[#543D24] focus:border-amber-400 text-neutral-100 placeholder-neutral-500 text-xs font-bold outline-none"
                    dir="ltr"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-200 block mb-1">
                  كلمة المرور:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-[#24170E] border border-[#543D24] focus:border-amber-400 text-neutral-100 placeholder-neutral-500 text-xs font-bold outline-none font-mono"
                    dir="ltr"
                  />
                </div>
              </div>
            </>
          )}

          {/* SIGN UP FIELDS */}
          {mode === 'signup' && (
            <>
              <div>
                <label className="text-xs font-bold text-amber-200 block mb-1">
                  اسم الشهرة على ترابيزة القهوة:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="مثال: المعلم صبحي الحريف"
                    maxLength={25}
                    className="w-full pr-9 pl-3 py-2 rounded-xl bg-[#24170E] border border-[#543D24] focus:border-amber-400 text-neutral-100 placeholder-neutral-500 text-xs font-bold outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-200 block mb-1">
                  اسم المستخدم للدخول (حروف وأرقام):
                </label>
                <div className="relative">
                  <span className="text-xs font-mono text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2">
                    @
                  </span>
                  <input
                    type="text"
                    value={signUpUsername}
                    onChange={(e) => setSignUpUsername(e.target.value)}
                    placeholder="sobhy_basra"
                    maxLength={20}
                    className="w-full pr-8 pl-3 py-2 rounded-xl bg-[#24170E] border border-[#543D24] focus:border-amber-400 text-neutral-100 placeholder-neutral-500 text-xs font-bold outline-none font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-200 block mb-1">
                  كلمة المرور (٦ خانات على الأقل):
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-9 pl-3 py-2 rounded-xl bg-[#24170E] border border-[#543D24] focus:border-amber-400 text-neutral-100 placeholder-neutral-500 text-xs font-bold outline-none font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Avatar Picker */}
              <div>
                <label className="text-xs font-bold text-amber-200 block mb-1.5">
                  اختر صورة المعلم على الترابيزة:
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {AVATAR_OPTIONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setSelectedAvatar(item.url);
                      }}
                      className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                        selectedAvatar === item.url
                          ? 'border-amber-400 scale-105 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                          : 'border-[#442E1B] opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                      {selectedAvatar === item.url && (
                        <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-amber-300" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:brightness-110 disabled:opacity-50 text-neutral-950 font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                <span>جاري التحقق...</span>
              </span>
            ) : mode === 'signin' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>دخول الصالون واللعب</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>تسجيل حساب معلّم جديد (+٢٠٠ ذهب)</span>
              </>
            )}
          </button>

        </form>

        {/* Footer helper */}
        <div className="p-3 bg-[#130B06] border-t border-[#5C442A] text-center text-[11px] text-neutral-400">
          {mode === 'signin' ? (
            <span>
              ليس لديك حساب بعد؟{' '}
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setMode('signup');
                  setErrorMsg(null);
                }}
                className="text-amber-300 font-bold hover:underline"
              >
                أنشئ حسابك الآن واحصل على ذهب مجاني
              </button>
            </span>
          ) : (
            <span>
              لديك حساب بالفعل؟{' '}
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setMode('signin');
                  setErrorMsg(null);
                }}
                className="text-amber-300 font-bold hover:underline"
              >
                تسجيل الدخول
              </button>
            </span>
          )}
        </div>

      </div>
    </ModalWrapper>
  );
};
