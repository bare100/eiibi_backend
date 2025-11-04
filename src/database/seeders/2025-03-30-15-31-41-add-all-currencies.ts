import sequelize from 'sequelize'
import { Currency } from '../../modules/currencies/model.js'
import { Settings } from '../../modules/settings/model.js'
import { SettingsRepository } from '../../modules/settings/repository.js'
import { ExchangeRate } from '../../modules/exchange-rates/model.js'
import { Post } from '../../modules/posts/model.js'

const CURRENCIES = [
  {
    code: 'USD',
    symbol: '$',
    name: {
      en: 'United States Dollar',
      ar: 'دولار أمريكي',
      ro: 'Dolar american',
      fr: 'Dollar américain',
      de: 'US-Dollar',
      it: 'Dollaro statunitense',
      es: 'Dólar estadounidense',
      ja: '米ドル',
    },
  },
  {
    code: 'AUD',
    symbol: 'A$',
    name: {
      en: 'Australian Dollar',
      ar: 'دولار أسترالي',
      ro: 'Dolar australian',
      fr: 'Dollar australien',
      de: 'Australischer Dollar',
      it: 'Dollaro australiano',
      es: 'Dólar australiano',
      ja: 'オーストラリアドル',
    },
  },
  {
    code: 'BGN',
    symbol: 'лв',
    name: {
      en: 'Bulgarian Lev',
      ar: 'ليف بلغاري',
      ro: 'Leva bulgară',
      fr: 'Lev bulgare',
      de: 'Bulgarischer Lew',
      it: 'Lev bulgaro',
      es: 'Lev búlgaro',
      ja: 'ブルガリアレフ',
    },
  },
  {
    code: 'BRL',
    symbol: 'R$',
    name: {
      en: 'Brazilian Real',
      ar: 'ريال برازيلي',
      ro: 'Real brazilian',
      fr: 'Réal brésilien',
      de: 'Brasilianischer Real',
      it: 'Real brasiliano',
      es: 'Real brasileño',
      ja: 'ブラジルレアル',
    },
  },
  {
    code: 'CAD',
    symbol: 'C$',
    name: {
      en: 'Canadian Dollar',
      ar: 'دولار كندي',
      ro: 'Dolar canadian',
      fr: 'Dollar canadien',
      de: 'Kanadischer Dollar',
      it: 'Dollaro canadese',
      es: 'Dólar canadiense',
      ja: 'カナダドル',
    },
  },
  {
    code: 'CHF',
    symbol: 'CHF',
    name: {
      en: 'Swiss Franc',
      ar: 'فرنك سويسري',
      ro: 'Franc elvețian',
      fr: 'Franc suisse',
      de: 'Schweizer Franken',
      it: 'Franco svizzero',
      es: 'Franco suizo',
      ja: 'スイスフラン',
    },
  },
  {
    code: 'CNY',
    symbol: '¥',
    name: {
      en: 'Chinese Yuan',
      ar: 'يوان صيني',
      ro: 'Yuan chinezesc',
      fr: 'Yuan chinois',
      de: 'Chinesischer Yuan',
      it: 'Yuan cinese',
      es: 'Yuan chino',
      ja: '中国人民元',
    },
  },
  {
    code: 'CZK',
    symbol: 'Kč',
    name: {
      en: 'Czech Koruna',
      ar: 'كرونة تشيكية',
      ro: 'Coroană cehă',
      fr: 'Couronne tchèque',
      de: 'Tschechische Krone',
      it: 'Corona ceca',
      es: 'Corona checa',
      ja: 'チェココルナ',
    },
  },
  {
    code: 'DKK',
    symbol: 'kr',
    name: {
      en: 'Danish Krone',
      ar: 'كرونة دنماركية',
      ro: 'Coroană daneză',
      fr: 'Couronne danoise',
      de: 'Dänische Krone',
      it: 'Corona danese',
      es: 'Corona danesa',
      ja: 'デンマーククローネ',
    },
  },
  {
    code: 'EUR',
    symbol: '€',
    name: {
      en: 'Euro',
      ar: 'يورو',
      ro: 'Euro',
      fr: 'Euro',
      de: 'Euro',
      it: 'Euro',
      es: 'Euro',
      ja: 'ユーロ',
    },
  },
  {
    code: 'GBP',
    symbol: '£',
    name: {
      en: 'British Pound Sterling',
      ar: 'جنيه إسترليني',
      ro: 'Liră sterlină',
      fr: 'Livre sterling',
      de: 'Britisches Pfund',
      it: 'Sterlina britannica',
      es: 'Libra esterlina',
      ja: 'イギリスポンド',
    },
  },
  {
    code: 'HKD',
    symbol: 'HK$',
    name: {
      en: 'Hong Kong Dollar',
      ar: 'دولار هونغ كونغ',
      ro: 'Dolar Hong Kong',
      fr: 'Dollar de Hong Kong',
      de: 'Hongkong-Dollar',
      it: 'Dollaro di Hong Kong',
      es: 'Dólar de Hong Kong',
      ja: '香港ドル',
    },
  },
  {
    code: 'HUF',
    symbol: 'Ft',
    name: {
      en: 'Hungarian Forint',
      ar: 'فورنت مجري',
      ro: 'Forint maghiar',
      fr: 'Forint hongrois',
      de: 'Ungarischer Forint',
      it: 'Fiorino ungherese',
      es: 'Forinto húngaro',
      ja: 'ハンガリーフォリント',
    },
  },
  {
    code: 'IDR',
    symbol: 'Rp',
    name: {
      en: 'Indonesian Rupiah',
      ar: 'روبية إندونيسية',
      ro: 'Rupie indoneziană',
      fr: 'Roupie indonésienne',
      de: 'Indonesische Rupiah',
      it: 'Rupia indonesiana',
      es: 'Rupia indonesia',
      ja: 'インドネシアルピア',
    },
  },
  {
    code: 'ILS',
    symbol: '₪',
    name: {
      en: 'Israeli New Shekel',
      ar: 'شيكل إسرائيلي جديد',
      ro: 'Shekel israelian nou',
      fr: 'Shekel israélien nouveau',
      de: 'Neuer Israelischer Schekel',
      it: 'Nuovo shekel israeliano',
      es: 'Nuevo shekel israelí',
      ja: '新イスラエルシェケル',
    },
  },
  {
    code: 'INR',
    symbol: '₹',
    name: {
      en: 'Indian Rupee',
      ar: 'روبية هندية',
      ro: 'Rupie indiană',
      fr: 'Roupie indienne',
      de: 'Indische Rupie',
      it: 'Rupia indiana',
      es: 'Rupia india',
      ja: 'インドルピー',
    },
  },
  {
    code: 'JPY',
    symbol: '¥',
    name: {
      en: 'Japanese Yen',
      ar: 'ين ياباني',
      ro: 'Yen japonez',
      fr: 'Yen japonais',
      de: 'Japanischer Yen',
      it: 'Yen giapponese',
      es: 'Yen japonés',
      ja: '日本円',
    },
  },
  {
    code: 'KRW',
    symbol: '₩',
    name: {
      en: 'South Korean Won',
      ar: 'وون كوري جنوبي',
      ro: 'Won sud-coreean',
      fr: 'Won sud-coréen',
      de: 'Südkoreanischer Won',
      it: 'Won sudcoreano',
      es: 'Won surcoreano',
      ja: '韓国ウォン',
    },
  },
  {
    code: 'MXN',
    symbol: 'Mex$',
    name: {
      en: 'Mexican Peso',
      ar: 'بيزو مكسيكي',
      ro: 'Peso mexican',
      fr: 'Peso mexicain',
      de: 'Mexikanischer Peso',
      it: 'Peso messicano',
      es: 'Peso mexicano',
      ja: 'メキシコペソ',
    },
  },
  {
    code: 'MYR',
    symbol: 'RM',
    name: {
      en: 'Malaysian Ringgit',
      ar: 'رينغيت ماليزي',
      ro: 'Ringgit malaez',
      fr: 'Ringgit malaisien',
      de: 'Malaysischer Ringgit',
      it: 'Ringgit malese',
      es: 'Ringgit malayo',
      ja: 'マレーシアリンギット',
    },
  },
  {
    code: 'NOK',
    symbol: 'kr',
    name: {
      en: 'Norwegian Krone',
      ar: 'كرونة نرويجية',
      ro: 'Coroană norvegiană',
      fr: 'Couronne norvégienne',
      de: 'Norwegische Krone',
      it: 'Corona norvegese',
      es: 'Corona noruega',
      ja: 'ノルウェークローネ',
    },
  },
  {
    code: 'NZD',
    symbol: 'NZ$',
    name: {
      en: 'New Zealand Dollar',
      ar: 'دولار نيوزيلندي',
      ro: 'Dolar neozeelandez',
      fr: 'Dollar néo-zélandais',
      de: 'Neuseeland-Dollar',
      it: 'Dollaro neozelandese',
      es: 'Dólar neozelandés',
      ja: 'ニュージーランドドル',
    },
  },
  {
    code: 'PHP',
    symbol: '₱',
    name: {
      en: 'Philippine Peso',
      ar: 'بيزو فلبيني',
      ro: 'Peso filipinez',
      fr: 'Peso philippin',
      de: 'Philippinischer Peso',
      it: 'Peso filippino',
      es: 'Peso filipino',
      ja: 'フィリピンペソ',
    },
  },
  {
    code: 'PLN',
    symbol: 'zł',
    name: {
      en: 'Polish Złoty',
      ar: 'زلوتي بولندي',
      ro: 'Zlot polonez',
      fr: 'Zloty polonais',
      de: 'Polnischer Zloty',
      it: 'Zloty polacco',
      es: 'Zloty polaco',
      ja: 'ポーランドズウォティ',
    },
  },
  {
    code: 'RON',
    symbol: 'lei',
    name: {
      en: 'Romanian Leu',
      ar: 'ليو روماني',
      ro: 'Leu românesc',
      fr: 'Leu roumain',
      de: 'Rumänischer Leu',
      it: 'Leu rumeno',
      es: 'Leu rumano',
      ja: 'ルーマニアレウ',
    },
  },
  {
    code: 'SEK',
    symbol: 'kr',
    name: {
      en: 'Swedish Krona',
      ar: 'كرونة سويدية',
      ro: 'Coroană suedeză',
      fr: 'Couronne suédoise',
      de: 'Schwedische Krone',
      it: 'Corona svedese',
      es: 'Corona sueca',
      ja: 'スウェーデンクローナ',
    },
  },
  {
    code: 'SGD',
    symbol: 'S$',
    name: {
      en: 'Singapore Dollar',
      ar: 'دولار سنغافوري',
      ro: 'Dolar singaporez',
      fr: 'Dollar singapourien',
      de: 'Singapur-Dollar',
      it: 'Dollaro di Singapore',
      es: 'Dólar de Singapur',
      ja: 'シンガポールドル',
    },
  },
  {
    code: 'THB',
    symbol: '฿',
    name: {
      en: 'Thai Baht',
      ar: 'بات تايلاندي',
      ro: 'Baht thailandez',
      fr: 'Baht thaïlandais',
      de: 'Thailändischer Baht',
      it: 'Baht tailandese',
      es: 'Baht tailandés',
      ja: 'タイバーツ',
    },
  },
  {
    code: 'TRY',
    symbol: '₺',
    name: {
      en: 'Turkish Lira',
      ar: 'ليرة تركية',
      ro: 'Liră turcească',
      fr: 'Livre turque',
      de: 'Türkische Lira',
      it: 'Lira turca',
      es: 'Lira turca',
      ja: 'トルコリラ',
    },
  },
  {
    code: 'ZAR',
    symbol: 'R',
    name: {
      en: 'South African Rand',
      ar: 'راند جنوب أفريقي',
      ro: 'Rand sud-african',
      fr: 'Rand sud-africain',
      de: 'Südafrikanischer Rand',
      it: 'Rand sudafricano',
      es: 'Rand sudafricano',
      ja: '南アフリカランド',
    },
  },
  {
    code: 'ISK',
    symbol: 'kr',
    name: {
      en: 'Icelandic Króna',
      ar: 'كرونة آيسلندية',
      ro: 'Coroană islandeză',
      fr: 'Couronne islandaise',
      de: 'Isländische Krone',
      it: 'Corona islandese',
      es: 'Corona islandesa',
      ja: 'アイスランドクローナ',
    },
  },
]

const EXCHANGE_RATES = {
  USD: 1,
  AUD: 1.5666,
  BGN: 1.8689,
  BRL: 5.7096,
  CAD: 1.4196,
  CHF: 0.90014,
  CNY: 7.2559,
  CZK: 23.968,
  DKK: 7.1274,
  EUR: 0.95557,
  GBP: 0.79083,
  HKD: 7.7713,
  HUF: 386.62,
  IDR: 16319,
  ILS: 3.5558,
  INR: 86.63,
  ISK: 139.23,
  JPY: 150.46,
  KRW: 1433.5,
  MXN: 20.326,
  MYR: 4.4185,
  NOK: 11.1123,
  NZD: 1.7378,
  PHP: 57.946,
  PLN: 3.9831,
  RON: 4.7561,
  SEK: 10.6474,
  SGD: 1.3372,
  THB: 33.62,
  TRY: 36.409,
  ZAR: 18.3899,
}

export async function up({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    for (const currency of CURRENCIES) {
      await Currency.create(
        {
          code: currency.code,
          symbol: currency.symbol,
          name: currency.name,
        },
        { transaction }
      )
    }

    // Get all the currencies back and select the one with code USD
    const currencies = await Currency.findAll({ transaction })
    const usdCurrency = currencies.find((currency) => currency.code === 'USD')

    const exchangeRate = {
      baseCurrencyId: usdCurrency.id,
      ratesDate: new Date('2025-02-21'),
      rates: EXCHANGE_RATES,
    }

    await ExchangeRate.create(exchangeRate, { transaction })

    // Update the settings with the USD currency id
    const settings = await SettingsRepository.get()
    await Settings.update(
      {
        defaultCurrencyId: usdCurrency.id,
      },
      { where: { id: settings.id }, transaction }
    )

    await Post.update(
      {
        initialCurrencyId: usdCurrency.id,
      },
      { where: { initialCurrencyId: null }, transaction }
    )

    await transaction.commit()
  } catch (error) {
    console.error(error)
    await transaction.rollback()
    throw error
  }
}

export async function down({ context: queryInterface }: { context: sequelize.QueryInterface }) {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
