import { getDataFromCache, setDataInCache } from '../../api/middlewares/cache.js'
import { GenericRepository } from '../../lib/base-repository.js'
import { Settings, SETTINGS_CACHE_KEY } from './model.js'

class SettingsRepository extends GenericRepository<Settings> {
  constructor() {
    super(Settings)
  }

  public async get(): Promise<Settings> {
    const cachedSettings = await getDataFromCache(SETTINGS_CACHE_KEY)
    if (cachedSettings) {
      return JSON.parse(cachedSettings)
    }

    const settings = await Settings.findOne()
    if (!settings) {
      throw new Error('Settings not found')
    }

    setDataInCache(SETTINGS_CACHE_KEY, JSON.stringify(settings.toJSON()))
    return settings.toJSON()
  }
}

const settingsRepositoryInstance = new SettingsRepository()
Object.freeze(settingsRepositoryInstance)

export { settingsRepositoryInstance as SettingsRepository }
