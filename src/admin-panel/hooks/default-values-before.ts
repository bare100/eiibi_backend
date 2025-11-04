// @ts-ignore
import { Before } from 'adminjs'

export const defaultValuesBeforeHook: Before = async (request, context) => {
  const { payload, method } = request
  if (method !== 'post' || !payload || context.action.name !== 'new') {
    return request
  }
  const { properties } = context.resource.decorate().toJSON(context.currentAdmin)
  // @ts-ignore
  Object.entries(properties).forEach(([name, { custom }]) => {
    if (custom.defaultValue && payload[name] === undefined) {
      payload[name] = custom.defaultValue
    }
  })
  return request
}
