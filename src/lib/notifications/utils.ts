import { Account } from '../../modules/accounts/model.js'

export const replaceNotificationPlaceholders = (
  template: string,
  values: Record<string, string>
) => {
  return template.replace(/{{(.*?)}}/g, (a, b) => {
    const r = values[b.trim()]
    return typeof r === 'string' ? r : a
  })
}

export const generateNameForAccount = (acc: Account, language?: string) => {
  if (acc.name != null && acc.name != '') {
    return acc.name
  }

  if (acc.rawEmail != '') {
    const containsAt = acc.rawEmail.indexOf('@')
    if (containsAt != -1) {
      return acc.rawEmail.substring(0, containsAt)
    }
    return acc.rawEmail
  }

  if (acc.email != '') {
    const containsAt = acc.email.indexOf('@')
    if (containsAt != -1) {
      return acc.email.substring(0, containsAt)
    }
    return acc.email
  }

  return language == 'ro' ? 'Cineva' : 'Someone'
}
