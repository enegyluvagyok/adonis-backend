import  mail  from '@adonisjs/mail/services/main'
import User from '../models/user.js'
import env from '#start/env'

export default class VerifyEmailNotification {

  public static async sendRegisterVerificationEmail(user: User, verificationCode: string) {
    
   let from = env.get('SMTP_USERNAME') ?? '';
   let url = env.get('HOST') + ':3333'
    
    return await mail.send((message) => {
      message
        .from(from)
        .to(user.email)
        .subject('Verify your email registration')
        .htmlView('emails/verify_email', {url, user, verificationCode })
    })
  }
}