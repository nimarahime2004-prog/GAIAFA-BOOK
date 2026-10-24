import React, { useState } from 'react';
import {
  X,
  Smartphone,
  KeyRound,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Mail,
  User as UserIcon,
  Lock
} from 'lucide-react';
import { User } from '../types.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, token: string) => void;
  initialTab?: 'login' | 'register' | 'otp';
}

export function AuthModal({ isOpen, onClose, onAuthSuccess, initialTab = 'login' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab === 'register' ? 'register' : 'login');

  // Common Phone
  const [loginPhone, setLoginPhone] = useState('');
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>(initialTab === 'otp' ? 'otp' : 'password');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginOtpCode, setLoginOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(180);
  const [previewOtp, setPreviewOtp] = useState<string | null>(null);

  // Register Fields
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regOtpCode, setRegOtpCode] = useState('');
  const [isRegOtpSent, setIsRegOtpSent] = useState(false);
  const [regPreviewOtp, setRegPreviewOtp] = useState<string | null>(null);

  // Anti-bot Captcha
  const [captchaQ, setCaptchaQ] = useState(() => {
    const a = Math.floor(2 + Math.random() * 7);
    const b = Math.floor(1 + Math.random() * 8);
    return { a, b, answer: a + b };
  });
  const [userCaptcha, setUserCaptcha] = useState('');

  const refreshCaptcha = () => {
    const a = Math.floor(2 + Math.random() * 7);
    const b = Math.floor(1 + Math.random() * 8);
    setCaptchaQ({ a, b, answer: a + b });
    setUserCaptcha('');
  };

  // Status
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [notRegisteredNotice, setNotRegisteredNotice] = useState<boolean>(false);

  if (!isOpen) return null;

  // Send OTP for Login
  const handleSendLoginOtp = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setNotRegisteredNotice(false);

    if (!loginPhone || loginPhone.trim().length < 10) {
      setErrorMessage('لطفاً شماره تلفن همراه معتبر وارد نمایید (مثلاً ۰۹۱۲۳۴۵۶۷۸۹).');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ارسال پیامک');

      setIsOtpSent(true);
      setSuccessMessage(data.message || 'کد تایید پیامکی ارسال شد.');
      if (data.previewCode) setPreviewOtp(data.previewCode);
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ارسال پیامک');
    } finally {
      setSendingOtp(false);
    }
  };

  // Send OTP for Register
  const handleSendRegOtp = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regPhone || regPhone.trim().length < 10) {
      setErrorMessage('لطفاً شماره تلفن همراه معتبر وارد نمایید.');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: regPhone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ارسال پیامک');

      setIsRegOtpSent(true);
      setSuccessMessage(data.message || 'کد تایید پیامکی ارسال شد.');
      if (data.previewCode) setRegPreviewOtp(data.previewCode);
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ارسال پیامک');
    } finally {
      setSendingOtp(false);
    }
  };

  // Submit Unified Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setNotRegisteredNotice(false);

    // Validate Captcha
    if (Number(userCaptcha) !== captchaQ.answer) {
      setErrorMessage('پاسخ عبارت امنیتی (کپچا) نادرست است.');
      refreshCaptcha();
      return;
    }

    if (!loginPhone || loginPhone.trim().length < 4) {
      setErrorMessage('لطفاً شماره تلفن همراه خود را وارد کنید.');
      return;
    }

    if (loginMethod === 'password' && !loginPassword) {
      setErrorMessage('لطفاً رمز عبور را وارد کنید.');
      return;
    }

    if (loginMethod === 'otp' && (!loginOtpCode || loginOtpCode.trim().length < 4)) {
      setErrorMessage('لطفاً کد تایید پیامکی را وارد کنید.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: loginPhone.trim(),
          password: loginPassword,
          otpCode: loginOtpCode.trim(),
          mode: loginMethod,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.notRegistered) {
          setNotRegisteredNotice(true);
        }
        throw new Error(data.error || 'اطلاعات ورود نادرست است.');
      }

      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ورود به حساب');
    } finally {
      setLoading(false);
    }
  };

  // Submit Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate Captcha
    if (Number(userCaptcha) !== captchaQ.answer) {
      setErrorMessage('پاسخ عبارت امنیتی (کپچا) نادرست است.');
      refreshCaptcha();
      return;
    }

    if (!regName.trim() || !regPhone.trim() || !regPassword) {
      setErrorMessage('لطفاً نام، شماره موبایل و رمز عبور را تکمیل نمایید.');
      return;
    }

    if (!regOtpCode || regOtpCode.trim().length < 4) {
      setErrorMessage('لطفاً کد تایید پیامکی ارسال شده را وارد نمایید.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          phone: regPhone.trim(),
          email: regEmail.trim(),
          password: regPassword,
          otpCode: regOtpCode.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'خطا در ایجاد حساب کاربری');

      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ثبت‌نام');
    } finally {
      setLoading(false);
    }
  };

  // Quick switch from login to register with auto-filled phone
  const handleSwitchToRegister = () => {
    if (loginPhone) setRegPhone(loginPhone);
    setActiveTab('register');
    setErrorMessage(null);
    setNotRegisteredNotice(false);
    refreshCaptcha();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 font-['Vazirmatn']">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative text-slate-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">ورود و احراز هویت یکپارچه</h3>
              <p className="text-[11px] text-slate-400">سامانه هوشمند ترجمه کتاب</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: 2 Clean Options Only */}
        <div className="grid grid-cols-2 p-2 bg-slate-950/80 border-b border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage(null);
              setNotRegisteredNotice(false);
              refreshCaptcha();
            }}
            className={`py-2.5 px-2 rounded-xl text-center transition-all ${
              activeTab === 'login'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ورود به حساب کاربری
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMessage(null);
              setNotRegisteredNotice(false);
              refreshCaptcha();
            }}
            className={`py-2.5 px-2 rounded-xl text-center transition-all ${
              activeTab === 'register'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ثبت‌نام کاربر جدید
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Prompt if user is not registered */}
          {notRegisteredNotice && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2">
              <span>هنوز حسابی ندارید؟</span>
              <button
                type="button"
                onClick={handleSwitchToRegister}
                className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-[11px] hover:bg-amber-400 transition"
              >
                انتقال به ثبت‌نام
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 1: UNIFIED LOGIN (Single Phone Input -> Password or OTP) */}
          {/* ========================================================= */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Phone Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  شماره تلفن همراه (یا نام کاربری):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="09121234567 یا admin"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-500 focus:outline-none pl-10"
                    autoFocus
                    required
                  />
                  <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Method Switch: Password vs SMS OTP */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">روش ورود:</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('password')}
                    className={`py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition ${
                      loginMethod === 'password'
                        ? 'bg-slate-800 text-amber-400 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>رمز عبور</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('otp')}
                    className={`py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition ${
                      loginMethod === 'otp'
                        ? 'bg-slate-800 text-amber-400 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>پیامک یکبار مصرف (OTP)</span>
                  </button>
                </div>
              </div>

              {/* Method A: Password */}
              {loginMethod === 'password' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    رمز عبور:
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      dir="ltr"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-500 focus:outline-none pl-10"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Method B: SMS OTP */}
              {loginMethod === 'otp' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    کد تایید پیامکی:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      dir="ltr"
                      maxLength={6}
                      placeholder="کد ۶ رقمی"
                      value={loginOtpCode}
                      onChange={(e) => setLoginOtpCode(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-center text-sm focus:border-amber-500 focus:outline-none tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={handleSendLoginOtp}
                      disabled={sendingOtp || !loginPhone}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1 shrink-0 disabled:opacity-50"
                    >
                      {sendingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{isOtpSent ? 'ارسال مجدد' : 'دریافت پیامک'}</span>
                    </button>
                  </div>
                  {previewOtp && (
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] flex items-center justify-between">
                      <span>کد تایید ارسال‌شده (آزمایشی):</span>
                      <strong className="font-mono text-sm tracking-widest">{previewOtp}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Anti-Bot Captcha */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-300">کپچای امنیتی:</span>
                  <span className="font-mono font-bold text-white bg-slate-850 px-2.5 py-0.5 rounded-lg border border-slate-750 text-sm">
                    {captchaQ.a} + {captchaQ.b} = ؟
                  </span>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="p-1 text-slate-500 hover:text-slate-300"
                    title="تغییر سوال کپچا"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
                <input
                  type="number"
                  dir="ltr"
                  placeholder="پاسخ"
                  value={userCaptcha}
                  onChange={(e) => setUserCaptcha(e.target.value)}
                  className="w-16 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-750 text-white font-mono text-center text-xs focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                <span>ورود به سامانه</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleSwitchToRegister}
                  className="text-xs text-slate-400 hover:text-amber-400 transition"
                >
                  حساب کاربری ندارید؟ <span className="font-bold text-amber-400 underline">ثبت‌نام سریع</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* TAB 2: REGISTER (Phone + Mandatory SMS OTP + Optional Email) */}
          {/* ========================================================= */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  نام و نام خانوادگی:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="مثلاً: احمد رضایی"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none pl-9"
                    required
                    autoFocus
                  />
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  شماره تلفن همراه (احراز با پیامک):
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    dir="ltr"
                    placeholder="09121234567"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none pl-9"
                    required
                  />
                  <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    کد تایید پیامکی (OTP):
                  </label>
                  <button
                    type="button"
                    onClick={handleSendRegOtp}
                    disabled={sendingOtp || !regPhone}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 disabled:opacity-50"
                  >
                    {sendingOtp ? <Loader2 className="w-3 h-3 animate-spin" /> : <Smartphone className="w-3 h-3" />}
                    <span>{isRegOtpSent ? 'ارسال مجدد کد' : 'دریافت کد پیامکی'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  dir="ltr"
                  maxLength={6}
                  placeholder="کد ۶ رقمی پیامک شده"
                  value={regOtpCode}
                  onChange={(e) => setRegOtpCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-center text-xs focus:border-amber-500 focus:outline-none tracking-widest"
                  required
                />
                {regPreviewOtp && (
                  <div className="mt-1.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] flex items-center justify-between">
                    <span>کد تایید پیامکی ارسالی:</span>
                    <strong className="font-mono text-sm tracking-widest">{regPreviewOtp}</strong>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    آدرس ایمیل:
                  </label>
                  <span className="text-[10px] text-slate-500">اختیاری</span>
                </div>
                <div className="relative">
                  <input
                    type="email"
                    dir="ltr"
                    placeholder="example@mail.com (دلخواه)"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none pl-9"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  تعیین رمز عبور:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    dir="ltr"
                    placeholder="حداقل ۶ کاراکتر"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none pl-9"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Anti-Bot Captcha */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-300">کپچای امنیتی:</span>
                  <span className="font-mono font-bold text-white bg-slate-850 px-2.5 py-0.5 rounded-lg border border-slate-750 text-sm">
                    {captchaQ.a} + {captchaQ.b} = ؟
                  </span>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="p-1 text-slate-500 hover:text-slate-300"
                    title="تغییر سوال کپچا"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
                <input
                  type="number"
                  dir="ltr"
                  placeholder="پاسخ"
                  value={userCaptcha}
                  onChange={(e) => setUserCaptcha(e.target.value)}
                  className="w-16 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-750 text-white font-mono text-center text-xs focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>تکمیل ثبت‌نام و دریافت هدیه اولیه</span>
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMessage(null);
                    refreshCaptcha();
                  }}
                  className="text-xs text-slate-400 hover:text-amber-400 transition"
                >
                  قبلاً ثبت‌نام کرده‌اید؟ <span className="font-bold text-amber-400 underline">ورود به حساب</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
