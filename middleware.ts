import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { getDefaultWebRoute, normalizeTenantType } from '@/lib/rbac/permissions';

const locales = ['tr', 'en', 'de', 'ru', 'ar'];

// Giriş gerektirmeyen herkese açık kurumsal tanıtım, pazarlama ve yasal sayfalar
const publicPages = [
  '',
  '/',
  '/login',
  '/register',
  '/hakkimizda',
  '/about',
  '/ozellikler',
  '/features',
  '/basari-hikayeleri',
  '/blog',
  '/sss',
  '/faq',
  '/iletisim',
  '/contact',
  '/hizmetlerimiz',
  '/projelerimiz',
  '/demo',
  '/track',
  '/check-in',
  '/unauthorized',
];

function isPublicRoute(pathname: string): boolean {
  // Strip locale prefix if present (e.g. /tr/hakkimizda -> /hakkimizda, /en -> /)
  const localePattern = new RegExp(`^/(${locales.join('|')})(/.*)?$`, 'i');
  const match = pathname.match(localePattern);
  const pathWithoutLocale = match ? (match[2] || '/') : pathname;

  const normalized = pathWithoutLocale.length > 1 && pathWithoutLocale.endsWith('/')
    ? pathWithoutLocale.slice(0, -1)
    : pathWithoutLocale;

  if (normalized === '/' || normalized === '') {
    return true;
  }

  return publicPages.some((page) => {
    if (!page || page === '/') return false;
    return normalized === page || normalized.startsWith(`${page}/`);
  });
}

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'tr',
  localePrefix: 'as-needed', // Sadece TR dışındakilerde prefix kullan
  localeDetection: false
});

// NextAuth v5 Edge runtime uyumlu auth middleware örneği
const { auth } = NextAuth(authConfig);

const withAuth = (
  onSuccess: (req: any) => any,
  options?: {
    callbacks?: {
      authorized?: (params: { token: any; req?: any }) => boolean;
    };
    pages?: {
      signIn?: string;
    };
  }
) => {
  return auth((req) => {
    const isAuthorized = options?.callbacks?.authorized
      ? options.callbacks.authorized({ token: req.auth, req })
      : req.auth != null;

    if (!isAuthorized) {
      const signInPath = options?.pages?.signIn || '/login';
      const signInUrl = req.nextUrl.clone();
      signInUrl.pathname = signInPath;
      return NextResponse.redirect(signInUrl);
    }

    const userRole = ((req.auth?.user as any)?.role as string)?.toUpperCase();
    const userTenantType = normalizeTenantType((req.auth?.user as any)?.tenantType);
    const pathname = req.nextUrl.pathname;
    const isIgnored =
      pathname.startsWith('/api') ||
      pathname.includes('/login') ||
      pathname.includes('/register') ||
      pathname.includes('/unauthorized') ||
      pathname.includes('/expired') ||
      isPublicRoute(pathname);

    // KESİN ROL VE PANEL İZOLASYONU (RBAC)
    if (userRole && !isIgnored && userRole !== "SUPER_ADMIN") {
      const localeMatch = pathname.match(new RegExp(`^/(${locales.join('|')})(/|$)`, 'i'));
      const localePrefix = localeMatch ? `/${localeMatch[1]}` : '';
      const pathWithoutLocale = pathname.replace(new RegExp(`^/(${locales.join('|')})(/|$)`, 'i'), '/');

      const redirectTo = (route: string) => {
        const cleanTarget = route.startsWith('/') ? route : `/${route}`;
        if (pathWithoutLocale === cleanTarget) return null;
        const targetUrl = req.nextUrl.clone();
        targetUrl.pathname = `${localePrefix}${cleanTarget}`;
        return NextResponse.redirect(targetUrl);
      };

      // 1. INVESTOR / CLIENT
      if ((userRole === "INVESTOR" || userRole === "CLIENT") && !pathWithoutLocale.startsWith('/investor')) {
        const res = redirectTo('/investor/dashboard');
        if (res) return res;
      }

      // 2. YAPI DENETİM (INSPECTION) — Müteahhit /admin, /franchise, /subcontractor, /personnel yasak
      const isInspectionRole = ["INSPECTION_ADMIN", "PROJECT_AUDITOR", "INSPECTOR", "LAB_TECH", "INSPECTION_OFFICE", "INSPECTION_FINANCE", "AUDITOR"].includes(userRole) || (userTenantType === "INSPECTION" && userRole === "ADMIN");
      if (isInspectionRole) {
        const fallback = getDefaultWebRoute(userRole, "INSPECTION");
        if (
          pathWithoutLocale.startsWith('/admin') ||
          pathWithoutLocale.startsWith('/franchise') ||
          pathWithoutLocale.startsWith('/subcontractor') ||
          pathWithoutLocale.startsWith('/personnel')
        ) {
          const res = redirectTo(fallback);
          if (res) return res;
        }
        // Saha denetçileri & Lab teknisyenleri için finans/personel/ayarlar/sözleşme yasak
        if (
          ["INSPECTOR", "LAB_TECH", "AUDITOR", "PROJECT_AUDITOR"].includes(userRole) &&
          (pathWithoutLocale.startsWith('/inspection/finance') ||
            pathWithoutLocale.startsWith('/inspection/personnel') ||
            pathWithoutLocale.startsWith('/inspection/personel') ||
            pathWithoutLocale.startsWith('/inspection/settings') ||
            pathWithoutLocale.startsWith('/inspection/contracts'))
        ) {
          const res = redirectTo(fallback);
          if (res) return res;
        }
        // Çift rota (/inspection/personel -> /inspection/personnel) için kanonik Edge yönlendirmesi
        if (pathWithoutLocale === '/inspection/personel' || pathWithoutLocale.startsWith('/inspection/personel/')) {
          const canonicalPath = pathWithoutLocale.replace('/inspection/personel', '/inspection/personnel');
          const res = redirectTo(canonicalPath);
          if (res) return res;
        }
      }

      // 3. FRANCHISE — /admin, /inspection, /subcontractor yasak; FRANCHISEE yalnızca kendi şube ekranlarına girebilir
      const isFranchiseRole = ["FRANCHISE_ADMIN", "REGIONAL_MANAGER", "FRANCHISEE", "FITOUT_SUPERVISOR", "FITOUT_TECH", "BRANCH_MANAGER"].includes(userRole) || (userTenantType === "FRANCHISE" && userRole === "ADMIN");
      if (isFranchiseRole) {
        const fallback = getDefaultWebRoute(userRole, "FRANCHISE");
        const canVisitPersonnel = ["FITOUT_SUPERVISOR", "FITOUT_TECH"].includes(userRole);
        if (
          pathWithoutLocale.startsWith('/admin') ||
          pathWithoutLocale.startsWith('/inspection') ||
          pathWithoutLocale.startsWith('/subcontractor') ||
          (!canVisitPersonnel && pathWithoutLocale.startsWith('/personnel'))
        ) {
          const res = redirectTo(fallback);
          if (res) return res;
        }
        if (userRole === "FRANCHISEE" || userRole === "BRANCH_MANAGER") {
          const allowedBranchPrefixes = [
            '/franchise/branch',
            '/franchise/bim',
            '/franchise/rollout/punch-list',
            '/franchise/tasks',
            '/franchise/stores/helpdesk',
            '/franchise/documents',
          ];
          const isAllowed = allowedBranchPrefixes.some(
            (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`)
          );
          if (!isAllowed) {
            const res = redirectTo('/franchise/branch');
            if (res) return res;
          }
        }
      }

      // 4. TAŞERON — Müteahhit /admin, /inspection, /franchise, /personnel yasak
      if (userRole === "SUBCONTRACTOR") {
        if (
          pathWithoutLocale.startsWith('/admin') ||
          pathWithoutLocale.startsWith('/inspection') ||
          pathWithoutLocale.startsWith('/franchise') ||
          pathWithoutLocale.startsWith('/personnel')
        ) {
          const res = redirectTo('/subcontractor');
          if (res) return res;
        }
      }

      // 5. SAHA ÇALIŞANI / ŞOFÖR / GÜVENLİK / AMBAR — /admin, /inspection, /franchise, /subcontractor yasak
      const isFieldPersonnel = ["WORKER", "DRIVER", "SECURITY", "WAREHOUSE_MANAGER", "STAFF", "EQUIPMENT_MANAGER"].includes(userRole);
      if (isFieldPersonnel) {
        if (
          pathWithoutLocale.startsWith('/admin') ||
          pathWithoutLocale.startsWith('/inspection') ||
          pathWithoutLocale.startsWith('/franchise') ||
          pathWithoutLocale.startsWith('/subcontractor')
        ) {
          const res = redirectTo('/personnel');
          if (res) return res;
        }
      }

      // 6. MÜTEAHHİT (CONTRACTOR) yönetim/mühendislik rolleri — /inspection ve /franchise yasak
      if (!isInspectionRole && !isFranchiseRole && userTenantType === "CONTRACTOR") {
        if (pathWithoutLocale.startsWith('/inspection') || pathWithoutLocale.startsWith('/franchise')) {
          const res = redirectTo(getDefaultWebRoute(userRole, "CONTRACTOR"));
          if (res) return res;
        }
      }
    }

    return onSuccess(req);
  });
};

const authMiddleware = withAuth(
  function onSuccess(req) {
    return intlMiddleware(req);
  },
  {
    callbacks: {
      authorized: ({ token }) => token != null
    },
    pages: {
      signIn: '/login'
    }
  }
);

export default function middleware(req: NextRequest) {
  const isPublicPage = isPublicRoute(req.nextUrl.pathname);

  if (isPublicPage) {
    return intlMiddleware(req);
  } else {
    return (authMiddleware as any)(req);
  }
}

export const config = {
  // Skip all paths that should not be internationalized
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
