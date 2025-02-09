import { BaseSchema } from '@adonisjs/lucid/schema'

export default class UsersSchema extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('username', 255).notNullable().unique()
      table.string('email', 255).notNullable()
      table.string('avatar').nullable()
      table.string('password', 180).notNullable()
      table.string('remember_me_token').nullable()
      table.string('verification_code').nullable()
      table.boolean('is_verified').notNullable().defaultTo(false)
      table.dateTime('email_verified_at').nullable()
      table.string('password_reset_token').nullable()
      table.timestamp('token_expires_at').nullable()

      /**
       * Uses timestampz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      table.index(['id', 'username'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}


