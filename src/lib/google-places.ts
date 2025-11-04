import https from 'https'
import { parse, format, UrlWithParsedQuery } from 'url'

interface GooglePlacesConfig {
  key: string
  format: string
  headers: Record<string, string>
  host: string
  port: number
  path: string
}

interface SearchOptions {
  location?: [number, number]
  radius?: number
  sensor?: boolean
  language?: string
  rankby?: string
  types?: string[]
}

interface AutocompleteOptions {
  input: string
  language?: string
  sensor?: boolean
  types?: any
}

interface DetailsOptions {
  reference: string
  sensor?: boolean
  language?: string
}

export class GooglePlaces {
  private config: GooglePlacesConfig

  constructor(key: string, options?: Partial<Omit<GooglePlacesConfig, 'key'>>) {
    const defaultOptions: Omit<GooglePlacesConfig, 'key'> = {
      format: 'json',
      headers: { 'User-Agent': 'Google-Places-Node' },
      host: 'maps.googleapis.com',
      port: 443,
      path: '/maps/api/place/',
    }

    this.config = {
      key,
      ...defaultOptions,
      ...options,
    }
  }

  search(options: SearchOptions, cb: (err: Error | null, result?: any) => void): void {
    const defaultOptions: SearchOptions = {
      location: [42.357799, -71.0536364],
      radius: 10,
      sensor: false,
      language: 'en',
      rankby: 'prominence',
      types: [],
    }

    const mergedOptions = { ...defaultOptions, ...options }
    if (mergedOptions.location) {
      mergedOptions.location = mergedOptions.location.join(',') as unknown as [number, number]
    }
    if (mergedOptions.types && mergedOptions.types.length > 0) {
      mergedOptions.types = mergedOptions.types.join('|') as unknown as string[]
    } else {
      delete mergedOptions.types
    }
    if (mergedOptions.rankby === 'distance') {
      mergedOptions.radius = undefined
    }

    this._doRequest(this._generateUrl(mergedOptions, 'search'), cb)
  }

  autocomplete(options: AutocompleteOptions, cb: (err: Error | null, result?: any) => void): void {
    const defaultOptions: AutocompleteOptions = {
      input: '',
      language: 'en',
      sensor: false,
    }

    const mergedOptions = { ...defaultOptions, ...options }
    this._doRequest(this._generateUrl(mergedOptions, 'autocomplete'), cb)
  }

  details(options: DetailsOptions, cb: (err: Error | null, result?: any) => void): void {
    const defaultOptions: DetailsOptions = {
      reference: options.reference,
      sensor: false,
      language: 'en',
    }

    const mergedOptions = { ...defaultOptions, ...options }
    this._doRequest(this._generateUrl(mergedOptions, 'details'), cb)
  }

  private _doRequest(
    requestQuery: UrlWithParsedQuery,
    cb: (err: Error | null, result?: any) => void
  ): void {
    https
      .get(requestQuery.href || '', (res) => {
        const data: string[] = []
        res
          .on('data', (chunk) => data.push(chunk))
          .on('end', () => {
            const dataBuff = data.join('').trim()
            let result: any
            try {
              result = JSON.parse(dataBuff)
            } catch (exp) {
              result = { status_code: 500, status_text: 'JSON Parse Failed' }
            }
            cb(null, result)
          })
      })
      .on('error', (e) => {
        cb(e)
      })
  }

  private _generateUrl(query: Record<string, any>, method: string) {
    query.key = this.config.key
    return parse(
      format({
        protocol: 'https',
        hostname: this.config.host,
        pathname: `${this.config.path}${method}/${this.config.format}`,
        query,
      })
    ) as unknown as UrlWithParsedQuery
  }
}

export default GooglePlaces
