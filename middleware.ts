import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

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
  localePrefix: 'as-needed' // Sadece TR dışındakilerde prefix kullan veya 'always' yap
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

    // ADIM 1: INVESTOR / CLIENT Rolü Yönlendirmesi
    const userRole = ((req.auth?.user as any)?.role as string)?.toUpperCase();
    if (userRole === "INVESTOR" || userRole === "CLIENT") {
      const pathname = req.nextUrl.pathname;
      const isInvestorPath = pathname.includes('/investor');
      const isIgnored =
        pathname.startsWith('/api') ||
        pathname.includes('/login') ||
        pathname.includes('/register') ||
        pathname.includes('/unauthorized') ||
        isPublicRoute(pathname);

      if (!isInvestorPath && !isIgnored) {
        const investorUrl = req.nextUrl.clone();
        const localeMatch = pathname.match(new RegExp(`^/(${locales.join('|')})(/|$)`, 'i'));
        const localePrefix = localeMatch ? `/${localeMatch[1]}` : '';
        investorUrl.pathname = `${localePrefix}/investor/dashboard`;
        return NextResponse.redirect(investorUrl);
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
