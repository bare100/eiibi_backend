import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator'

export const generateAnonymousEmail = () => {
  const prefix = uniqueNamesGenerator({
    dictionaries: [colors, animals],
    style: 'lowerCase',
  })

  return `${prefix}@bazaryo.app`
}
