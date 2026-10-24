import React, { useState, useEffect } from 'react';
import {
  X,
  Wallet,
  CreditCard,
  History,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { TransactionRecord, User } from '../types.ts';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onBalanceUpdated: (newBalance: number) => void;
}

export function WalletModal({ isOpen, onClose, user, onBalanceUpdated }: WalletModalProps) {
  const [activeTab, setActiveTab] = useState<'recharge' | 'history'>('recharge');
  const [amount, setAmount] = useState<number>(100000);
  const [gateway, setGateway] = useState<'zarinpal' | 'zibal' | 'nextpay' | 'idpay'>('zarinpal');
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
    }
  }, [isOpen]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/user/transactions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.warn('Could not fetch transactions');
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ code: couponCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'کد تخفیف نامعتبر است.');
      setStatusMessage({ type: 'success', text: data.message });
      if (data.newBalance !== undefined) {
        onBalanceUpdated(data.newBalance);
      }
      setCouponCode('');
      fetchTransactions();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setApplyingCoupon(false);
    }
  };

  if (!isOpen) return null;

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

  const handleRecharge = async (mode: 'gateway' | 'sandbox' = 'gateway') => {
    if (!amount || amount < 10000) {
      setStatusMessage({ type: 'error', text: 'حداقل مبلغ شارژ ۱۰,۰۰۰ تومان است.' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      // 1. Create invoice in system
      const invoiceRes = await fetch('/api/payment/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ amount, gateway }),
      });

      const invoiceData = await invoiceRes.json();
      if (!invoiceRes.ok) throw new Error(invoiceData.error || 'خطا در ایجاد فاکتور');

      if (mode === 'gateway') {
        // Direct redirect to Bank Gateway / Shaparak Portal!
        setStatusMessage({ type: 'success', text: 'در حال هدایت به درگاه پرداخت الکترونیک بانکی شاپرک...' });
        const redirectUrl = invoiceData.paymentUrl || `/payment/gateway/${invoiceData.transactionId}`;
        window.location.href = redirectUrl;
        return;
      }

      // Quick sandbox test mode
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ transactionId: invoiceData.transactionId }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || 'خطا در تایید تراکنش');

      onBalanceUpdated(verifyData.newBalance);
      setStatusMessage({
        type: 'success',
        text: `شارژ تستی با موفقیت انجام شد! کد پیگیری: ${verifyData.trackingCode || invoiceData.trackingCode}`,
      });
      fetchTransactions();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'خطا در پرداخت' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 font-['Vazirmatn']">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">مدیریت کیف پول و تراکنش‌ها</h3>
              <p className="text-xs text-slate-400">
                موجودی فعلی: <span className="font-bold text-amber-400">{user.walletBalance.toLocaleString('fa-IR')} تومان</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('recharge')}
            className={`flex-1 py-2 rounded-xl text-center flex items-center justify-center gap-2 transition-all ${
              activeTab === 'recharge'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>افزایش موجودی</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-xl text-center flex items-center justify-center gap-2 transition-all ${
              activeTab === 'history'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>تاریخچه تراکنش‌ها ({transactions.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          {statusMessage && (
            <div
              className={`mb-4 sm:mb-5 p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {activeTab === 'recharge' ? (
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  انتخاب مبالغ پیشنهادی شارژ (تومان):
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {quickAmounts.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAmount(q)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                        amount === q
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {q.toLocaleString('fa-IR')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  یا مبلغ دلخواه (تومان):
                </label>
                <input
                  type="number"
                  min="10000"
                  step="10000"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  درگاه پرداخت بانکی:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setGateway('zarinpal')}
                    className={`p-2.5 rounded-xl border text-right transition-all ${
                      gateway === 'zarinpal'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs">زرین‌پال</div>
                    <div className="text-[10px] text-slate-400">شاپرک / کارت شتاب</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGateway('zibal')}
                    className={`p-2.5 rounded-xl border text-right transition-all ${
                      gateway === 'zibal'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs">زیبال (Zibal)</div>
                    <div className="text-[10px] text-slate-400">درگاه هوشمند</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGateway('nextpay')}
                    className={`p-2.5 rounded-xl border text-right transition-all ${
                      gateway === 'nextpay'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs">نکست‌پی</div>
                    <div className="text-[10px] text-slate-400">سریع چندبانکی</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGateway('idpay')}
                    className={`p-2.5 rounded-xl border text-right transition-all ${
                      gateway === 'idpay'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs">آیدی‌پی</div>
                    <div className="text-[10px] text-slate-400">پرداخت مستقیم</div>
                  </button>
                </div>
              </div>

              {/* Coupon / Promo Code Form */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  کد تخفیف یا شارژ هدیه:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    dir="ltr"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME50"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={applyingCoupon || !couponCode.trim()}
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs border border-slate-700 transition disabled:opacity-40"
                  >
                    {applyingCoupon ? '...' : 'اعمال کد'}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>اتصال با پروتکل امن به سامانه شاپرک و تسویه آنی کیف پول شما</span>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleRecharge('gateway')}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  <span>اتصال به درگاه بانکی شاپرک و پرداخت {amount.toLocaleString('fa-IR')} تومان</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleRecharge('sandbox')}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-amber-400 font-semibold text-xs border border-slate-700 transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>شارژ تستی در محیط آزمایشگاهی (توسعه و بدون کارت بانکی)</span>
                </button>
              </div>
            </div>
          ) : (
            /* History Tab */
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  هیچ تراکنشی یافت نشد.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          tx.amount >= 0
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {tx.amount >= 0 ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{tx.description}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {tx.trackingCode ? `پیگیری: ${tx.trackingCode} • ` : ''}
                          {new Date(tx.createdAt).toLocaleDateString('fa-IR')}
                        </div>
                      </div>
                    </div>

                    <div className="text-left font-mono font-bold">
                      <span className={tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
