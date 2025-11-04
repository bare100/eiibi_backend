import { join } from 'path'
import { writeFileSync } from 'fs'
import { generateNewLanguageBase, getCurrentYYYYMMDDHHmms } from './utils.js'

const language = process.argv[2]
if (!language) {
  console.error('Please provide a language code')
  process.exit(1)
}

const fullFileName = `${getCurrentYYYYMMDDHHmms()}-new-language-${language}.ts`
const filePath = join(process.cwd(), 'src', 'database', 'seeders', fullFileName)
const fileContent = generateNewLanguageBase(language)
writeFileSync(filePath, fileContent)
