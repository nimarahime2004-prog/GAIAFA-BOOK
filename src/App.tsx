/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { LandingPage } from './components/LandingPage.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { UserDashboard } from './components/UserDashboard.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { WalletModal } from './components/WalletModal.tsx';
import { Navbar } from './components/Navbar.tsx';
import { ProjectHeader } from './components/ProjectHeader.tsx';
import { ChunkListSidebar } from './components/ChunkListSidebar.tsx';
import { TranslationWorkspace } from './components/TranslationWorkspace.tsx';
import { GlossaryModal } from './components/GlossaryModal.tsx';
import { ServerStatusModal } from './components/ServerStatusModal.tsx';
import { NewBookModal } from './components/NewBookModal.tsx';
import { TokenEstimatorModal } from './components/TokenEstimatorModal.tsx';
import { ProviderManagerModal } from './components/ProviderManagerModal.tsx';
import { BooksLibraryModal } from './components/BooksLibraryModal.tsx';
import { ExportDesignModal } from './components/ExportDesignModal.tsx';
import { PrintDocument } from './components/PrintDocument.tsx';
import { CustomPageView } from './components/CustomPageView.tsx';
import {
  BookProject,
  BookChunk,
  ServerStatusResponse,
  GlossaryItem,
  AIProviderConfig,
  APIServerEndpoint,
  User,
  TranslationJob,
  SystemSettings,
  HeaderFooterConfig,
  CustomPage
} from './types.ts';
import { SAMPLE_BOOKS, SampleBook } from './utils/sampleBooks.ts';
import { chunkBookText } from './utils/chunker.ts';
import { DEFAULT_GLOSSARIES } from './constants/tones.ts';
import { DEFAULT_PROVIDERS } from './constants/providers.ts';
import { downloadDocx, downloadStyledHtml, downloadPlainText } from './utils/exporter.ts';
import { resolveApiUrl } from './utils/aiClient.ts';

const STORAGE_KEY_AUTH_TOKEN = 'auth_token';
const STORAGE_KEY_ACTIVE_BOOK = 'persian_book_translator_active_id_v4';

export default function App() {
  // Authentication & View State
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_AUTH_TOKEN);
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'otp'>('login');

  // Navigation View: 'dashboard' (User Panel), 'workspace' (Reader/Editor), 'admin' (Admin Panel)
  const [currentView, setCurrentView] = useState<'dashboard' | 'workspace' | 'admin'>('dashboard');

  // SaaS Settings & Public CMS
  const [cmsConfig, setCmsConfig] = useState<any>(null);
  const [seoConfig, setSeoConfig] = useState<SystemSettings['seo'] | undefined>(undefined);
  const [costPerWord, setCostPerWord] = useState<number>(45);
  const [headerFooter, setHeaderFooter] = useState<HeaderFooterConfig | undefined>(undefined);
  const [customPagesList, setCustomPagesList] = useState<Array<{ id: string; title: string; slug: string; metaDescription?: string; showInHeader?: boolean; showInFooter?: boolean }>>([]);
  const [activeCustomPageSlug, setActiveCustomPageSlug] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/page/')) {
      return window.location.pathname.replace('/page/', '');
    }
    return null;
  });

  // User Books & Jobs
  const [books, setBooks] = useState<BookProject[]>([]);
  const [activeBookId, setActiveBookId] = useState<string>('');
  const [activeJobs, setActiveJobs] = useState<TranslationJob[]>([]);

  // Modals
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isNewBookModalOpen, setIsNewBookModalOpen] = useState(false);
  const [isGlossaryModalOpen, setIsGlossaryModalOpen] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isProvidersModalOpen, setIsProvidersModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);

  // Active translation chunk in workspace
  const [activeChunkId, setActiveChunkId] = useState<string>('');
  const [isBatchTranslating, setIsBatchTranslating] = useState(false);
  const [isStoppingBatch, setIsStoppingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, secondsToNextCall: 0 });
  const isBatchCancelledRef = useRef(false);

  // Mobile Workspace active tab: 'editor' (translation views) vs 'chunks' (list of chapters/chunks)
  const [mobileWorkspaceTab, setMobileWorkspaceTab] = useState<'editor' | 'chunks'>('editor');

  // Active project helper with guaranteed arrays
  const rawProject = books.find((b) => b.id === activeBookId) || books[0];
  const project: BookProject = rawProject
    ? {
        ...rawProject,
        chunks: Array.isArray(rawProject.chunks) ? rawProject.chunks : [],
        glossary: Array.isArray(rawProject.glossary) ? rawProject.glossary : [],
      }
    : {
        id: 'placeholder_book',
        title: 'کتاب جدید',
        originalTitle: 'New Book',
        author: 'نامشخص',
        translator: 'سامانه ترجمه',
        tone: 'spiritual',
        model: 'gemini-3.8-flash',
        glossary: [],
        chunks: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

  // Connected API Servers Pool
  const [serverPool, setServerPool] = useState<APIServerEndpoint[]>([
    {
      id: 'srv_gemini_primary',
      name: 'سرور ۱: Gemini 3.8 Flash (اصلی)',
      providerType: 'gemini',
      baseURL: '',
      apiKey: '',
      model: 'gemini-3.8-flash',
      isEnabled: true,
      priority: 1,
      status: 'active',
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
    },
    {
      id: 'srv_gemini_lite',
      name: 'سرور ۲: Gemini 3.1 Flash-Lite (پشتیبان)',
      providerType: 'gemini',
      baseURL: '',
      apiKey: '',
      model: 'gemini-3.1-flash-lite',
      isEnabled: true,
      priority: 2,
      status: 'active',
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
    },
  ]);

  const [providers, setProviders] = useState<AIProviderConfig[]>(DEFAULT_PROVIDERS);
  const [activeProviderId, setActiveProviderId] = useState<string>('prov_gemini');
  const [serverStatus, setServerStatus] = useState<ServerStatusResponse | null>(null);

  // 1. Initial Load: Public Config & Validate Auth Token
  useEffect(() => {
    // Fetch public CMS, pricing, header/footer, and custom pages
    fetch('/api/public/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.cms) setCmsConfig(data.cms);
        if (data.seo) {
          setSeoConfig(data.seo);
          if (data.seo.siteTitle) document.title = data.seo.siteTitle;
          if (data.seo.metaDescription) {
            const m = document.querySelector('meta[name="description"]');
            if (m) m.setAttribute('content', data.seo.metaDescription);
          }
        }
        if (data.pricing?.costPerWord) setCostPerWord(data.pricing.costPerWord);
        if (data.headerFooter) setHeaderFooter(data.headerFooter);
        if (data.customPages) setCustomPagesList(data.customPages);
      })
      .catch((err) => console.warn('Could not load public config', err));

    // Check auth session
    const storedToken = localStorage.getItem(STORAGE_KEY_AUTH_TOKEN);
    if (storedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Session invalid');
        })
        .then((data) => {
          setCurrentUser(data.user);
          setAuthToken(storedToken);
          fetchUserBooks(storedToken);
          fetchActiveJobs(storedToken);
        })
        .catch(() => {
          localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
          setAuthToken(null);
          setCurrentUser(null);
        })
        .finally(() => setIsAuthLoading(false));
    } else {
      setIsAuthLoading(false);
    }
  }, []);

  // Listen for browser forward/back buttons on custom page paths
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/page/')) {
        setActiveCustomPageSlug(window.location.pathname.replace('/page/', ''));
      } else {
        setActiveCustomPageSlug(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleOpenCustomPage = (slug: string) => {
    setActiveCustomPageSlug(slug);
    window.history.pushState({}, '', `/page/${slug}`);
  };

  const handleBackFromCustomPage = () => {
    setActiveCustomPageSlug(null);
    window.history.pushState({}, '', '/');
  };

  // 2. Periodic Polling for Active Background Jobs on the Server
  useEffect(() => {
    if (!authToken || !currentUser) return;

    const interval = setInterval(() => {
      fetchActiveJobs(authToken);
      fetchUserBooks(authToken, true); // silent sync
    }, 4000);

    return () => clearInterval(interval);
  }, [authToken, currentUser]);

  // Fetch user's books from server DB
  const fetchUserBooks = async (token: string, isSilent = false) => {
    try {
      const res = await fetch('/api/books', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const serverBooks = (data.books || []).map((b: any) => ({
          ...b,
          chunks: Array.isArray(b.chunks) ? b.chunks : [],
          glossary: Array.isArray(b.glossary) ? b.glossary : [],
        }));
        setBooks(serverBooks);

        if (!activeBookId && serverBooks.length > 0) {
          const savedActive = localStorage.getItem(STORAGE_KEY_ACTIVE_BOOK);
          const found = serverBooks.find((b: any) => b.id === savedActive) || serverBooks[0];
          setActiveBookId(found.id);
          if (found.chunks?.length > 0) {
            setActiveChunkId(found.chunks[0].id);
          }
        }
      }
    } catch (e) {
      if (!isSilent) console.warn('Error fetching books from server', e);
    }
  };

  // Fetch active background jobs
  const fetchActiveJobs = async (token: string) => {
    try {
      const res = await fetch('/api/jobs/my-active', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveJobs(data.jobs || []);
      }
    } catch (e) {}
  };

  // Handle Successful Login / Register / Demo
  const handleAuthSuccess = (user: User, token: string) => {
    localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, token);
    setAuthToken(token);
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    setCurrentView('dashboard');
    fetchUserBooks(token);
    fetchActiveJobs(token);
  };

  // Handle Logout
  const handleLogout = async () => {
    if (authToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch (e) {}
    }
    localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
    setAuthToken(null);
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  // Create Book & Optionally Launch Background Cloud Translation
  const handleCreateBook = async (newBook: BookProject, startCloudTranslation = true) => {
    if (!authToken || !currentUser) return;

    try {
      const res = await fetch('/api/books/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: newBook.title,
          originalTitle: newBook.originalTitle,
          author: newBook.author,
          translator: newBook.translator,
          tone: newBook.tone,
          chunks: newBook.chunks,
          glossary: newBook.glossary,
          startTranslation: startCloudTranslation,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'خطا در ثبت کتاب');
        return;
      }

      if (data.updatedWalletBalance !== undefined) {
        setCurrentUser({ ...currentUser, walletBalance: data.updatedWalletBalance });
      }

      // Add to books list
      setBooks((prev) => [data.book, ...prev]);
      setActiveBookId(data.book.id);
      if (data.book.chunks?.length > 0) {
        setActiveChunkId(data.book.chunks[0].id);
      }

      // Close modal and navigate immediately into workspace so user can review and edit pages first
      setIsNewBookModalOpen(false);
      setCurrentView('workspace');

      // Refresh active jobs
      fetchActiveJobs(authToken);

      if (startCloudTranslation) {
        alert('🎉 کتاب با موفقیت ایجاد شد و ترجمه ابری در سرور آغاز گردید!');
      }
    } catch (err: any) {
      alert(`خطا در ارتباط با سرور: ${err.message}`);
    }
  };

  // Delete Book
  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('آیا از حذف این کتاب و ترجمه‌های آن اطمینان دارید؟')) return;
    if (!authToken) return;

    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        setBooks((prev) => prev.filter((b) => b.id !== bookId));
        if (activeBookId === bookId) {
          const remaining = books.filter((b) => b.id !== bookId);
          if (remaining.length > 0) {
            setActiveBookId(remaining[0].id);
          }
        }
      }
    } catch (e) {}
  };

  // Start Translation for Draft Book with Wallet Deduction
  const handleStartDraftTranslation = async (book: BookProject) => {
    if (!authToken) return;
    try {
      const res = await fetch(`/api/books/${book.id}/start-translation`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          if (confirm(`${data.error}\nآیا مایل به افزایش موجودی کیف پول هستید؟`)) {
            setIsWalletModalOpen(true);
          }
          return;
        }
        alert(data.error || 'خطا در شروع ترجمه');
        return;
      }
      alert('ترجمه ابری کتاب آغاز شد. هزینه از کیف پول کسر گردید.');
      if (data.updatedWalletBalance !== undefined && currentUser) {
        setCurrentUser({ ...currentUser, walletBalance: data.updatedWalletBalance });
      }
      fetchUserBooks(authToken);
      fetchActiveJobs(authToken);
    } catch (e) {}
  };

  // Stop active translation and refund remaining un-translated words
  const handleStopCloudTranslation = async (bookId: string) => {
    if (!authToken) return;
    if (!confirm('آیا مایل به توقف ترجمه هستید؟ هزینه کلمات باقی‌مانده و ترجمه‌نشده بلافاصله به کیف پول شما بازگردانده می‌شود.')) return;
    try {
      const res = await fetch(`/api/books/${bookId}/stop-translation`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'خطا در توقف ترجمه');
        return;
      }

      alert(data.message || 'ترجمه متوقف و هزینه باقی‌مانده به کیف پول واریز شد.');

      if (data.updatedWalletBalance !== undefined && currentUser) {
        setCurrentUser({ ...currentUser, walletBalance: data.updatedWalletBalance });
      }

      fetchUserBooks(authToken);
      fetchActiveJobs(authToken);
    } catch (err: any) {
      alert(`خطا در ارتباط با سرور: ${err.message}`);
    }
  };

  // Online Delete Chunk / Page
  const handleDeleteChunk = async (chunkId: string) => {
    if (!authToken || !activeBookId) return;
    try {
      const res = await fetch(`/api/books/${activeBookId}/chunks/${chunkId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'خطا در حذف صفحه');
        return;
      }

      setBooks((prev) => prev.map((b) => (b.id === activeBookId ? data.book : b)));
      if (activeChunkId === chunkId && data.book.chunks?.length > 0) {
        setActiveChunkId(data.book.chunks[0].id);
      }
    } catch (err: any) {
      alert(`خطا در حذف صفحه: ${err.message}`);
    }
  };

  // Save changes to active project
  const handleUpdateProject = async (updatedProject: BookProject) => {
    setBooks((prev) => prev.map((b) => (b.id === updatedProject.id ? updatedProject : b)));

    if (authToken) {
      try {
        await fetch(`/api/books/${updatedProject.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(updatedProject),
        });
      } catch (e) {}
    }
  };

  // Exports
  const handleExportDocx = async (targetBook: BookProject) => {
    await downloadDocx(targetBook);
  };

  const handleExportPdf = (targetBook: BookProject) => {
    setActiveBookId(targetBook.id);
    setIsDesignModalOpen(true);
  };

  const handleExportEpub = (targetBook: BookProject) => {
    downloadStyledHtml(targetBook);
  };

  // Translate a single chunk (inside workspace)
  const translateSingleChunk = async (chunkId: string) => {
    const chunk = project.chunks.find((c) => c.id === chunkId);
    if (!chunk) return;

    // Check user wallet balance if applicable
    const chunkWords = chunk.wordCount || 100;
    const requiredCost = Math.round(chunkWords * costPerWord);
    if (currentUser && currentUser.role !== 'admin' && (currentUser.walletBalance || 0) < requiredCost) {
      alert(`موجودی کیف پول شما (${(currentUser.walletBalance || 0).toLocaleString('fa-IR')} تومان) برای ترجمه این بخش (${requiredCost.toLocaleString('fa-IR')} تومان) کافی نیست. لطفاً کیف پول خود را شارژ فرمایید.`);
      setIsWalletModalOpen(true);
      return;
    }

    // Update chunk status to queued
    const updatedChunks = project.chunks.map((c) =>
      c.id === chunkId ? { ...c, status: 'queued' as const, errorMessage: undefined } : c
    );
    handleUpdateProject({ ...project, chunks: updatedChunks });

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chunkId,
          englishText: chunk.englishText,
          tone: project.tone,
          glossary: project.glossary,
          chapterTitle: chunk.chapterTitle,
          model: project.model || 'gemini-3.8-flash',
          serverPool,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطای ترجمه');

      const completed = project.chunks.map((c) =>
        c.id === chunkId
          ? {
              ...c,
              status: 'completed' as const,
              translatedHtml: data.translatedHtml,
              keyUsed: data.keyUsed,
              modelUsed: data.model,
              serverUsed: data.serverUsed,
              switchOccurred: data.switchOccurred,
              translatedAt: Date.now(),
            }
          : c
      );
      handleUpdateProject({ ...project, chunks: completed });

      // Automatically advance to the next chunk/page so user doesn't have to manually click next
      const currentIdx = project.chunks.findIndex((c) => c.id === chunkId);
      if (currentIdx !== -1 && currentIdx < project.chunks.length - 1) {
        const nextChunk = project.chunks[currentIdx + 1];
        setActiveChunkId(nextChunk.id);
      }
    } catch (err: any) {
      const failed = project.chunks.map((c) =>
        c.id === chunkId ? { ...c, status: 'error' as const, errorMessage: err.message } : c
      );
      handleUpdateProject({ ...project, chunks: failed });
    }
  };

  // Batch translate inside workspace with graceful per-chunk stop and wallet check
  const handleBatchTranslate = async () => {
    const pending = project.chunks.filter((c) => c.status !== 'completed');
    if (pending.length === 0) {
      alert('تمام بخش‌های این کتاب قبلاً ترجمه شده‌اند.');
      return;
    }

    setIsBatchTranslating(true);
    setIsStoppingBatch(false);
    isBatchCancelledRef.current = false;
    setBatchProgress({ current: 0, total: pending.length, secondsToNextCall: 0 });

    for (let i = 0; i < pending.length; i++) {
      if (isBatchCancelledRef.current) break;
      const c = pending[i];

      // Check wallet before translating this chunk
      const requiredCost = Math.round((c.wordCount || 100) * costPerWord);
      if (currentUser && currentUser.role !== 'admin' && (currentUser.walletBalance || 0) < requiredCost) {
        alert(`موجودی کیف پول شما برای ادامه ترجمه متوالی ناکافی است (${(currentUser.walletBalance || 0).toLocaleString('fa-IR')} تومان). برای ترجمه بخش «${c.chapterTitle}» به ${requiredCost.toLocaleString('fa-IR')} تومان موجودی نیاز است. لطفاً کیف پول خود را شارژ فرمایید.`);
        setIsWalletModalOpen(true);
        break;
      }

      setActiveChunkId(c.id);
      setBatchProgress({ current: i + 1, total: pending.length, secondsToNextCall: 0 });
      
      // Translate current chunk completely
      await translateSingleChunk(c.id);

      // If user clicked stop during this chunk, stop IMMEDIATELY without extra delay
      if (isBatchCancelledRef.current) {
        break;
      }

      // Safe pause between calls only when translation is continuing
      await new Promise((r) => setTimeout(r, 1800));
    }

    setIsStoppingBatch(false);
    setIsBatchTranslating(false);
  };

  const handleStopBatchTranslate = () => {
    isBatchCancelledRef.current = true;
    setIsStoppingBatch(true);
  };

  const handleLoadSampleBook = (sample: SampleBook) => {
    const chunks = chunkBookText(sample.excerpt, { maxWordsPerChunk: 700 });
    const newProject: BookProject = {
      id: `sample_${Date.now()}`,
      title: sample.title,
      originalTitle: sample.originalTitle,
      author: sample.author,
      translator: currentUser?.name || 'سامانه ترجمه',
      tone: sample.tone,
      model: 'gemini-3.8-flash',
      glossary: [...(DEFAULT_GLOSSARIES[sample.tone] || DEFAULT_GLOSSARIES.spiritual)],
      chunks,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    handleCreateBook(newProject, false);
  };

  // ========================================================
  // CUSTOM PAGE VIEW (e.g. /page/about-us or /page/guide)
  // Accessible to both guests and logged-in users
  // ========================================================
  if (activeCustomPageSlug) {
    return (
      <>
        <CustomPageView
          slug={activeCustomPageSlug}
          headerFooter={headerFooter}
          currentUser={currentUser}
          onBack={handleBackFromCustomPage}
          onOpenAuth={(tab) => {
            setAuthModalTab(tab);
            setIsAuthModalOpen(true);
          }}
          onNavigatePage={(slug) => {
            setActiveCustomPageSlug(slug);
            window.history.pushState({}, '', `/page/${slug}`);
          }}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          initialTab={authModalTab}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  // ========================================================
  // STRICT LOGIN BARRIER: If user is not authenticated
  // ========================================================
  if (!currentUser) {
    return (
      <>
        <LandingPage
          onOpenAuth={(tab) => {
            setAuthModalTab(tab || 'login');
            setIsAuthModalOpen(true);
          }}
          cmsConfig={cmsConfig}
          seoConfig={seoConfig}
          costPerWord={costPerWord}
          headerFooter={headerFooter}
          customPages={customPagesList}
          onOpenCustomPage={handleOpenCustomPage}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          initialTab={authModalTab}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  // ========================================================
  // VIEW: ADMIN PANEL
  // ========================================================
  if (currentView === 'admin' && currentUser.role === 'admin') {
    return (
      <AdminPanel
        currentUser={currentUser}
        onBackToUserPanel={() => setCurrentView('dashboard')}
        onLogout={handleLogout}
      />
    );
  }

  // ========================================================
  // VIEW: USER DASHBOARD (میز کاربری)
  // ========================================================
  if (currentView === 'dashboard') {
    return (
      <>
        <UserDashboard
          user={currentUser}
          books={books}
          activeJobs={activeJobs}
          onOpenNewBook={() => setIsNewBookModalOpen(true)}
          onSelectBook={(selected) => {
            setActiveBookId(selected.id);
            if (selected.chunks?.length > 0) {
              setActiveChunkId(selected.chunks[0].id);
            }
            setCurrentView('workspace');
          }}
          onOpenWallet={() => setIsWalletModalOpen(true)}
          onOpenAdmin={currentUser.role === 'admin' ? () => setCurrentView('admin') : undefined}
          onLogout={handleLogout}
          onDeleteBook={handleDeleteBook}
          onStartTranslation={handleStartDraftTranslation}
          onExportDocx={handleExportDocx}
          onExportPdf={handleExportPdf}
          onExportEpub={handleExportEpub}
          onRefresh={() => {
            if (authToken) {
              fetchActiveJobs(authToken);
              fetchUserBooks(authToken);
            }
          }}
        />

        <WalletModal
          isOpen={isWalletModalOpen}
          user={currentUser}
          onClose={() => setIsWalletModalOpen(false)}
          onBalanceUpdated={(newBalance) => {
            setCurrentUser({ ...currentUser, walletBalance: newBalance });
          }}
        />

        <NewBookModal
          isOpen={isNewBookModalOpen}
          onClose={() => setIsNewBookModalOpen(false)}
          onCreateProject={handleCreateBook}
          defaultModel="gemini-3.8-flash"
          walletBalance={currentUser.walletBalance}
          costPerWord={costPerWord}
          onOpenWallet={() => setIsWalletModalOpen(true)}
        />

        <ExportDesignModal
          isOpen={isDesignModalOpen}
          onClose={() => setIsDesignModalOpen(false)}
          project={project}
          onUpdateDesign={(config) => handleUpdateProject({ ...project, designConfig: config })}
          onPrintPdf={() => window.print()}
        />
      </>
    );
  }

  // ========================================================
  // VIEW: WORKSPACE (ویرایشگر، مطالعه و صفحه‌بندی کتاب)
  // ========================================================
  const currentIndex = project.chunks.findIndex((c) => c.id === activeChunkId);
  const currentChunk = project.chunks[currentIndex] || project.chunks[0] || null;

  const isUserAdmin = currentUser?.role === 'admin';
  const isCloudTranslating = project.status === 'translating' || activeJobs.some(
    (j) => j.bookId === project.id && (j.status === 'queued' || j.status === 'processing')
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-['Vazirmatn'] selection:bg-amber-500/30">
      {/* Printable Document for high-res PDF generation */}
      <PrintDocument project={project} />

      {/* Main Studio Interactive UI */}
      <div className="no-print flex flex-col min-h-screen">
        <Navbar
          currentProject={project}
          serverStatus={serverStatus}
          onOpenServerModal={() => setIsServerModalOpen(true)}
          onOpenNewBookModal={() => setIsNewBookModalOpen(true)}
          onOpenGlossaryModal={() => setIsGlossaryModalOpen(true)}
          onLoadSampleBook={handleLoadSampleBook}
          onPrintPdf={() => window.print()}
          onOpenLibraryModal={() => setIsLibraryModalOpen(true)}
          booksCount={books.length}
          onOpenProvidersModal={() => setIsProvidersModalOpen(true)}
          activeProviderName={serverPool.find((s) => s.isEnabled)?.name.split(' (')[0] || 'جمینای'}
          onOpenDesignModal={() => setIsDesignModalOpen(true)}
          onBackToDashboard={() => setCurrentView('dashboard')}
          isAdmin={isUserAdmin}
        />

        <ProjectHeader
          project={project}
          onUpdateProject={(updates) => handleUpdateProject({ ...project, ...updates })}
          onOpenGlossaryModal={() => setIsGlossaryModalOpen(true)}
          onOpenTokenModal={() => setIsTokenModalOpen(true)}
          onOpenExportModal={() => setIsDesignModalOpen(true)}
        />

        {/* Mobile Tab Switcher Bar for Book Editor */}
        <div className="md:hidden no-print bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center justify-center gap-2 sticky top-16 z-30">
          <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700 w-full max-w-sm text-xs font-semibold shadow-inner">
            <button
              onClick={() => setMobileWorkspaceTab('editor')}
              className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                mobileWorkspaceTab === 'editor'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📖 متن و ترجمه کتاب</span>
            </button>
            <button
              onClick={() => setMobileWorkspaceTab('chunks')}
              className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                mobileWorkspaceTab === 'chunks'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📑 فهرست بخش‌ها ({project.chunks.length})</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          <div className={`${mobileWorkspaceTab === 'chunks' ? 'flex flex-1' : 'hidden'} md:flex md:flex-initial h-full`}>
            <ChunkListSidebar
              chunks={project.chunks}
              activeChunkId={activeChunkId}
              onSelectChunk={(id) => {
                setActiveChunkId(id);
                setMobileWorkspaceTab('editor');
              }}
              onTranslateChunk={translateSingleChunk}
              isBatchTranslating={isBatchTranslating}
              onDeleteChunk={handleDeleteChunk}
            />
          </div>

          <div className={`${mobileWorkspaceTab === 'editor' ? 'flex flex-1' : 'hidden'} md:flex md:flex-1 h-full min-w-0`}>
            <TranslationWorkspace
              currentChunk={currentChunk}
              project={project}
              onUpdateChunkHtml={(chunkId: string, newHtml: string) => {
                const updated = project.chunks.map((c) =>
                  c.id === chunkId ? { ...c, translatedHtml: newHtml } : c
                );
                handleUpdateProject({ ...project, chunks: updated });
              }}
              onDeleteChunk={handleDeleteChunk}
              onTranslateCurrentChunk={() => currentChunk && translateSingleChunk(currentChunk.id)}
              onStartBatchTranslate={handleBatchTranslate}
              onStopBatchTranslate={handleStopBatchTranslate}
              isBatchTranslating={isBatchTranslating}
              isStoppingBatch={isStoppingBatch}
              batchProgress={batchProgress}
              onStartCloudTranslation={() => handleStartDraftTranslation(project)}
              onStopCloudTranslation={() => handleStopCloudTranslation(project.id)}
              isCloudTranslating={isCloudTranslating}
              onSelectPrevChunk={() => {
                if (currentIndex > 0) setActiveChunkId(project.chunks[currentIndex - 1].id);
              }}
              onSelectNextChunk={() => {
                if (currentIndex < project.chunks.length - 1)
                  setActiveChunkId(project.chunks[currentIndex + 1].id);
              }}
              hasPrevChunk={currentIndex > 0}
              hasNextChunk={currentIndex < project.chunks.length - 1}
              serverPool={serverPool}
              onOpenServerPoolModal={() => setIsProvidersModalOpen(true)}
              isAdmin={isUserAdmin}
              onOpenMobileChunks={() => setMobileWorkspaceTab('chunks')}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <WalletModal
        isOpen={isWalletModalOpen}
        user={currentUser}
        onClose={() => setIsWalletModalOpen(false)}
        onBalanceUpdated={(newBalance) => {
          setCurrentUser({ ...currentUser, walletBalance: newBalance });
        }}
      />

      <NewBookModal
        isOpen={isNewBookModalOpen}
        onClose={() => setIsNewBookModalOpen(false)}
        onCreateProject={handleCreateBook}
        defaultModel="gemini-3.8-flash"
        walletBalance={currentUser.walletBalance}
        costPerWord={costPerWord}
        onOpenWallet={() => setIsWalletModalOpen(true)}
      />

      <GlossaryModal
        isOpen={isGlossaryModalOpen}
        onClose={() => setIsGlossaryModalOpen(false)}
        project={project}
        onUpdateGlossary={(newGlossary) => {
          handleUpdateProject({ ...project, glossary: newGlossary });
        }}
        isAdmin={isUserAdmin}
      />

      <ExportDesignModal
        isOpen={isDesignModalOpen}
        onClose={() => setIsDesignModalOpen(false)}
        project={project}
        onUpdateDesign={(config) => handleUpdateProject({ ...project, designConfig: config })}
        onPrintPdf={() => window.print()}
      />

      <TokenEstimatorModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        project={project}
      />

      <ServerStatusModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        status={serverStatus}
        onRefresh={() => {}}
        selectedModel={project.model || 'gemini-3.8-flash'}
        onSelectModel={(m) => handleUpdateProject({ ...project, model: m })}
      />

      <ProviderManagerModal
        isOpen={isProvidersModalOpen}
        onClose={() => setIsProvidersModalOpen(false)}
        serverPool={serverPool}
        onUpdateServerPool={setServerPool}
      />

      <BooksLibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        books={books}
        activeBookId={activeBookId}
        onSelectBook={(id) => {
          setActiveBookId(id);
          const found = books.find((b) => b.id === id);
          if (found && found.chunks?.length > 0) {
            setActiveChunkId(found.chunks[0].id);
          }
        }}
        onDeleteBook={handleDeleteBook}
        onOpenNewBookModal={() => setIsNewBookModalOpen(true)}
      />
    </div>
  );
}
