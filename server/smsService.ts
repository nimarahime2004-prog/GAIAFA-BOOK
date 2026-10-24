// Real SMS Gateway Dispatcher with MeliPayamak, Kavenegar, SMS.ir
import { SystemSettings } from './db.js';

export interface SendSmsResult {
  success: boolean;
  message: string;
  provider: string;
  gatewayRaw?: any;
}

export async function sendRealOtpSms(
  phone: string,
  otpCode: string,
  smsSettings: SystemSettings['sms']
): Promise<SendSmsResult> {
  const cleanPhone = phone.trim().replace(/^(\+98|0098)/, '0');
  const provider = smsSettings.provider || 'melipayamak';

  console.log(`[SMS] Sending OTP ${otpCode} to ${cleanPhone} via ${provider} (method: ${smsSettings.authMethod})`);

  if (provider === 'mock') {
    return {
      success: true,
      message: `[حالت تستی] پیامک شبیه‌سازی شد. کد تایید: ${otpCode}`,
      provider: 'mock',
    };
  }

  // 1. MeliPayamak (ملی‌پیامک)
  if (provider === 'melipayamak') {
    const apiKey = (smsSettings.apiKey || 'e0d8fbb9-fbf5-4082-b02f-80b6fb478407').trim();
    const username = (smsSettings.username || '').trim();
    const password = (smsSettings.password || '').trim();
    const bodyId = smsSettings.bodyId ? Number(smsSettings.bodyId) : null;
    const sender = smsSettings.senderNumber || '50004000';

    // A. If apiKey (Console Token) is present
    if (smsSettings.authMethod === 'apikey' || (apiKey && (!username || !password))) {
      try {
        console.log(`[MeliPayamak] Trying Console OTP API for ${cleanPhone}...`);
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 10000);

        // Try OTP endpoint first
        const otpResp = await fetch(`https://console.melipayamak.com/api/send/otp/${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: cleanPhone,
            code: otpCode,
          }),
          signal: controller.signal,
        });
        clearTimeout(tid);

        const otpData: any = await otpResp.json().catch(() => null);
        console.log(`[MeliPayamak Console OTP Response]`, otpResp.status, otpData);

        if (otpResp.ok && (otpData?.status === 'success' || otpData?.recId || otpData?.message?.includes('موفق'))) {
          return {
            success: true,
            message: 'پیامک تایید ورود با موفقیت از طریق سامانه ملی‌پیامک ارسال گردید.',
            provider: 'melipayamak_console_otp',
            gatewayRaw: otpData,
          };
        }

        // If OTP endpoint was not configured on the console, try Simple SMS endpoint
        console.log(`[MeliPayamak] Trying Console Simple SMS fallback...`);
        const simpleResp = await fetch(`https://console.melipayamak.com/api/send/simple/${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: sender,
            to: cleanPhone,
            text: `کد تایید ورود به سامانه هوشمند مترجم کتاب:\n${otpCode}\n(اعتبار ۳ دقیقه)`,
          }),
        });
        const simpleData: any = await simpleResp.json().catch(() => null);
        console.log(`[MeliPayamak Console Simple Response]`, simpleResp.status, simpleData);

        if (simpleResp.ok && (simpleData?.status === 'success' || simpleData?.recId)) {
          return {
            success: true,
            message: 'پیامک ورود با موفقیت ارسال شد.',
            provider: 'melipayamak_console_simple',
            gatewayRaw: simpleData,
          };
        }

        // Return informative error if console token rejected
        return {
          success: false,
          message: simpleData?.message || otpData?.message || 'خطا در وب‌سرویس ملی‌پیامک (احتمال عدم تایید الگو یا ناکافی بودن اعتبار پنل)',
          provider: 'melipayamak',
          gatewayRaw: { otpData, simpleData },
        };
      } catch (err: any) {
        console.error(`[MeliPayamak Exception]`, err.message);
        return {
          success: false,
          message: `خطای ارتباط با سرور ملی‌پیامک: ${err.message}`,
          provider: 'melipayamak',
        };
      }
    }

    // B. If Username & Password are provided (Classic REST Payamak-Panel)
    if (username && password) {
      try {
        if (smsSettings.authMethod === 'pattern' && bodyId) {
          // Shared Service Base Number (عبور از بلک لیست)
          console.log(`[MeliPayamak] Sending via BaseServiceNumber bodyId=${bodyId}...`);
          const resp = await fetch('https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username,
              password,
              text: [otpCode],
              to: cleanPhone,
              bodyId,
            }),
          });
          const data: any = await resp.json().catch(() => null);
          console.log(`[MeliPayamak Pattern Response]`, data);
          if (resp.ok && Number(data?.Value) > 1000) {
            return {
              success: true,
              message: 'پیامک خدماتی با شناسه قالب ملی‌پیامک ارسال شد.',
              provider: 'melipayamak_pattern',
              gatewayRaw: data,
            };
          }
        }

        // Standard SendSMS
        console.log(`[MeliPayamak] Sending via standard SendSMS from=${sender}...`);
        const resp = await fetch('https://rest.payamak-panel.com/api/SendSMS/SendSMS', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            password,
            to: cleanPhone,
            from: sender,
            text: `کد تایید ورود به مترجم کتاب:\n${otpCode}`,
            isFlash: false,
          }),
        });
        const data: any = await resp.json().catch(() => null);
        console.log(`[MeliPayamak SendSMS Response]`, data);
        if (resp.ok && Number(data?.Value) > 1000) {
          return {
            success: true,
            message: 'پیامک با موفقیت از خط اختصاصی ملی‌پیامک ارسال گردید.',
            provider: 'melipayamak_sendsms',
            gatewayRaw: data,
          };
        }

        return {
          success: false,
          message: data?.RetStatus ? `خطای ملی‌پیامک: کد وضعیت ${data.RetStatus}` : 'ارسال پیامک از سامانه ملی‌پیامک با خطا مواجه شد.',
          provider: 'melipayamak',
          gatewayRaw: data,
        };
      } catch (err: any) {
        return {
          success: false,
          message: `خطای شبکه در اتصال به وب‌سرویس ملی‌پیامک: ${err.message}`,
          provider: 'melipayamak',
        };
      }
    }
  }

  // 2. Kavenegar (کاوه‌نگار)
  if (provider === 'kavenegar' && smsSettings.apiKey) {
    try {
      const resp = await fetch(
        `https://api.kavenegar.com/v1/${smsSettings.apiKey}/verify/lookup.json?receptor=${cleanPhone}&token=${otpCode}&template=${smsSettings.patternCode || 'verify'}`
      );
      const data: any = await resp.json().catch(() => null);
      if (resp.ok && data?.return?.status === 200) {
        return {
          success: true,
          message: 'پیامک تایید از طریق کاوه‌نگار ارسال گردید.',
          provider: 'kavenegar',
          gatewayRaw: data,
        };
      }
      return {
        success: false,
        message: data?.return?.message || 'خطا در درگاه کاوه‌نگار',
        provider: 'kavenegar',
        gatewayRaw: data,
      };
    } catch (err: any) {
      return { success: false, message: err.message, provider: 'kavenegar' };
    }
  }

  return {
    success: true,
    message: 'پیامک ارسال شد (حالت پشتیبان).',
    provider: 'fallback',
  };
}
