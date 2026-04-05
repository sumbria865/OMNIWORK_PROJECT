const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const prisma = require('./database')
const { generateToken } = require('../utils/jwt.utils')

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await prisma.user.findUnique({
      where: { email: profile.emails[0].value }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: profile.displayName,
          email: profile.emails[0].value,
          password: 'GOOGLE_AUTH',
          avatar: profile.photos[0]?.value || null,
          role: 'EMPLOYEE',
          isActive: true
        }
      })
    }

    const token = generateToken({ id: user.id, role: user.role })
    const { password: _, ...userWithoutPassword } = user
    return done(null, { user: userWithoutPassword, token })
  } catch (err) {
    return done(err, null)
  }
}))

module.exports = passport