import  mail  from '@adonisjs/mail/services/main'
import User from '../models/user.js'
import env from '#start/env'

export default class ForgotPasswordNotification {

  public static async sendForgotPasswordEmail(user: User) {
    
   let from = env.get('SMTP_USERNAME') ?? '';
   let url = env.get('HOST') + ':3333'
    
    return await mail.send((message) => {
      message
        .from(from)
        .to(user.email)
        .subject('Reset your password')
        .htmlView('emails/reset_password', {url, user})
    })
  }
}