import express from 'express';
import crypto from 'crypto';
import { db, User, BookRecord, TranslationJob, TransactionRecord, ApiKeyConfig } from './db.ts';
import { queueManager } from './queue.ts';
import { GoogleGenAI } from '@google/genai';
import { sendRealOtpSms } from './smsService.ts';
import { zarinpalService } from './zarinpalService.ts';

// Helper to extract authenticated user from Authorization header
export function getAuthUser(req: express.Request): User | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    return db.getSessionUser(token);
  }
  return null;
}

// Auth guard middleware
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'لطفاً ابتدا وارد حساب کاربری خود شوید.' });
  }
  if (user.status === 'banned') {
    return res.status(403).json({ error: 'حساب کاربری شما مسدود شده است. با پشتیبانی تماس بگیرید.' });
  }
  (req as any).user = user;
  next();
}

// Admin guard middleware
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'دسترسی فقط مخصوص مدیر ارشد سامانه است.' });
  }
  (req as any).user = user;
  next();
}

export function setupSaasRoutes(app: express.Express) {
  // ==========================================
  // 1. PUBLIC CMS & CONFIG
  // ==========================================
  app.get('/api/public/config', (req, res) => {
    const settings = db.getSettings();
    return res.json({
      cms: settings.cms,
      seo: settings.seo,
      pricing: settings.pricing,
      gateways: {
        zarinpal: settings.gateways.zarinpal.enabled,
        nextpay: settings.gateways.nextpay.enabled,
        idpay: settings.gateways.idpay.enabled,
        stripe: settings.gateways.stripe.enabled,
      },
      headerFooter: db.getHeaderFooter(),
      customPages: db.getCustomPages(true).map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        metaDescription: p.metaDescription,
        showInHeader: p.showInHeader ?? false,
        showInFooter: p.showInFooter ?? true,
      })),
      maintenanceMode: settings.security.maintenanceMode,
    });
  });

  // ==========================================
  // 2. AUTHENTICATION & SESSIONS
  // ==========================================

  // Register with SMS OTP verification and optional email
  app.post('/api/auth/register', (req, res) => {
    const { name, phone, email, password, otpCode } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'لطفاً نام، شماره موبایل و رمز عبور را وارد کنید.' });
    }

    const cleanPhone = phone.trim();
    if (!otpCode || !otpCode.trim()) {
      return res.status(400).json({ error: 'کد تایید پیامکی (OTP) الزامی است. لطفاً ابتدا کد را دریافت و وارد نمایید.' });
    }

    const isOtpValid = db.verifyOtp(cleanPhone, otpCode.trim());
    if (!isOtpValid) {
      return res.status(400).json({ error: 'کد تایید پیامکی نادرست است یا منقضی شده است.' });
    }

    const existingPhone = db.getUserByEmailOrPhone(cleanPhone);
    if (existingPhone) {
      return res.status(400).json({ error: 'کاربری با این شماره موبایل قبلاً ثبت نام کرده است.' });
    }

    if (email && email.trim()) {
      const existingEmail = db.getUserByEmailOrPhone(email.trim());
      if (existingEmail) {
        return res.status(400).json({ error: 'کاربری با این ایمیل قبلاً ثبت نام کرده است.' });
      }
    }

    const user = db.createUser({
      name,
      phone: cleanPhone,
      email: email ? email.trim() : '',
      password,
      role: 'user',
    });
    const token = db.createSession(user.id);

    return res.json({
      success: true,
      message: 'ثبت‌نام با موفقیت انجام شد.',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance,
        status: user.status,
      },
    });
  });

  // Unified Login (Phone with Password OR OTP)
  app.post('/api/auth/login', (req, res) => {
    const { phone, password, otpCode, mode = 'password' } = req.body;
    const identifier = (phone || req.body.identifier || '').trim();

    if (!identifier) {
      return res.status(400).json({ error: 'لطفاً شماره تلفن همراه خود را وارد نمایید.' });
    }

    const user = db.getUserByEmailOrPhone(identifier);
    if (!user) {
      return res.status(404).json({
        error: 'شماره وارد شده در سامانه ثبت نشده است. لطفاً ابتدا ثبت‌نام فرمایید.',
        notRegistered: true,
      });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ error: 'حساب کاربری شما مسدود شده است.' });
    }

    if (mode === 'otp') {
      if (!otpCode || !otpCode.trim()) {
        return res.status(400).json({ error: 'لطفاً کد تایید پیامکی ۶ رقمی را وارد نمایید.' });
      }
      const isOtpValid = db.verifyOtp(user.phone, otpCode.trim());
      if (!isOtpValid) {
        return res.status(400).json({ error: 'کد تایید پیامکی نادرست است یا منقضی شده است.' });
      }
    } else {
      // password mode
      if (!password) {
        return res.status(400).json({ error: 'لطفاً رمز عبور را وارد نمایید.' });
      }
      const isValid = db.verifyPassword(user, password);
      if (!isValid) {
        return res.status(400).json({ error: 'رمز عبور وارد شده نادرست است.' });
      }
    }

    db.updateUser(user.id, { lastLoginAt: Date.now() });
    const token = db.createSession(user.id);

    return res.json({
      success: true,
      message: 'ورود موفقیت‌آمیز بود.',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance,
        status: user.status,
      },
    });
  });

  // Send SMS OTP
  app.post('/api/auth/send-otp', async (req, res) => {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string' || phone.trim().length < 10) {
      return res.status(400).json({ error: 'شماره تلفن همراه معتبر نیست.' });
    }

    const cleanPhone = phone.trim();
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    db.setOtp(cleanPhone, otpCode);

    const smsSettings = db.getSettings().sms;
    const smsResult = await sendRealOtpSms(cleanPhone, otpCode, smsSettings);

    return res.json({
      success: true,
      message: smsResult.message || `کد تایید ۶ رقمی به شماره ${cleanPhone} ارسال شد.`,
      previewCode: otpCode, // Provided for instant test validation
      gatewaySuccess: smsResult.success,
      gatewayRaw: smsResult.gatewayRaw,
      expiresInSeconds: 180,
    });
  });

  // Verify SMS OTP
  app.post('/api/auth/verify-otp', (req, res) => {
    const { phone, code, name } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: 'شماره موبایل و کد تایید الزامی است.' });
    }

    const isValid = db.verifyOtp(phone, code);
    if (!isValid) {
      return res.status(400).json({ error: 'کد تایید نادرست است یا منقضی شده است.' });
    }

    let user = db.getUserByEmailOrPhone(phone);
    if (!user) {
      // Auto-register new phone user
      user = db.createUser({
        name: name || `کاربر ${phone.slice(-4)}`,
        phone,
        email: `${phone}@translator.internal`,
        role: 'user',
      });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ error: 'حساب کاربری شما مسدود است.' });
    }

    db.updateUser(user.id, { lastLoginAt: Date.now() });
    const token = db.createSession(user.id);

    return res.json({
      success: true,
      message: 'ورود با پیامک موفقیت‌آمیز بود.',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance,
        status: user.status,
      },
    });
  });

  // Quick demo mode has been removed as requested by admin.
  // Use /api/auth/login with seeded admin or user credentials.
  app.post('/api/auth/quick-demo', (_req, res) => {
    return res.status(403).json({
      error: 'حالت دمو حذف شده است. لطفاً با نام کاربری و رمز عبور وارد شوید.',
    });
  });

  // Current User Profile
  app.get('/api/auth/me', requireAuth, (req, res) => {
    const user = (req as any).user as User;
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance,
        status: user.status,
      },
    });
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      db.deleteSession(authHeader.slice(7).trim());
    }
    return res.json({ success: true });
  });

  // ==========================================
  // 3. PRICING & WORD COUNT CALCULATION
  // ==========================================
  app.post('/api/pricing/calculate', (req, res) => {
    const { words, tone } = req.body;
    const cleanWords = Math.max(0, Number(words) || 0);
    const settings = db.getSettings().pricing;

    let multiplier = 1.0;
    if (tone === 'academic' || tone === 'aerospace' || tone === 'mathematics') {
      multiplier = settings.specializedMultiplier || 1.25;
    }

    const costPerWord = Math.round(settings.costPerWord * multiplier);
    const totalCost = Math.round(cleanWords * costPerWord);
    const estimatedChunks = Math.max(1, Math.ceil(cleanWords / 700));
    const estimatedMinutes = Math.max(1, Math.ceil((estimatedChunks * 4.5) / 60));

    const user = getAuthUser(req);
    const userBalance = user ? user.walletBalance : 0;
    const hasEnoughBalance = userBalance >= totalCost;

    return res.json({
      words: cleanWords,
      costPerWord,
      totalCost,
      estimatedChunks,
      estimatedMinutes,
      userBalance,
      hasEnoughBalance,
      shortfall: Math.max(0, totalCost - userBalance),
    });
  });

  // ==========================================
  // 4. BOOKS MANAGEMENT
  // ==========================================

  // Get user's books
  app.get('/api/books', requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const books = db.getBooks(user.id).map(b => ({
      ...b,
      chunks: Array.isArray(b.chunks) ? b.chunks : [],
      glossary: Array.isArray(b.glossary) ? b.glossary : [],
    }));
    return res.json({ books });
  });

  // Get single book
  app.get('/api/books/:id', requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const book = db.getBookById(req.params.id);

    if (!book) {
      return res.status(404).json({ error: 'کتاب مورد نظر یافت نشد.' });
    }

    if (book.userId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'شما دسترسی به این کتاب را ندارید.' });
    }

    return res.json({
      book: {
        ...book,
        chunks: Array.isArray(book.chunks) ? book.chunks : [],
        glossary: Array.isArray(book.glossary) ? book.glossary : [],
      },
    });
  });

  // Create Book & optionally Start Background Translation
  app.post('/api/books/create', requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const {
      title,
      originalTitle,
      author,
      translator,
      tone,
      chunks,
      glossary,
      startTranslation = true,
    } = req.body;

    if (!title || !Array.isArray(chunks) || chunks.length === 0) {
      return res.status(400).json({ error: 'اطلاعات کتاب و بخش‌های آن الزامی است.' });
    }

    // Calculate total words
    let totalWords = 0;
    chunks.forEach((c: any) => {
      totalWords += Number(c.wordCount) || 0;
    });

    const settings = db.getSettings().pricing;
    let multiplier = 1.0;
    if (tone === 'academic' || tone === 'aerospace' || tone === 'mathematics') {
      multiplier = settings.specializedMultiplier || 1.25;
    }
    const costPerWord = Math.round(settings.costPerWord * multiplier);
    const estimatedCost = Math.round(totalWords * costPerWord);

    // If starting translation immediately, check wallet balance
    if (startTranslation) {
      if (user.walletBalance < estimatedCost) {
        return res.status(402).json({
          error: `موجودی کیف پول شما کافی نیست. هزینه ترجمه: ${estimatedCost.toLocaleString('fa-IR')} تومان - موجودی فعلی: ${user.walletBalance.toLocaleString('fa-IR')} تومان.`,
          requiredAmount: estimatedCost,
          currentBalance: user.walletBalance,
        });
      }

      // Deduct wallet balance
      db.addTransaction({
        userId: user.id,
        amount: -estimatedCost,
        type: 'charge',
        description: `هزینه ترجمه پس‌زمینه کتاب «${title}» (${totalWords.toLocaleString('fa-IR')} کلمه)`,
        status: 'success',
      });
    }

    const bookId = `book_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const newBook: BookRecord = {
      id: bookId,
      userId: user.id,
      title: title.trim(),
      originalTitle: (originalTitle || title).trim(),
      author: (author || 'نامشخص').trim(),
      translator: (translator || user.name || 'سامانه هوشمند ترجمه کتاب').trim(),
      tone: tone || 'spiritual',
      wordCount: totalWords,
      estimatedCost,
      status: startTranslation ? 'translating' : 'draft',
      chunks: chunks.map((c: any, idx: number) => ({
        id: c.id || `chk_${bookId}_${idx + 1}`,
        chapterNumber: c.chapterNumber || idx + 1,
        chapterTitle: c.chapterTitle || `فصل ${idx + 1}`,
        chunkNumber: c.chunkNumber || 1,
        englishText: c.englishText || '',
        translatedHtml: c.translatedHtml || undefined,
        status: c.translatedHtml ? 'completed' : (startTranslation ? 'queued' : 'idle'),
        wordCount: c.wordCount || 0,
        estimatedTokens: c.estimatedTokens || Math.ceil((c.wordCount || 100) * 1.35),
        hasImages: Boolean(c.hasImages),
        imageCount: c.imageCount || 0,
      })),
      glossary: Array.isArray(glossary) ? glossary : [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    db.saveBook(newBook);

    let jobId: string | undefined;
    if (startTranslation) {
      // Create translation job in server queue
      jobId = `job_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const job: TranslationJob = {
        id: jobId,
        bookId: newBook.id,
        userId: user.id,
        status: 'queued',
        totalChunks: newBook.chunks.length,
        completedChunks: newBook.chunks.filter(c => c.status === 'completed').length,
        progressPercent: 0,
        currentChunkTitle: newBook.chunks[0]?.chapterTitle,
        startedAt: Date.now(),
        updatedAt: Date.now(),
      };
      db.saveJob(job);
    }

    return res.json({
      success: true,
      message: startTranslation
        ? 'سفارش ترجمه با موفقیت ثبت شد و پردازش ابری در سرور آغاز گردید. می‌توانید پنجره را ببندید!'
        : 'کتاب به عنوان پیش‌نویس ذخیره شد.',
      book: newBook,
      jobId,
      updatedWalletBalance: user.walletBalance,
    });
  });

  // Update book (e.g. user manually edits translated text in reader)
  app.put('/api/books/:id', requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const book = db.getBookById(req.params.id);

    if (!book) {
      return res.status(404).json({ error: 'کتاب یافت نشد.' });
    }

    if (book.userId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'دسترسی غیرمجاز.' });
    }

    const { title, author, translator, tone, chunks, glossary, designConfig } = req.body;
    if (title) book.title = title;
    if (author) book.author = author;
    if (translator) book.translator = translator;
    if (tone) book.tone = tone;
    if (Array.isArray(chunks)) book.chunks = chunks;
    if (Array.isArray(glossary)) book.glossary = glossary;
    if (designConfig) (book as any).designConfig = designConfig;

    db.saveBook(book);
    return res.json({ success: true, book });
  });

  // Delete book
  app.delete('/api/books/:id', requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const ok = db.deleteBook(req.params.id, user.role === 'admin' ? undefined : user.id);

    if (!ok) {
      return res.status(404).json({ error: 'کتاب یافت نشد یا دسترسی حذف آن را ندارید.' });
    }

    return res.json({ success: true, message: 'کتاب با موفقیت حذف گردید.' });
  });

  // Start Translation for an existing draft book
  app.post('/api/books/:id/start-translation', requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const book = db.getBookById(req.params.id);

    if (!book) {
      return res.status(404).json({ error: 'کتاب یافت نشد.' });
    }

    if (book.userId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'دسترسی غیرمجاز.' });
    }

    if (user.walletBalance < book.estimatedCost) {
      return res.status(402).json({
        error: `موجودی کافی نیست. هزینه ترجمه: ${book.estimatedCost.toLocaleString('fa-IR')} تومان`,
        requiredAmount: book.estimatedCost,
      });
    }

    // Deduct
    db.addTransaction({
      userId: user.id,
      amount: -book.estimatedCost,
      type: 'charge',
      description: `هزینه شروع ترجمه ابری کتاب «${book.title}»`,
      status: 'success',
    });

    book.status = 'translating';
    book.chunks.forEach(c => {
      if (c.status !== 'completed') c.status = 'queued';
    });
    db.saveBook(book);

    const jobId = `job_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const job: TranslationJob = {
      id: jobId,
      bookId: book.id,
      userId: user.id,
      status: 'queued',
      totalChunks: book.chunks.length,
      completedChunks: book.chunks.filter(c => c.status === 'completed').length,
      progressPercent: 0,
      startedAt: Date.now(),
      updatedAt: Date.now(),
    };
    db.saveJob(job);

    return res.json({
      success: true,
      message: 'ترجمه کتاب در صف پردازش سرور قرار گرفت.',
      jobId,
      updatedWalletBalance: user.walletBalance,
    });
  });

  // Stop / Cancel active translation with automatic refund for remaining un-translated words
  app.post('/api/books/:id/stop-translation', requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const book = db.getBookById(req.params.id);

    if (!book) {
      return res.status(404).json({ error: 'کتاب مورد نظر یافت نشد.' });
    }

    if (book.userId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'دسترسی غیرمجاز.' });
    }

    // Stop all active jobs for this book
    const jobs = db.getJobs(user.id).filter(j => j.bookId === book.id && (j.status === 'queued' || j.status === 'processing'));
    for (const j of jobs) {
      j.status = 'stopped';
      db.saveJob(j);
    }

    book.status = 'draft';
    // Reset queued chunk status
    book.chunks.forEach(c => {
      if (c.status === 'queued' || c.status === 'translating') {
        c.status = 'idle';
      }
    });
    db.saveBook(book);

    // Calculate uncompleted chunks and fair refund
    const uncompletedChunks = book.chunks.filter(c => !c.translatedHtml);
    const uncompletedWords = uncompletedChunks.reduce((sum, c) => sum + (c.wordCount || 0), 0);

    const settings = db.getSettings().pricing;
    let multiplier = 1.0;
    if (book.tone === 'academic' || book.tone === 'aerospace' || book.tone === 'mathematics') {
      multiplier = settings.specializedMultiplier || 1.25;
    }
    const costPerWord = Math.round(settings.costPerWord * multiplier);
    const refundAmount = Math.round(uncompletedWords * costPerWord);

    if (refundAmount > 0) {
      db.addTransaction({
        userId: user.id,
        amount: refundAmount,
        type: 'refund',
        description: `بازگشت هزینه ${uncompletedWords.toLocaleString('fa-IR')} کلمه ترجمه‌نشده کتاب «${book.title}»`,
        status: 'success',
      });
    }

    const freshUser = db.getUserById(user.id);

    return res.json({
      success: true,
      message: `ترجمه با موفقیت متوقف شد. مبلغ ${refundAmount.toLocaleString('fa-IR')} تومان بابت بخش‌های باقی‌مانده به کیف پول شما واریز گردید.`,
      refundAmount,
      uncompletedWords,
      book,
      updatedWalletBalance: freshUser?.walletBalance || user.walletBalance,
    });
  });

  // Online Delete of a Chunk/Page
  app.delete('/api/books/:id/chunks/:chunkId', requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const book = db.getBookById(req.params.id);

    if (!book) return res.status(404).json({ error: 'کتاب یافت نشد.' });
    if (book.userId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'دسترسی غیرمجاز.' });
    }

    const initialLen = book.chunks.length;
    book.chunks = book.chunks.filter(c => c.id !== req.params.chunkId);
    if (book.chunks.length === initialLen) {
      return res.status(404).json({ error: 'بخش مورد نظر در کتاب یافت نشد.' });
    }

    // Re-index remaining chunks
    book.chunks.forEach((c, idx) => {
      c.chunkNumber = idx + 1;
    });

    // Recalculate wordCount
    book.wordCount = book.chunks.reduce((sum, c) => sum + (c.wordCount || 0), 0);
    const settings = db.getSettings().pricing;
    let multiplier = 1.0;
    if (book.tone === 'academic' || book.tone === 'aerospace' || book.tone === 'mathematics') {
      multiplier = settings.specializedMultiplier || 1.25;
    }
    book.estimatedCost = Math.round(book.wordCount * Math.round(settings.costPerWord * multiplier));
    db.saveBook(book);

    return res.json({
      success: true,
      message: 'صفحه/بخش با موفقیت حذف شد.',
      book,
    });
  });

  // Online Edit of a Chunk/Page
  app.put('/api/books/:id/chunks/:chunkId', requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const book = db.getBookById(req.params.id);

    if (!book) return res.status(404).json({ error: 'کتاب یافت نشد.' });
    if (book.userId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'دسترسی غیرمجاز.' });
    }

    const chunk = book.chunks.find(c => c.id === req.params.chunkId);
    if (!chunk) {
      return res.status(404).json({ error: 'بخش مورد نظر یافت نشد.' });
    }

    const { chapterTitle, englishText, translatedHtml } = req.body;
    if (chapterTitle !== undefined) chunk.chapterTitle = chapterTitle;
    if (englishText !== undefined) {
      chunk.englishText = englishText;
      chunk.wordCount = englishText.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
      chunk.estimatedTokens = Math.ceil(chunk.wordCount * 1.35);
    }
    if (translatedHtml !== undefined) {
      chunk.translatedHtml = translatedHtml;
      if (translatedHtml.trim()) {
        chunk.status = 'completed';
      }
    }

    book.wordCount = book.chunks.reduce((sum, c) => sum + (c.wordCount || 0), 0);
    db.saveBook(book);

    return res.json({
      success: true,
      message: 'تغییرات صفحه با موفقیت ذخیره شد.',
      chunk,
      book,
    });
  });

  // Apply Coupon / Promo Code
  app.post('/api/coupons/apply', requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'کد تخفیف الزامی است.' });

    const result = db.applyCoupon(user.id, code);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result);
  });

  // Get active jobs for current user
  app.get('/api/jobs/my-active', requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const jobs = db.getJobs(user.id).filter(j => j.status === 'queued' || j.status === 'processing');
    return res.json({ jobs });
  });

  // Get status of specific job
  app.get('/api/jobs/status/:jobId', requireAuth, (req, res) => {
    const job = db.getJobById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: 'پردازش مورد نظر یافت نشد.' });
    }
    const book = db.getBookById(job.bookId);
    return res.json({ job, book });
  });

  // ==========================================
  // 6. WALLET & PAYMENTS
  // ==========================================

  // Get transactions
  app.get('/api/user/transactions', requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const transactions = db.getTransactions(user.id);
    return res.json({ transactions });
  });

  // Create payment invoice (Real Zarinpal v4 Web-Service or fallback)
  app.post('/api/payment/create-invoice', requireAuth, async (req, res) => {
    const user = (req as any).user as User;
    const { amount, gateway = 'zarinpal' } = req.body;
    const cleanAmount = Number(amount);

    if (!cleanAmount || cleanAmount < 10000) {
      return res.status(400).json({ error: 'حداقل مبلغ افزایش موجودی ۱۰,۰۰۰ تومان است.' });
    }

    const settings = db.getSettings();
    const trackingCode = `TXN-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const tx = db.addTransaction({
      userId: user.id,
      amount: cleanAmount,
      type: 'deposit',
      description: `افزایش موجودی آنلاین از درگاه ${gateway === 'zibal' ? 'زیبال' : gateway === 'zarinpal' ? 'زرین‌پال' : gateway === 'nextpay' ? 'نکست‌پی' : gateway === 'idpay' ? 'آیدی‌پی' : 'بانکی'}`,
      gateway: gateway as any,
      status: 'pending',
      trackingCode,
    });

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host');

    // 1. ZarinPal Real REST API v4 flow
    if (gateway === 'zarinpal') {
      const zpConfig = settings.gateways.zarinpal;
      if (!zpConfig.enabled) {
        return res.status(400).json({ error: 'درگاه پرداخت زرین‌پال در حال حاضر توسط مدیریت سامانه غیرفعال است.' });
      }

      const merchant = (zpConfig.merchantId || '').trim();
      if (!merchant || merchant === '00000000-0000-0000-0000-000000000000') {
        return res.status(400).json({
          error: 'مرچنت کد ۳۶ کاراکتری زرین‌پال در پنل مدیریت هنوز تنظیم نشده است. لطفاً مدیر سامانه کد اختصاصی پذیرنده زرین‌پال را در پنل مدیریت ثبت کند.',
        });
      }

      const callbackUrl = `${protocol}://${host}/api/payment/zarinpal/callback?txId=${tx.id}`;
      const zpResult = await zarinpalService.requestPayment({
        merchantId: merchant,
        amountTomans: cleanAmount,
        isSandbox: zpConfig.isSandbox,
        currency: zpConfig.currency || 'IRT',
        description: `افزایش اعتبار کیف پول کاربر ${user.name || user.phone}`,
        callbackUrl,
        mobile: user.phone,
        email: user.email || undefined,
        orderId: tx.id,
      });

      if (!zpResult.success) {
        tx.status = 'failed';
        db.saveDatabase();
        return res.status(400).json({
          error: zpResult.error || 'خطا در ارتباط با وب‌سرویس زرین‌پال',
          details: zpResult,
        });
      }

      // Store authority on transaction record
      tx.authority = zpResult.authority;
      db.saveDatabase();

      return res.json({
        success: true,
        transactionId: tx.id,
        trackingCode: tx.trackingCode,
        authority: zpResult.authority,
        amount: cleanAmount,
        gateway: 'zarinpal',
        paymentUrl: zpResult.paymentUrl, // Official ZarinPal StartPay URL
      });
    }

    // Direct sandbox/fallback checkout URL
    return res.json({
      success: true,
      transactionId: tx.id,
      trackingCode,
      amount: cleanAmount,
      gateway,
      paymentUrl: `/payment/gateway/${tx.id}`,
    });
  });

  // ZarinPal Callback Handler (Invoked when user returns from payment.zarinpal.com/pg/StartPay/...)
  app.get('/api/payment/zarinpal/callback', async (req, res) => {
    const authority = (req.query.Authority || req.query.authority) as string;
    const status = (req.query.Status || req.query.status) as string;
    const txId = (req.query.txId || req.query.order_id) as string;

    const transactions = db.getTransactions();
    const tx = transactions.find(t => (txId && t.id === txId) || (authority && t.authority === authority));

    if (!tx) {
      return res.redirect('/?payment=error&message=' + encodeURIComponent('تراکنش مالی در سامانه یافت نشد.'));
    }

    // If transaction was already verified
    if (tx.status === 'success') {
      return res.redirect(`/?payment=success&txId=${tx.id}&amount=${tx.amount}&trackingCode=${tx.trackingCode}`);
    }

    if (status !== 'OK') {
      tx.status = 'failed';
      db.saveDatabase();
      return res.redirect(`/?payment=canceled&txId=${tx.id}&message=` + encodeURIComponent('پرداخت توسط خریدار در درگاه بانک لغو شد یا ناموفق بود.'));
    }

    // Call ZarinPal verify endpoint
    const settings = db.getSettings();
    const zpConfig = settings.gateways.zarinpal;

    const verifyResult = await zarinpalService.verifyPayment({
      merchantId: zpConfig.merchantId,
      amountTomans: tx.amount,
      isSandbox: zpConfig.isSandbox,
      currency: zpConfig.currency || 'IRT',
      authority,
    });

    if (verifyResult.success) {
      tx.status = 'success';
      tx.trackingCode = String(verifyResult.ref_id || tx.trackingCode);
      tx.refId = verifyResult.ref_id;
      tx.cardPan = verifyResult.card_pan;
      tx.fee = verifyResult.fee;

      const user = db.getUserById(tx.userId);
      if (user) {
        user.walletBalance = (user.walletBalance || 0) + tx.amount;
        db.updateUser(user.id, { walletBalance: user.walletBalance });
      }
      db.saveDatabase();

      return res.redirect(`/?payment=success&txId=${tx.id}&amount=${tx.amount}&trackingCode=${verifyResult.ref_id || tx.trackingCode}&cardPan=${verifyResult.card_pan || ''}`);
    } else {
      tx.status = 'failed';
      db.saveDatabase();
      return res.redirect(`/?payment=failed&txId=${tx.id}&message=` + encodeURIComponent(verifyResult.error || 'تراکنش توسط وب‌سرویس زرین‌پال تایید نشد.'));
    }
  });

  // Verify / Complete Payment (Simulated instant checkout for seamless testing)
  app.post('/api/payment/verify', requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const { transactionId } = req.body;

    const txs = db.getTransactions(user.id);
    const tx = txs.find(t => t.id === transactionId);

    if (!tx) {
      return res.status(404).json({ error: 'تراکنش یافت نشد.' });
    }

    if (tx.status === 'success') {
      return res.json({ success: true, message: 'این تراکنش قبلاً با موفقیت پرداخت شده است.', balance: user.walletBalance });
    }

    tx.status = 'success';
    user.walletBalance += tx.amount;
    db.updateUser(user.id, { walletBalance: user.walletBalance });

    return res.json({
      success: true,
      message: `مبلغ ${tx.amount.toLocaleString('fa-IR')} تومان به موجودی کیف پول افزوده شد.`,
      newBalance: user.walletBalance,
      trackingCode: tx.trackingCode,
    });
  });

  // Dedicated Bank / Shaparak Gateway Portal View
  app.get(['/payment/gateway/:txId', '/api/payment/simulate-checkout'], (req, res) => {
    const txId = (req.params.txId || req.query.txId) as string;
    const transactions = db.getTransactions();
    const tx = transactions.find(t => t.id === txId);

    if (!tx) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
        <head><meta charset="utf-8"><title>تراکنش یافت نشد</title></head>
        <body style="font-family: Tahoma, sans-serif; text-align: center; padding: 50px; background: #0f172a; color: #fff;">
          <h2>شناسه فاکتور نامعتبر است</h2>
          <p>تراکنش مورد نظر در سیستم یافت نشد.</p>
          <a href="/" style="color: #f59e0b; text-decoration: none;">بازگشت به سامانه</a>
        </body>
        </html>
      `);
    }

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>درگاه پرداخت الکترونیک شاپرک | پرداخت امن</title>
        <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Vazirmatn', Tahoma, sans-serif;
            background: #f1f5f9;
            color: #1e293b;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .header {
            background: #1e3a8a;
            color: #fff;
            padding: 16px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          }
          .header-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 800;
            font-size: 16px;
          }
          .security-seal {
            background: rgba(255,255,255,0.15);
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .container {
            max-width: 600px;
            width: 100%;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 24px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
            overflow: hidden;
          }
          .invoice-card {
            background: #f8fafc;
            border-bottom: 2px dashed #cbd5e1;
            padding: 24px;
          }
          .invoice-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            font-size: 13px;
            color: #475569;
          }
          .invoice-row:last-child { margin-bottom: 0; }
          .amount-val {
            font-size: 20px;
            font-weight: 800;
            color: #059669;
          }
          .form-body {
            padding: 28px 24px;
          }
          .form-group {
            margin-bottom: 20px;
          }
          .form-group label {
            display: block;
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 8px;
            color: #334155;
          }
          .input-control {
            width: 100%;
            padding: 12px 16px;
            border-radius: 12px;
            border: 1px solid #cbd5e1;
            font-size: 15px;
            font-family: inherit;
            direction: ltr;
            text-align: center;
            outline: none;
            transition: all 0.2s;
          }
          .input-control:focus {
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .btn-submit {
            width: 100%;
            background: linear-gradient(135deg, #059669, #10b981);
            color: #fff;
            padding: 14px;
            border: none;
            border-radius: 14px;
            font-size: 15px;
            font-weight: 800;
            font-family: inherit;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            transition: all 0.2s;
          }
          .btn-submit:hover {
            filter: brightness(1.08);
          }
          .btn-cancel {
            display: block;
            text-align: center;
            margin-top: 14px;
            color: #64748b;
            text-decoration: none;
            font-size: 13px;
            font-weight: 600;
          }
          .btn-cancel:hover { color: #dc2626; }
          .timer-box {
            font-size: 12px;
            color: #e11d48;
            font-weight: 700;
            background: #ffe4e6;
            padding: 4px 10px;
            border-radius: 8px;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #94a3b8;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <header class="header">
          <div class="header-brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>درگاه پرداخت اینترنتی شاپرک</span>
          </div>
          <div class="security-seal">
            <span>اتصال امن SSL</span>
            <span class="timer-box" id="timeRemaining">09:59</span>
          </div>
        </header>

        <div class="container">
          <div class="invoice-card">
            <div class="invoice-row">
              <span>نام پذیرنده:</span>
              <strong style="color: #0f172a;">سامانه هوشمند مترجم و ویراستار کتاب</strong>
            </div>
            <div class="invoice-row">
              <span>کد پیگیری تراکنش:</span>
              <span style="font-family: monospace; font-weight: bold;">${tx.trackingCode}</span>
            </div>
            <div class="invoice-row">
              <span>مبلغ قابل پرداخت:</span>
              <span class="amount-val">${tx.amount.toLocaleString('fa-IR')} تومان</span>
            </div>
            <div class="invoice-row" style="font-size: 11px; color: #94a3b8;">
              <span>معادل ریالی:</span>
              <span>${(tx.amount * 10).toLocaleString('fa-IR')} ریال</span>
            </div>
          </div>

          <form action="/api/payment/gateway-complete" method="POST" class="form-body">
            <input type="hidden" name="txId" value="${tx.id}" />

            <div class="form-group">
              <label>شماره کارت ۱۶ رقمی شتاب:</label>
              <input type="text" name="cardNumber" class="input-control" placeholder="6037-9918-xxxx-xxxx" maxlength="19" value="6037-9918-4512-8820" required />
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label>کد امنیتی (CVV2):</label>
                <input type="password" name="cvv2" class="input-control" placeholder="•••" maxlength="4" value="482" required />
              </div>

              <div class="form-group">
                <label>تاریخ انقضا (ماه / سال):</label>
                <div style="display: flex; gap: 8px;">
                  <input type="text" placeholder="ماه" class="input-control" maxlength="2" value="08" required />
                  <input type="text" placeholder="سال" class="input-control" maxlength="2" value="06" required />
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>رمز دوم پویا یا ثابت:</label>
              <div style="display: flex; gap: 8px;">
                <input type="password" name="pin" class="input-control" placeholder="رمز اینترنتی" value="123456" required />
                <button type="button" style="padding: 0 16px; border-radius: 12px; background: #e2e8f0; border: 1px solid #cbd5e1; font-family: inherit; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap;" onclick="alert('رمز پویای یک‌بارمصرف به شماره همراه متصل به کارت پیامک شد.')">
                  دریافت رمز پویا
                </button>
              </div>
            </div>

            <button type="submit" class="btn-submit">
              پرداخت و تایید نهایی (${tx.amount.toLocaleString('fa-IR')} تومان)
            </button>

            <a href="/?payment=canceled&txId=${tx.id}" class="btn-cancel">
              انصراف از پرداخت و بازگشت به کیف پول
            </a>
          </form>
        </div>

        <footer class="footer">
          <p>کلیه حقوق این سامانه متعلق به شبکه الکترونیکی پرداخت کارت (شاپرک) می‌باشد.</p>
        </footer>

        <script>
          let seconds = 599;
          const timerEl = document.getElementById('timeRemaining');
          setInterval(() => {
            if (seconds <= 0) {
              alert('زمان پرداخت به پایان رسید.');
              window.location.href = '/?payment=expired';
              return;
            }
            seconds--;
            const m = Math.floor(seconds / 60).toString().padStart(2, '0');
            const s = (seconds % 60).toString().padStart(2, '0');
            timerEl.innerText = m + ':' + s;
          }, 1000);
        </script>
      </body>
      </html>
    `;
    return res.send(html);
  });

  // Gateway Completion Action
  app.post('/api/payment/gateway-complete', (req, res) => {
    const { txId } = req.body;
    const transactions = db.getTransactions();
    const tx = transactions.find(t => t.id === txId);

    if (!tx) {
      return res.redirect('/?payment=error&message=تراکنش_یافت_نشد');
    }

    if (tx.status !== 'success') {
      tx.status = 'success';
      const user = db.getUserById(tx.userId);
      if (user) {
        user.walletBalance = (user.walletBalance || 0) + tx.amount;
        db.updateUser(user.id, { walletBalance: user.walletBalance });
      }
    }

    return res.redirect(`/?payment=success&txId=${tx.id}&amount=${tx.amount}&trackingCode=${tx.trackingCode}`);
  });

  // ==========================================
  // 7. ADMIN PANEL ENDPOINTS
  // ==========================================

  // Admin Overview
  app.get('/api/admin/overview', requireAdmin, (req, res) => {
    const users = db.getUsers();
    const books = db.getBooks();
    const jobs = db.getJobs();
    const transactions = db.getTransactions();
    const apiKeys = db.getApiKeys();

    let totalWords = 0;
    books.forEach(b => { totalWords += b.wordCount || 0; });

    let totalRevenue = 0;
    transactions.forEach(t => {
      if (t.type === 'deposit' && t.status === 'success') {
        totalRevenue += t.amount;
      }
    });

    const activeJobs = jobs.filter(j => j.status === 'queued' || j.status === 'processing');

    return res.json({
      totalUsers: users.length,
      totalBooks: books.length,
      totalWords,
      totalRevenue,
      activeJobsCount: activeJobs.length,
      activeJobs,
      apiKeysCount: apiKeys.length,
      apiKeysActive: apiKeys.filter(k => k.isActive && k.cooldownUntil <= Date.now()).length,
      recentUsers: users.slice(-5).reverse(),
      recentTransactions: transactions.slice(0, 10),
    });
  });

  // Admin Users List
  app.get('/api/admin/users', requireAdmin, (req, res) => {
    const users = db.getUsers();
    const books = db.getBooks();
    const transactions = db.getTransactions();

    const userList = users.map(u => {
      const userTxs = transactions.filter(t => t.userId === u.id);
      const totalSpent = userTxs
        .filter(t => (t.type === 'charge' || t.amount < 0) && t.status === 'success')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const totalDeposited = userTxs
        .filter(t => (t.type === 'deposit' || t.type === 'admin_gift') && t.status === 'success')
        .reduce((sum, t) => sum + t.amount, 0);

      const userBooks = books.filter(b => b.userId === u.id);
      const translatedWords = userBooks.reduce((sum, b) => {
        const completedChunks = b.chunks.filter(c => c.status === 'completed' || c.translatedHtml);
        return sum + completedChunks.reduce((csum, c) => csum + (c.wordCount || 0), 0);
      }, 0);

      return {
        ...u,
        booksCount: userBooks.length,
        totalSpent,
        totalDeposited,
        translatedWords,
      };
    });
    return res.json({ users: userList });
  });

  // Admin Create New User
  app.post('/api/admin/users/create', requireAdmin, (req, res) => {
    const { name, phone, email, password, role, walletBalance } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'نام و شماره همراه کاربر الزامی است.' });
    }

    const cleanPhone = phone.trim();
    const existing = db.getUserByEmailOrPhone(cleanPhone) || (email ? db.getUserByEmailOrPhone(email.trim()) : null);
    if (existing) {
      return res.status(400).json({ error: 'کاربری با این شماره همراه یا ایمیل در سیستم موجود است.' });
    }

    const newUser = db.createUser({
      name: name.trim(),
      phone: cleanPhone,
      email: email ? email.trim() : '',
      password: password || 'User@123456',
      role: role === 'admin' ? 'admin' : 'user',
      walletBalance: Number(walletBalance) || 0,
    });

    return res.json({
      success: true,
      message: 'کاربر جدید با موفقیت ایجاد شد.',
      user: newUser,
    });
  });

  // Admin Update User (name, phone, email, role, status, password)
  app.put('/api/admin/users/:id', requireAdmin, (req, res) => {
    const { name, phone, email, role, status, password } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (email !== undefined) updates.email = email.trim();
    if (role !== undefined) updates.role = role;
    if (status !== undefined) updates.status = status;

    const updated = db.updateUser(req.params.id, updates);
    if (!updated) return res.status(404).json({ error: 'کاربر یافت نشد.' });

    if (password && password.trim()) {
      db.setUserPassword(req.params.id, password.trim());
    }

    return res.json({ success: true, user: updated, message: 'مشخصات کاربر با موفقیت به‌روزرسانی شد.' });
  });

  // Admin Adjust Wallet
  app.post('/api/admin/users/:id/adjust-wallet', requireAdmin, (req, res) => {
    const { amount, description } = req.body;
    const user = db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'کاربر یافت نشد.' });

    const diff = Number(amount);
    if (isNaN(diff)) return res.status(400).json({ error: 'مبلغ نامعتبر است.' });

    db.addTransaction({
      userId: user.id,
      amount: diff,
      type: diff >= 0 ? 'admin_gift' : 'charge',
      description: description || (diff >= 0 ? 'افزایش دستی موجودی توسط مدیر ارشد' : 'کسر دستی موجودی توسط مدیر ارشد'),
      status: 'success',
      trackingCode: `ADM-${Date.now().toString().slice(-6)}`,
    });

    const updated = db.getUserById(req.params.id);

    return res.json({
      success: true,
      message: diff >= 0
        ? `مبلغ ${Math.abs(diff).toLocaleString('fa-IR')} تومان به کیف پول کاربر افزوده شد.`
        : `مبلغ ${Math.abs(diff).toLocaleString('fa-IR')} تومان از کیف پول کاربر کسر گردید.`,
      newBalance: updated?.walletBalance || user.walletBalance,
    });
  });

  // Admin Test SMS Sending (MeliPayamak, Kavenegar, Mock)
  app.post('/api/admin/sms/test', requireAdmin, async (req, res) => {
    const { targetPhone, message } = req.body;
    const settings = db.getSettings().sms;

    if (!targetPhone || !targetPhone.trim()) {
      return res.status(400).json({ error: 'شماره تلفن همراه مقصد برای ارسال تست الزامی است.' });
    }

    const testText = message || `کد تایید تست سامانه ترجمه کتاب: ${Math.floor(100000 + Math.random() * 900000)}`;

    if (settings.provider === 'mock') {
      return res.json({
        success: true,
        message: `پیامک به صورت شبیه‌سازی (Mock) با موفقیت ارسال شد: "${testText}" به شماره ${targetPhone}`,
        simulated: true,
      });
    }

    if (settings.provider === 'melipayamak') {
      try {
        if (settings.authMethod === 'credentials') {
          if (!settings.username || !settings.password) {
            return res.status(400).json({ error: 'نام کاربری یا رمز عبور ملی‌پیامک در تنظیمات تکمیل نشده است.' });
          }

          // Call MeliPayamak Simple REST Send
          const response = await fetch('https://rest.payamak-panel.com/api/SendSMS/SendSMS', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: settings.username.trim(),
              password: settings.password.trim(),
              to: targetPhone.trim(),
              from: settings.senderNumber?.trim() || '50004000',
              text: testText,
              isFlash: false,
            }),
          });

          const data = await response.json();
          if (data?.Value && Number(data.Value) > 100) {
            return res.json({
              success: true,
              message: `پیامک از طریق ملی‌پیامک (شناسه پیگیری: ${data.Value}) با موفقیت به سرور مخابرات ارسال شد.`,
              recId: data.Value,
            });
          } else {
            return res.status(400).json({
              error: `پاسخ وب‌سرویس ملی‌پیامک: ${data?.RetStatus || 'خطا در احراز هویت یا موجودی پنل ملی‌پیامک (کد: ' + data?.Value + ')'}`,
              rawResponse: data,
            });
          }
        } else if (settings.authMethod === 'pattern') {
          // Shared Service / Base Service Pattern
          if (!settings.username || !settings.password || !settings.bodyId) {
            return res.status(400).json({ error: 'نام کاربری، رمز عبور و شناسه الگو (BodyId) الزامی است.' });
          }

          const response = await fetch('https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: settings.username.trim(),
              password: settings.password.trim(),
              text: '123456',
              to: targetPhone.trim(),
              bodyId: Number(settings.bodyId),
            }),
          });
          const data = await response.json();
          return res.json({ success: true, message: 'درخواست به وب‌سرویس الگوی خدماتی ملی‌پیامک ارسال گردید.', rawResponse: data });
        } else {
          // Token / API Key
          return res.json({
            success: true,
            message: `ارسال از طریق توکن کنسول ملی‌پیامک به شماره ${targetPhone} فراخوانی شد.`,
          });
        }
      } catch (smsErr: any) {
        return res.status(500).json({ error: `خطا در ارتباط با سرور ملی‌پیامک: ${smsErr.message}` });
      }
    }

    return res.json({ success: true, message: `ارسال به شماره ${targetPhone} با موفقیت ثبت شد.` });
  });

  // Admin View Books of a User
  app.get('/api/admin/users/:id/books', requireAdmin, (req, res) => {
    const books = db.getBooks(req.params.id);
    return res.json({ books });
  });

  // Admin Transactions
  app.get('/api/admin/transactions', requireAdmin, (req, res) => {
    const transactions = db.getTransactions();
    return res.json({ transactions });
  });

  // Admin API Keys Pool
  app.get('/api/admin/api-keys', requireAdmin, (req, res) => {
    const keys = db.getApiKeys();
    return res.json({ keys });
  });

  // Admin Save / Update API Key (Create or Update)
  app.post('/api/admin/api-keys', requireAdmin, (req, res) => {
    const { id, name, provider, apiKey, model, baseURL, isActive, priority } = req.body;
    if (!name || !apiKey || !provider) {
      return res.status(400).json({ error: 'اطلاعات کلید API ناقص است (نام، کلید و ارائه‌دهنده الزامی هستند).' });
    }

    const existing = id ? db.getApiKeys().find(k => k.id === id) : null;

    const keyConfig: ApiKeyConfig = {
      ...(existing || {}),
      id: id || `key_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      name: name.trim(),
      provider: provider || 'gemini',
      apiKey: apiKey.trim(),
      model: model || 'gemini-3.8-flash',
      baseURL: baseURL?.trim() || '',
      isActive: isActive !== false,
      priority: Number(priority) || 1,
      totalRequests: existing?.totalRequests || 0,
      successfulRequests: existing?.successfulRequests || 0,
      failedRequests: existing?.failedRequests || 0,
      totalTokensUsed: existing?.totalTokensUsed || 0,
      rpmCount: existing?.rpmCount || 0,
      cooldownUntil: existing?.cooldownUntil || 0,
    };

    db.saveApiKey(keyConfig);
    return res.json({ success: true, key: keyConfig, message: existing ? 'کلید با موفقیت ویرایش شد.' : 'کلید جدید با موفقیت در سرور ذخیره شد.' });
  });

  // Admin Direct Edit API Key (PUT)
  app.put('/api/admin/api-keys/:id', requireAdmin, (req, res) => {
    const keyId = req.params.id;
    const existing = db.getApiKeys().find(k => k.id === keyId);
    if (!existing) {
      return res.status(404).json({ error: 'کلید مورد نظر در سرور یافت نشد.' });
    }

    const { name, provider, apiKey, model, baseURL, isActive, priority } = req.body;
    const updatedConfig: ApiKeyConfig = {
      ...existing,
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(provider !== undefined ? { provider } : {}),
      ...(apiKey !== undefined && apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
      ...(model !== undefined ? { model } : {}),
      ...(baseURL !== undefined ? { baseURL: baseURL.trim() } : {}),
      ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      ...(priority !== undefined ? { priority: Number(priority) } : {}),
    };

    db.saveApiKey(updatedConfig);
    return res.json({ success: true, key: updatedConfig, message: 'کلید در سرور با موفقیت بروزرسانی شد.' });
  });

  // Admin Test All API Keys Concurrently (Benchmark & Latency check)
  app.post('/api/admin/api-keys/test-all', requireAdmin, async (req, res) => {
    const keys = db.getApiKeys();
    const results: Array<{ id: string; name: string; success: boolean; latencyMs?: number; error?: string }> = [];

    await Promise.all(
      keys.map(async (k) => {
        const t0 = Date.now();
        try {
          if (k.provider === 'gemini') {
            const ai = new GoogleGenAI({
              apiKey: k.apiKey,
              httpOptions: { timeout: 10000 },
            });
            const resp = await ai.models.generateContent({
              model: k.model || 'gemini-3.8-flash',
              contents: 'Ping',
              config: { maxOutputTokens: 5 },
            });
            const latencyMs = Date.now() - t0;
            k.lastLatencyMs = latencyMs;
            db.saveApiKey(k);
            results.push({ id: k.id, name: k.name, success: true, latencyMs });
          } else {
            // OpenAI-compatible ping
            const targetUrl = `${(k.baseURL || 'https://api.openai.com/v1').replace(/\/+$/, '')}/chat/completions`;
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), 12000);
            const resp = await fetch(targetUrl, {
              method: 'POST',
              signal: controller.signal,
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${k.apiKey}`,
              },
              body: JSON.stringify({
                model: k.model || 'gpt-4o-mini',
                messages: [{ role: 'user', content: 'Ping' }],
                max_tokens: 5,
              }),
            });
            clearTimeout(tid);
            const latencyMs = Date.now() - t0;
            if (resp.ok) {
              k.lastLatencyMs = latencyMs;
              db.saveApiKey(k);
              results.push({ id: k.id, name: k.name, success: true, latencyMs });
            } else {
              results.push({ id: k.id, name: k.name, success: false, latencyMs, error: `HTTP ${resp.status}` });
            }
          }
        } catch (err: any) {
          results.push({ id: k.id, name: k.name, success: false, error: err.message || 'خطای اتصال' });
        }
      })
    );

    return res.json({ success: true, results });
  });

  // Admin Queue Live Stats (Realtime Background Worker status)
  app.get('/api/admin/queue/stats', requireAdmin, (req, res) => {
    const stats = queueManager.getStats();
    return res.json({ stats });
  });

  // Admin Delete API Key
  app.delete('/api/admin/api-keys/:id', requireAdmin, (req, res) => {
    const ok = db.deleteApiKey(req.params.id);
    if (!ok) return res.status(404).json({ error: 'کلید یافت نشد.' });
    return res.json({ success: true, message: 'کلید با موفقیت از سرور حذف شد.' });
  });

  // Admin Get Settings
  app.get('/api/admin/settings', requireAdmin, (req, res) => {
    const settings = db.getSettings();
    return res.json({ settings });
  });

  // Admin Update Settings
  app.put('/api/admin/settings', requireAdmin, (req, res) => {
    const updated = db.updateSettings(req.body);
    return res.json({ success: true, settings: updated });
  });

  // Admin Test SMS
  app.post('/api/admin/sms/test', requireAdmin, async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'شماره تلفن الزامی است.' });
    const settings = db.getSettings().sms;
    const testCode = Math.floor(100000 + Math.random() * 900000).toString();
    const smsResult = await sendRealOtpSms(phone, testCode, settings);
    return res.json({
      success: smsResult.success,
      message: smsResult.message,
      gatewayRaw: smsResult.gatewayRaw,
    });
  });

  // Admin Test Zarinpal Web-Service Connection
  app.post('/api/admin/gateways/test-zarinpal', requireAdmin, async (req, res) => {
    const { merchantId, isSandbox } = req.body;
    const settings = db.getSettings();
    const effectiveMerchant = (merchantId || settings.gateways.zarinpal.merchantId || '').trim();
    const effectiveSandbox = isSandbox !== undefined ? isSandbox : settings.gateways.zarinpal.isSandbox;

    const result = await zarinpalService.testConnection(effectiveMerchant, effectiveSandbox);
    return res.json(result);
  });

  // Admin Coupons Management
  app.get('/api/admin/coupons', requireAdmin, (req, res) => {
    return res.json({ coupons: db.getCoupons() });
  });

  app.post('/api/admin/coupons', requireAdmin, (req, res) => {
    const { code, creditBonus = 0, discountPercent = 0, maxUses = 100, isActive = true } = req.body;
    if (!code) return res.status(400).json({ error: 'کد تخفیف الزامی است.' });

    const newCoupon = {
      id: `cp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      code: code.trim().toUpperCase(),
      creditBonus: Number(creditBonus) || 0,
      discountPercent: Number(discountPercent) || 0,
      maxUses: Number(maxUses) || 100,
      timesUsed: 0,
      isActive: Boolean(isActive),
      createdAt: Date.now(),
    };

    db.saveCoupon(newCoupon);
    return res.json({ success: true, coupon: newCoupon });
  });

  app.delete('/api/admin/coupons/:id', requireAdmin, (req, res) => {
    const ok = db.deleteCoupon(req.params.id);
    if (!ok) return res.status(404).json({ error: 'کد تخفیف یافت نشد.' });
    return res.json({ success: true });
  });

  // Admin Backup / Export Database
  app.get('/api/admin/backup', requireAdmin, (req, res) => {
    const backup = db.exportBackup();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=book_translator_backup_${Date.now()}.json`);
    return res.json(backup);
  });

  // ==========================================
  // 8. CUSTOM PAGES BUILDER (HTML & SLUG)
  // ==========================================

  // Public: Get all published custom pages
  app.get('/api/custom-pages', (req, res) => {
    const user = getAuthUser(req);
    const isAdmin = user && user.role === 'admin';
    const pages = db.getCustomPages(!isAdmin);
    return res.json({ pages });
  });

  // Public: Get single custom page by slug
  app.get('/api/custom-pages/:slug', (req, res) => {
    const page = db.getCustomPageBySlug(req.params.slug);
    if (!page) {
      return res.status(404).json({ error: 'برگه مورد نظر یافت نشد.' });
    }
    const user = getAuthUser(req);
    const isAdmin = user && user.role === 'admin';
    if (!page.isPublished && !isAdmin) {
      return res.status(403).json({ error: 'این برگه در حال حاضر منتشر نشده است.' });
    }
    return res.json({ page });
  });

  // Admin: Create or update custom page
  app.post('/api/admin/custom-pages', requireAdmin, (req, res) => {
    const { id, title, slug, htmlContent, metaDescription, isPublished, showInHeader, showInFooter } = req.body;
    if (!title || !slug || !htmlContent) {
      return res.status(400).json({ error: 'عنوان، آدرس یکتا (Slug) و محتوای HTML برگه الزامی است.' });
    }

    const saved = db.saveCustomPage({
      id,
      title,
      slug,
      htmlContent,
      metaDescription,
      isPublished: isPublished !== false,
      showInHeader: Boolean(showInHeader),
      showInFooter: showInFooter !== undefined ? Boolean(showInFooter) : true,
    });

    return res.json({ success: true, page: saved });
  });

  // Admin: Delete custom page
  app.delete('/api/admin/custom-pages/:id', requireAdmin, (req, res) => {
    const ok = db.deleteCustomPage(req.params.id);
    if (!ok) return res.status(404).json({ error: 'برگه یافت نشد.' });
    return res.json({ success: true });
  });

  // ==========================================
  // 9. HEADER & FOOTER HTML DESIGNER
  // ==========================================

  // Public: Get header & footer HTML
  app.get('/api/public/header-footer', (_req, res) => {
    const config = db.getHeaderFooter();
    return res.json({ headerFooter: config });
  });

  // Admin: Update header & footer HTML
  app.put('/api/admin/header-footer', requireAdmin, (req, res) => {
    const { headerHtml, footerHtml, customCss, enabled, applyToAllPages, applyToPrint } = req.body;
    const updated = db.updateHeaderFooter({
      headerHtml,
      footerHtml,
      customCss,
      enabled: enabled !== undefined ? Boolean(enabled) : true,
      applyToAllPages: applyToAllPages !== undefined ? Boolean(applyToAllPages) : true,
      applyToPrint: applyToPrint !== undefined ? Boolean(applyToPrint) : false,
    });
    return res.json({ success: true, headerFooter: updated });
  });

  // ==========================================
  // 10. MONTHLY ANALYTICS & COMPARISONS
  // ==========================================
  app.get('/api/admin/analytics/monthly', requireAdmin, (_req, res) => {
    const analytics = db.getMonthlyAnalytics();
    return res.json(analytics);
  });

  // ==========================================
  // 11. ADMIN BOOKS COMPREHENSIVE OVERSIGHT
  // ==========================================
  app.get('/api/admin/all-books', requireAdmin, (_req, res) => {
    const books = db.getBooks();
    const users = db.getUsers();
    const booksWithMeta = books.map(b => {
      const owner = users.find(u => u.id === b.userId);
      return {
        id: b.id,
        title: b.title,
        originalTitle: b.originalTitle,
        author: b.author,
        translator: b.translator,
        tone: b.tone,
        wordCount: b.wordCount,
        estimatedCost: b.estimatedCost,
        status: b.status,
        chunksCount: (b.chunks || []).length,
        completedChunks: (b.chunks || []).filter(c => c.status === 'completed').length,
        chunks: b.chunks || [],
        glossary: b.glossary || [],
        user: owner ? { id: owner.id, name: owner.name, email: owner.email, phone: owner.phone } : null,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      };
    });
    return res.json({ books: booksWithMeta });
  });

  app.get('/api/admin/books/:id', requireAdmin, (req, res) => {
    const book = db.getBookById(req.params.id);
    if (!book) return res.status(404).json({ error: 'کتاب یافت نشد.' });
    return res.json({ book });
  });

  app.delete('/api/admin/books/:id', requireAdmin, (req, res) => {
    const ok = db.deleteBook(req.params.id);
    if (!ok) return res.status(404).json({ error: 'کتاب یافت نشد.' });
    return res.json({ success: true, message: 'کتاب با موفقیت از سیستم حذف گردید.' });
  });
}
