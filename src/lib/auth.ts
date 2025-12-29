import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

// Debug: Log NEXTAUTH_URL to help troubleshoot mobile testing
if (process.env.NODE_ENV === 'development') {
  console.log('[NextAuth] NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'NOT SET (will default to localhost:3000)')
}

export const authOptions: NextAuthOptions = {
  // Remove PrismaAdapter for now to fix session issues
  // adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Let NextAuth handle discovery, but provide wellKnown as fallback
      // This should prevent timeout while maintaining proper OAuth flow
      wellKnown: 'https://accounts.google.com/.well-known/openid-configuration',
    }),
    // EmailProvider requires an adapter, so we'll disable it for now
    // EmailProvider({
    //   server: {
    //     host: process.env.EMAIL_SERVER_HOST,
    //     port: process.env.EMAIL_SERVER_PORT,
    //     auth: {
    //       user: process.env.EMAIL_SERVER_USER,
    //       pass: process.env.EMAIL_SERVER_PASSWORD,
    //     },
    //   },
    //   from: process.env.EMAIL_FROM,
    // }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // For Google OAuth, we need to create/find the user in our database
      if (account?.provider === 'google' && user) {
        try {
          // Check if user exists in database
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          // If user doesn't exist, create them
          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                image: user.image,
                emailVerified: new Date(), // Google emails are verified
              }
            })
          }

          // Update token with database user ID
          token.id = dbUser.id
        } catch (error) {
          console.error('Error handling Google OAuth user:', error)
        }
      } else if (user) {
        // For credentials provider, user.id is already the database ID
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  // Explicitly set the base URL if provided (for mobile testing)
  // NextAuth will use this instead of defaulting to localhost:3000
  ...(process.env.NEXTAUTH_URL && { 
    // This ensures NextAuth uses the correct URL for callbacks
    // The URL is automatically used by NextAuth, but we log it for debugging
  }),
}
