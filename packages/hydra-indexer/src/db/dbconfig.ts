import path from 'path'
import { ConnectionOptions } from 'typeorm'
import { SnakeNamingStrategy } from '@subsquid/hydra-db-utils'
import { SubstrateEventEntity, SubstrateExtrinsicEntity } from '../entities'
import { getDBConfig } from '../node'
import { SubstrateBlockEntity } from '../entities/SubstrateBlockEntity'

const migrationsDir = path.resolve(__dirname, '../migrations')

const config: (name?: string) => ConnectionOptions = (name) => {
  const conf = getDBConfig()
  const migrations = [`${migrationsDir}/v3/*.js`, `${migrationsDir}/v4/*.js`]
  if (conf.EXTENSION_MIGRATIONS_DIR) {
    const pattern = conf.EXTENSION_MIGRATIONS_DIR.endsWith('/')
      ? `${conf.EXTENSION_MIGRATIONS_DIR}*.js`
      : `${conf.EXTENSION_MIGRATIONS_DIR}/*.js`
    migrations.push(pattern)
  }
  return {
    name,
    type: 'postgres',
    host: conf.DB_HOST,
    port: conf.DB_PORT,
    username: conf.DB_USER,
    password: conf.DB_PASS,
    database: conf.DB_NAME,
    entities: [
      SubstrateEventEntity,
      SubstrateExtrinsicEntity,
      SubstrateBlockEntity,
    ],
    migrations,
    cli: {
      migrationsDir: 'src/migrations/v3',
    },
    logging: conf.DB_LOGGING,
    namingStrategy: new SnakeNamingStrategy(),
  } as ConnectionOptions
}

export default config
