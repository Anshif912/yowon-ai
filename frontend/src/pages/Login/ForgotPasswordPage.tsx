import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, KeyRound, Lock, ShieldCheck, Eye, EyeOff, 
  AlertTriangle, CheckCircle2, ArrowLeft, Shield
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/api';
import SoftAurora from '../../components/effects/SoftAurora';

type Step = 'email' | 'otp' | 'reset' | 'success';

const extractError = (err: unknown): string => {
  if (typeof err === 'object' && err !== null) {
    const axErr = err as { response?: { status?: number; data?: { detail?: string } } };
    if (axErr.response?.status && axErr.response.status >= 500) {
      return 'A server error occurred. Please try again later.';
    }
    const detail = axErr.response?.data?.detail;
    if (detail) return detail;
  }
  return 'An unexpected error occurred. Please try again.';
};

const AURORA_COLORS: [string, string, string] = ['#00e5ff', '#3B82F6', '#8B5CF6'];

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  // State
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdTouched, setPwdTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

  // Timers
  const [otpExpiry, setOtpExpiry] = useState(300); // 5 minutes
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [successCountdown, setSuccessCountdown] = useState(3);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Loading text animation
  useEffect(() => {
    let interval: any;
    if (isLoading && step === 'email') {
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev === 0 ? 1 : 0));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isLoading, step]);

  // OTP Timer
  useEffect(() => {
    let interval: any;
    if (step === 'otp' && otpExpiry > 0) {
      interval = setInterval(() => setOtpExpiry((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, otpExpiry]);

  // Resend Cooldown
  useEffect(() => {
    let interval: any;
    if (step === 'otp' && resendCooldown > 0) {
      interval = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendCooldown]);

  // Success Countdown
  useEffect(() => {
    let interval: any;
    if (step === 'success' && successCountdown > 0) {
      interval = setInterval(() => setSuccessCountdown((prev) => prev - 1), 1000);
    } else if (step === 'success' && successCountdown === 0) {
      navigate('/login');
    }
    return () => clearInterval(interval);
  }, [step, successCountdown, navigate]);

  // Focus first OTP box on mount
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // Password Strength Logic
  const getPasswordScore = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 12) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score += 1;
    return score;
  };

  const getStrengthProps = (score: number) => {
    switch (score) {
      case 0:
      case 1: return { label: 'Weak', text: 'text-red-400', bg: 'bg-red-500' };
      case 2: return { label: 'Fair', text: 'text-orange-400', bg: 'bg-orange-500' };
      case 3: return { label: 'Good', text: 'text-amber-400', bg: 'bg-amber-500' };
      case 4: return { label: 'Strong', text: 'text-cyan-400', bg: 'bg-cyan-400' };
      case 5: return { label: 'Excellent', text: 'text-emerald-400', bg: 'bg-emerald-400' };
      default: return { label: '', text: '', bg: '' };
    }
  };

  const pwdScore = getPasswordScore(password);
  const strengthProps = getStrengthProps(pwdScore);

  const pwdChecks = [
    { label: 'At least 12 characters', valid: password.length >= 12 },
    { label: 'Contains uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'Contains number', valid: /[0-9]/.test(password) },
    { label: 'Contains special character', valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
  ];

  const passMatch = password === confirmPassword;
  const showMatchError = pwdTouched && confirmTouched && !passMatch && confirmPassword.length > 0;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setLoadingTextIndex(0);
    try {
      await api.post('/auth/password/forgot', { email });
      setStep('otp');
      setOtpExpiry(300);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (otp: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.post('/auth/password/verify', { email, otp });
      setResetToken(res.data.resetToken);
      setStep('reset');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!/^[0-9]?$/.test(val)) return;
    setError(null);
    const newDigits = [...otpDigits];
    newDigits[index] = val;
    setOtpDigits(newDigits);

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    if (newDigits.every(d => d !== '')) {
      verifyOtp(newDigits.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').slice(0, 6).replace(/[^0-9]/g, '');
    if (!pasted) return;
    
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);
    
    const lastFilled = Math.min(pasted.length - 1, 5);
    inputRefs.current[lastFilled]?.focus();

    if (newDigits.every(d => d !== '')) {
      verifyOtp(newDigits.join(''));
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendCount >= 3) return;
    setError(null);
    try {
      await api.post('/auth/password/resend', { email });
      setOtpExpiry(300);
      setResendCooldown(60);
      setResendCount(prev => prev + 1);
    } catch (err) {
      setError(extractError(err));
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdScore < 3 || !passMatch || !password) return;
    setError(null);
    setIsLoading(true);
    try {
      await api.post('/auth/password/reset', { token: resetToken, password });
      setStep('success');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  const renderProgress = () => {
    if (step === 'success') return null;
    const steps: Step[] = ['email', 'otp', 'reset'];
    const currentIndex = steps.indexOf(step);
    
    return (
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-2 mb-2">
          {steps.map((s, idx) => (
            <React.Fragment key={s}>
              <div 
                className={`w-2.5 h-2.5 rounded-full ${idx <= currentIndex ? 'bg-cyan-500' : 'bg-zinc-800'}`}
              />
              {idx < steps.length - 1 && (
                <div className={`h-px w-8 ${idx < currentIndex ? 'bg-cyan-500/50' : 'bg-zinc-800'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex text-xs font-medium text-zinc-500 gap-6">
          <span className={step === 'email' ? 'text-zinc-300' : ''}>Email</span>
          <span className={step === 'otp' ? 'text-zinc-300' : ''}>Verify</span>
          <span className={step === 'reset' ? 'text-zinc-300' : ''}>Reset</span>
        </div>
      </div>
    );
  };

  const renderError = () => (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-200/90">{error}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070a] relative overflow-hidden font-sans text-zinc-300 selection:bg-cyan-500/30 selection:text-cyan-50">
      <div className="absolute inset-0 z-0">
        <SoftAurora colorStops={AURORA_COLORS} amplitude={1.0} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center mb-4 shadow-xl backdrop-blur-md">
            <Shield className="w-6 h-6 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-display font-semibold text-white tracking-tight">YOWON AI</h1>
          <p className="text-sm text-zinc-500 tracking-wide uppercase font-semibold mt-1">Sentinel Access</p>
        </div>

        <div className="bg-[#0c0d13]/80 border border-white/[0.06] rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
          {renderProgress()}
          {renderError()}

          <AnimatePresence mode="wait">
            {step === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-display font-semibold text-white mb-2">Forgot Password</h2>
                  <p className="text-sm text-zinc-400">Enter your registered email address to receive a verification code.</p>
                </div>

                <form onSubmit={handleEmailSubmit}>
                  <div className="mb-6 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-zinc-500" />
                    </div>
                    <input
                      autoFocus
                      type="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(null); }}
                      className="w-full bg-black/40 border border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/70 focus:border-cyan-500/70 transition-all"
                      placeholder="name@company.com"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !email}
                    className="w-full relative group overflow-hidden rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 p-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative bg-[#0c0d13] group-hover:bg-opacity-0 px-4 py-2.5 rounded-[7px] flex items-center justify-center gap-2 transition-all duration-300">
                      {isLoading ? (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-2 text-white">
                            <Lock className="w-4 h-4 animate-pulse" />
                            <AnimatePresence mode="wait">
                              <motion.span
                                key={loadingTextIndex}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="font-medium text-sm block h-5"
                              >
                                {loadingTextIndex === 0 ? "Securing your account..." : "Sending verification code..."}
                              </motion.span>
                            </AnimatePresence>
                          </div>
                        </div>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4 text-cyan-400 group-hover:text-white transition-colors" />
                          <span className="font-medium text-white">Send Verification Code</span>
                        </>
                      )}
                    </div>
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-display font-semibold text-white mb-2">Verify Your Identity</h2>
                  <p className="text-sm text-zinc-400">
                    Enter the 6-digit code sent to <span className="text-cyan-400 font-medium">{email}</span>
                  </p>
                </div>

                <div className="flex justify-center gap-2 mb-6">
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      pattern="[0-9]"
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      className="w-11 h-13 text-center text-xl font-mono text-white bg-black/40 border border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/70 focus:border-cyan-500/70 transition-all"
                    />
                  ))}
                </div>

                <div className="text-center mb-6 text-sm">
                  {otpExpiry > 0 ? (
                    <p className="text-zinc-400">OTP expires in <span className="font-mono text-zinc-300">{formatTime(otpExpiry)}</span></p>
                  ) : (
                    <p className="text-amber-500 font-medium">Code expired — request a new one</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => verifyOtp(otpDigits.join(''))}
                  disabled={isLoading || otpDigits.some(d => !d) || otpExpiry === 0}
                  className="w-full relative group overflow-hidden rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 p-[1px] disabled:opacity-50 disabled:cursor-not-allowed mb-6"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative bg-[#0c0d13] group-hover:bg-opacity-0 px-4 py-2.5 rounded-[7px] flex items-center justify-center gap-2 transition-all duration-300">
                    {isLoading ? (
                      <>
                        <Lock className="w-4 h-4 animate-pulse text-white" />
                        <span className="font-medium text-white">Verifying...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-cyan-400 group-hover:text-white transition-colors" />
                        <span className="font-medium text-white">Verify Code</span>
                      </>
                    )}
                  </div>
                </button>

                <div className="text-center text-sm">
                  {resendCooldown > 0 ? (
                    <p className="text-zinc-500">Resend available in {resendCooldown}s</p>
                  ) : resendCount >= 3 ? (
                    <p className="text-zinc-500">Maximum resends reached</p>
                  ) : (
                    <button onClick={handleResend} className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                      Resend Code
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'reset' && (
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-display font-semibold text-white mb-2">Set New Password</h2>
                  <p className="text-sm text-zinc-400">Choose a strong password for your account.</p>
                </div>

                <form onSubmit={handleResetSubmit}>
                  <div className="space-y-4 mb-6">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-zinc-500" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                        onFocus={() => setPwdTouched(true)}
                        className="w-full bg-black/40 border border-zinc-700 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/70 focus:border-cyan-500/70 transition-all font-mono text-sm"
                        placeholder="New password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-zinc-500" />
                      </div>
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                        onFocus={() => setConfirmTouched(true)}
                        className={`w-full bg-black/40 border ${showMatchError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-zinc-700 focus:border-cyan-500/70 focus:ring-cyan-500/70'} rounded-lg pl-10 pr-10 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-all font-mono text-sm`}
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {showMatchError && (
                      <p className="text-xs text-red-400 mt-1">Passwords do not match.</p>
                    )}
                  </div>

                  <div className="mb-6 bg-black/20 rounded-lg p-4 border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Password Strength</span>
                      <span className={`text-xs font-bold uppercase tracking-wider ${strengthProps.text}`}>{strengthProps.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mb-4">
                      <div 
                        className={`h-full ${strengthProps.bg} transition-all duration-500`} 
                        style={{ width: `${(pwdScore / 5) * 100}%` }}
                      />
                    </div>
                    <div className="space-y-2">
                      {pwdChecks.map((check, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          {check.valid ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-zinc-600" />
                          )}
                          <span className={`text-xs ${check.valid ? 'text-zinc-300' : 'text-zinc-500'}`}>{check.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || pwdScore < 3 || !passMatch || !password}
                    className="w-full relative group overflow-hidden rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 p-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative bg-[#0c0d13] group-hover:bg-opacity-0 px-4 py-2.5 rounded-[7px] flex items-center justify-center gap-2 transition-all duration-300">
                      {isLoading ? (
                        <>
                          <Lock className="w-4 h-4 animate-pulse text-white" />
                          <span className="font-medium text-white">Updating password...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4 text-cyan-400 group-hover:text-white transition-colors" />
                          <span className="font-medium text-white">Update Password</span>
                        </>
                      )}
                    </div>
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="flex justify-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                  >
                    <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                  </motion.div>
                </div>
                
                <h2 className="text-xl font-display font-semibold text-white mb-3">Password Updated Successfully</h2>
                <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
                  All active sessions have been signed out. Please log in again with your new password.
                </p>

                <p className="text-sm text-zinc-500 mb-6 flex items-center justify-center gap-1">
                  Redirecting to sign in in 
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={successCountdown}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="font-mono font-medium text-zinc-300 inline-block w-3"
                    >
                      {successCountdown}
                    </motion.span>
                  </AnimatePresence>
                  ...
                </p>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors border border-white/10 flex items-center justify-center gap-2"
                >
                  Continue to Sign In
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {step !== 'success' && (
          <div className="mt-8 text-center">
            <Link 
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
