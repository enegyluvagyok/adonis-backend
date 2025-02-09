import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import vine from '@vinejs/vine'
import { randomBytes } from 'crypto'
import { DateTime } from 'luxon'
import VerifyEmailNotification from '#mails/verify_e_notification'
import ForgotPasswordNotification from '#mails/forgot_password_notification'
import Hash from '@adonisjs/core/services/hash'


export default class AuthController {

  public async register({ request, response }: HttpContext) {
    const inputKeys = Object.keys(request.body())
    const requiredKeys = ['username', 'email', 'password', 'password_confirmation']
    const missingKeys = requiredKeys.filter((key) => !inputKeys.includes(key))

    if (!request.hasBody()) {
      return response.badRequest({ message: 'Missing request body' })
    }

    if (missingKeys.length) {
      return response.badRequest({ message: `Missing required fields: ${missingKeys.join(', ')}` })
    }

    if (request.input('password') !== request.input('password_confirmation')) {
      return response.badRequest({ message: 'Passwords do not match' })
    }

    const userSchema = vine.compile(
      vine.object({
        username: vine.string().minLength(3).unique({ table: 'users', column: 'username' }),
        email: vine.string().email().unique({ table: 'users', column: 'email' }),
        password: vine.string().minLength(6),
      })
    )
    const payload = await request.validateUsing(userSchema)
    const verificationCode = randomBytes(20).toString('hex')
    const user = await User.create({ ...payload, verificationCode })

    await VerifyEmailNotification.sendRegisterVerificationEmail(user, verificationCode)

    return response.created({ message: 'User registered successfully', user })
  }

  public async verifyEmail({ params, response }: HttpContext) {
    const user = await User.findBy('verification_code', params.code)

    if (!user) {
      return response.status(400).json({ message: 'Invalid verification code' })
    }

    user.isVerified = true
    user.verificationCode = null
    user.emailVerifiedAt = DateTime.now()
    await user.save()

    return response.json({ message: 'Email verified successfully' })
  }

  public async login({ request, response, auth }: HttpContext) {

    const loginSchema = vine.compile(
      vine.object({
        email: vine.string().email(),
        password: vine.string().minLength(6),
        rememberMe: vine.boolean().optional(),
      })
    )

    const { email, password, rememberMe } = await request.validateUsing(loginSchema)

    const user = await User.findBy('email', email)

    if (!user || !(await Hash.use('scrypt').verify(user.password, password))) {
      return response.unauthorized({ message: 'Invalid credentials' })
    }

    if (!user.isVerified) {
      return response.unauthorized({ message: 'Please verify your email first' })
    }

    const token = await auth.use('web').login(user)

    if (rememberMe) {
      user.rememberMeToken = randomBytes(32).toString('hex')
      await user.save()
    }

    return response.ok({ token, remember_me_token: user.rememberMeToken })
  }

  public async forgotPassword({ request, response }: HttpContext) {
    const email = request.input('email')

    const user = await User.findBy('email', email)
    if (!user) {
      return response.notFound({ message: 'User not found' })
    }

    user.passwordResetToken = randomBytes(32).toString('hex')
    user.tokenExpiresAt = DateTime.now().plus({ hours: 1 })
    await user.save()

    await ForgotPasswordNotification.sendForgotPasswordEmail(user)
    
    return response.ok({ message: 'Password reset email sent' })

  }

  public async resetPassword({ request, response }: HttpContext) {
    const { token, newPassword } = request.only(['token', 'newPassword'])

    const user = await User.findBy('passwordResetToken', token)
    if (!user || DateTime.now() > user.tokenExpiresAt!) {
      return response.badRequest({ message: 'Invalid or expired token' })
    }

    user.password = newPassword
    user.passwordResetToken = null
    user.tokenExpiresAt = null
    await user.save()

    return response.ok({ message: 'Password reset successfully' })
  }

  public async logout({ auth, response }: HttpContext) {
    
    let user = auth.user;

    if (user?.rememberMeToken) {
      user.rememberMeToken = null
      await user.save()
    }

    await auth.use('web').logout()
    return response.ok({ message: 'Logged out successfully' })
  }

}
