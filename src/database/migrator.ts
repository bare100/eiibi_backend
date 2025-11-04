import { Sequelize } from 'sequelize/types'
import { SequelizeStorage, Umzug } from 'umzug'
import { DatabaseConnection } from './index.js'
import path from 'path'

class DatabaseMigrator {
  private umzug: Umzug<Sequelize>

  init(glob: string, tableName: string) {
    const sequelize = DatabaseConnection.getInstance()
    const isMigration = glob.indexOf('migrations') !== -1
    const isWindows = process.platform === 'win32'
    const migrationsPath = path.resolve(`./dist/database/${isMigration ? 'migrations' : 'seeders'}`)

    this.umzug = new Umzug<Sequelize>({
      migrations: {
        glob: isWindows ? ['*.js', { cwd: migrationsPath }] : glob,
        resolve: ({ name, path, context: sequelizeContext }) => {
          return {
            name,
            up: async () => {
              const migration = await import(isWindows ? 'file:///' + path : path)
              return await migration.up({ context: sequelizeContext })
            },
            down: async () => {
              const migration = await import(isWindows ? 'file:///' + path : path)
              return await migration.down({ context: sequelizeContext })
            },
          }
        },
      },
      context: sequelize.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize, tableName }),
      logger: console,
    })
  }

  public async migrateChanges() {
    await this.umzug.up()
  }

  public async revertLastMigration() {
    await this.umzug.down()
  }

  public async revertUntillMigrationName(migration: string) {
    await this.umzug.down({ to: migration })
  }
}

const migratorInstance = new DatabaseMigrator()
export { migratorInstance as DatabaseMigrator }
