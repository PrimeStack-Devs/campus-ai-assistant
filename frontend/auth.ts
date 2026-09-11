import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

const googleClientId =
  process.env.AUTH_GOOGLE_ID ||
  process.env.GOOGLE_CLIENT_ID ||
  'missing-google-client-id';

const googleClientSecret =
  process.env.AUTH_GOOGLE_SECRET ||
  process.env.GOOGLE_CLIENT_SECRET ||
  'missing-google-client-secret';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      const cleanEmail = user.email.trim().toLowerCase();
      const emailDomain = cleanEmail.split('@')[1] || '';

      // Check university domain restriction against backend settings
      try {
        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const res = await fetch(`${backendUrl}/api/campus/auth-config`, {
          cache: 'no-store',
        });
        const data = await res.json();

        if (data.success && data.config) {
          if (data.config.googleAuthEnabled === false) {
            return '/auth/error?error=AuthDisabled';
          }

          if (data.config.domainRestrictionEnabled) {
            const allowed = (
              data.config.allowedDomains || ['paruluniversity.ac.in']
            ).map((d: string) => d.toLowerCase().trim());

            const isAllowed = allowed.includes(emailDomain);
            if (!isAllowed) {
              const allowedFormatted = allowed
                .map((d: string) => `@${d}`)
                .join(', ');
              return `/auth/error?error=DomainRestricted&domain=${encodeURIComponent(
                emailDomain
              )}&allowed=${encodeURIComponent(allowedFormatted)}`;
            }
          }
        }

        // Synchronize user profile to backend MongoDB Atlas and local users.json
        await fetch(`${backendUrl}/api/campus/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            name: user.name || cleanEmail.split('@')[0],
            avatar: user.image || '',
            googleId: user.id || account?.providerAccountId,
          }),
        });
      } catch (err) {
        console.error('[NextAuth] Backend sync error:', err);
      }

      return true;
    },
    async session({ session }) {
      if (session?.user && session.user.email) {
        const email = session.user.email.toLowerCase();
        const domain = email.split('@')[1] || '';
        (session.user as any).domain = domain;
        (session.user as any).role = domain.includes('parul')
          ? 'student'
          : 'user';
      }
      return session;
    },
  },
  pages: {
    error: '/auth/error',
  },
  secret:
    process.env.AUTH_SECRET ||
    'kryvix_campus_ai_auth_secret_89cbb5b0e3b94c579c31',
});
