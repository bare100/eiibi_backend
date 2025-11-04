import { config } from '../../config.js'
import { GooglePlaces } from '../../lib/google-places.js'
import { SettingsRepository } from '../settings/repository.js'

class GoogleMapsService {
  loadGooglePlacesByKeyword = async (keyword: string) => {
    const places = await this.getPlaces()
    return new Promise((resolve, reject) => {
      places.autocomplete(
        { input: keyword, types: '(cities)' },
        (err: Error, res: { predictions: Record<string, unknown>[] }) => {
          if (err) {
            reject(err)
          }

          resolve(res)
        }
      )
    })
  }

  loadGooglePlaceDetails = async (referenceId: string) => {
    const places = await this.getPlaces()
    return new Promise((resolve, reject) => {
      places.details({ reference: referenceId }, (err: Error, res: Record<string, unknown>) => {
        if (err) {
          reject(err)
        }

        resolve(res)
      })
    })
  }

  loadDetailsBasedOnLocation = async (lat: number, lng: number) => {
    const settings = await SettingsRepository.get()
    const apiKey = settings?.googleMapsApiKey || config.GOOGLE_MAPS_API_KEY
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`

    const res = await fetch(url)
    const json = await res.json()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (json as { results: [] }).results.find((result: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return result.address_components.some((component: any) => {
        return component.types.includes('country')
      })
    })
  }

  private getPlaces = async () => {
    const settings = await SettingsRepository.get()
    const apiKey = settings?.googleMapsApiKey || config.GOOGLE_MAPS_API_KEY
    return new GooglePlaces(apiKey)
  }
}

const service = new GoogleMapsService()
export { service as GoogleMapsService }
