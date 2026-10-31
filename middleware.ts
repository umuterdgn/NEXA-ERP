import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

const locales = ['tr', 'en', 'de', 'ru', 'ar'];
const publicPages = ['/login', '/register']; // Giriş gerektirmeyen sayfalar

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
  const publicPathnameRegex = RegExp(
    `^(/(${locales.join('|')}))?(${publicPages.join('|')})?/?$`,
    'i'
  );
  const isPublicPage = publicPathnameRegex.test(req.nextUrl.pathname);

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
