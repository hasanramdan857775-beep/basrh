import React, { useState, useEffect } from 'react';
import { Smartphone, Download, ExternalLink, Copy, Check, X, ShieldCheck, Sparkles, Layers, ArrowRight } from 'lucide-react';
import { soundFx } from '../utils/soundEffects';

interface ApkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkExportModal: React.FC<ApkExportModalProps> = ({ isOpen, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  if (!isOpen) return null;

  // Use the public application URL (never the private Google AI Studio console URL)
  const isDirectRunApp = typeof window !== 'undefined' && window.location.origin.includes('run.app');
  const currentAppUrl = isDirectRunApp 
    ? window.location.origin 
    : 'https://ais-pre-xogobduysq2qn2ydeuyxrq-10310254868.europe-west2.run.app';

  const handleCopyUrl = () => {
    soundFx.playClick();
    navigator.clipboard.writeText(currentAppUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    soundFx.playClick();
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalledSuccess(true);
      soundFx.playCoin();
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#1E1208] via-[#140B04] to-[#0A0502] border-2 border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.25)] p-5 sm:p-6 text-neutral-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/40 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg border border-amber-300/40">
              <Smartphone className="w-6 h-6 text-neutral-950" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-amber-200 font-['El_Messiri',serif]">
                تحويل اللعبة إلى تطبيق APK 📱
              </h2>
              <p className="text-xs text-amber-400/80 font-medium">
                تثبيت على أندرويد وآيفون كـتطبيق حقيقي بملء الشاشة
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-neutral-900/80 border border-neutral-700 hover:border-amber-500/60 text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4">
          
          {/* Method 1: Instant PWA Install (Direct to Mobile Home Screen) */}
          <div className="p-4 rounded-2xl bg-[#28180A]/80 border-2 border-amber-500/40 shadow-inner relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40">
                    الطريقة الأسرع والأسهل ⚡
                  </span>
                  <h3 className="text-base font-black text-amber-100">
                    ١. التثبيت الفوري كـ تطبيق (PWA)
                  </h3>
                </div>
                <p className="text-xs text-amber-200/70 leading-relaxed mb-3">
                  اللعبة مجهزة بملف <strong>Manifest</strong> وتقنية الـ PWA، مما يتيح تثبيتها مباشرة على هاتفك وتعمل بملء الشاشة وأيقونة مخصصة بدون الحاجة لمتجر!
                </p>

                {isInstallable ? (
                  <button
                    onClick={handleNativeInstall}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm shadow-[0_4px_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>تثبيت التطبيق على هاتفك الآن (بنقرة واحدة)</span>
                  </button>
                ) : installedSuccess ? (
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>تم تثبيت التطبيق بنجاح على شاشة هاتفك!</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-black/40 border border-amber-900/30 text-xs text-amber-300/90 leading-relaxed">
                    💡 <strong>خطوات التثبيت من الموبايل:</strong>
                    <br />
                    • على <strong>Google Chrome أندرويد</strong>: اضغط على القائمة (⋮) أعلى اليسار ثم اختر <strong>"تثبيت التطبيق"</strong> أو <strong>"الإضافة إلى الشاشة الرئيسية"</strong>.
                    <br />
                    • على <strong>سفاري آيفون (Safari)</strong>: اضغط زر المشاركة (Share) ثم <strong>"Add to Home Screen"</strong>.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Method 2: PWABuilder (Convert to Real .APK & .AAB file for Google Play) */}
          <div className="p-4 rounded-2xl bg-[#1C120A] border border-amber-600/30">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/40">
                ملف APK رسمي 📦
              </span>
              <h3 className="text-base font-black text-amber-200">
                ٢. استخراج ملف APK عبر PWABuilder
              </h3>
            </div>
            <p className="text-xs text-amber-200/70 leading-relaxed mb-3">
              منصة <strong>PWABuilder</strong> (المدعومة من Microsoft و Google) تتيح لك تحويل أي رابط ويب مجهز بـ PWA إلى ملف <strong>APK</strong> و <strong>AAB</strong> قابل للرفع على Google Play Store مجاناً!
            </p>

            {/* Important Notice regarding AI Studio console vs Public URL */}
            <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] sm:text-xs text-amber-200/90 leading-relaxed">
              ⚠️ <strong>تنبيه هام (سبب ظهور Missing Name في PWABuilder):</strong>
              <br />
              في حال قمت بلصق رابط منصة التطوير <code className="text-red-400 font-mono">aistudio.google.com</code> سيفشل الفحص لأنها صفحة داخلية تتطلب تسجيل دخول Google.
              <br />
              <strong className="text-emerald-400">الرابط العام الصحيح للعبة هو الرابط المعروض بالأسفل:</strong>
            </div>

            {/* URL Copy Box */}
            <div className="mb-3 flex items-center gap-2 p-2 rounded-xl bg-black/50 border border-amber-900/50">
              <input
                type="text"
                readOnly
                value={currentAppUrl}
                className="flex-1 bg-transparent text-xs text-amber-300 font-mono outline-none select-all truncate"
              />
              <button
                onClick={handleCopyUrl}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'تم النسخ!' : 'نسخ الرابط'}</span>
              </button>
            </div>

            <div className="text-xs text-neutral-300 space-y-1 mb-3 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800">
              <p><strong>١.</strong> انسخ رابط اللعبة أعلاه.</p>
              <p><strong>٢.</strong> افتح موقع <a href="https://www.pwabuilder.com" target="_blank" rel="noreferrer" className="text-amber-400 underline font-bold">PWABuilder.com</a> والصق الرابط ثم اضغط <strong>Start</strong>.</p>
              <p><strong>٣.</strong> اضغط على <strong>Android Package</strong> ثم حمّل ملف الـ <strong>APK</strong> مباشرة لهاتفك!</p>
            </div>

            <a
              href={`https://www.pwabuilder.com/?url=${encodeURIComponent(currentAppUrl)}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => soundFx.playClick()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <span>فتح موقع PWABuilder لتحميل الـ APK</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Method 3: Capacitor (For Developers) */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-neutral-800">
            <h4 className="text-xs font-bold text-amber-300 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>٣. للمطورين (تحويل نيتف كامل عبر Capacitor / Android Studio):</span>
            </h4>
            <div className="bg-neutral-950 p-2.5 rounded-lg font-mono text-[11px] text-emerald-400/90 overflow-x-auto text-left dir-ltr select-all">
              npm install @capacitor/core @capacitor/cli @capacitor/android<br />
              npx cap init "Basra Misreya" "com.ahwa.basra"<br />
              npm run build<br />
              npx cap add android<br />
              npx cap open android
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-amber-900/40 flex justify-end">
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm shadow transition-all active:scale-95 cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
