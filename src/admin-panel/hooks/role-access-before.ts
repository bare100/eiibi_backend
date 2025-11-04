// @ts-ignore
import { Before } from 'adminjs'

export const roleAccessControlBeforeHook: Before = async (request, context) => {
  const { method, payload } = request
  if (method !== 'post' || !payload) {
    return request
  }
  const { properties } = context.resource.decorate().toJSON(context.currentAdmin)
  const targetRole = context.currentAdmin?.role
  const propertiesToRemove = Object.entries(properties)
    // @ts-ignore
    .filter(([_, { custom }]) => custom.role && String(custom.role) !== targetRole)
    .map(([name]) => name)
  propertiesToRemove.forEach((name) => delete payload[name])
  return request
}
