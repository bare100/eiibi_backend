import { join } from 'path'
import { writeFileSync } from 'fs'

import { SEED_MIGRATION_BASE, getCurrentYYYYMMDDHHmms } from './utils.js'

const fileName = process.argv[2] || 'migration'
const fullFileName = `${getCurrentYYYYMMDDHHmms()}-${fileName}.ts`
const filePath = join(process.cwd(), 'src', 'database', 'migrations', fullFileName)

writeFileSync(filePath, SEED_MIGRATION_BASE)
