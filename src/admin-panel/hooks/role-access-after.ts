// @ts-ignore
import { ActionContext, RecordJSON } from 'adminjs'

export const roleAccessControlAfterHook = async (response: any, _: any, context: ActionContext) => {
  const { properties } = context.resource.decorate().toJSON(context.currentAdmin)
  const targetRole = context.currentAdmin?.role
  const propertiesToRemove = Object.entries(properties)
    // @ts-ignore
    .filter(([_, { custom }]) => custom.role && String(custom.role) !== targetRole)
    .map(([name]) => name)

  const cleanupRecord = (record: RecordJSON) => {
    propertiesToRemove.forEach((name) => delete record.params[name])
  }
  if (response.record) {
    cleanupRecord(response.record)
  }
  if (response.records) {
    response.records.forEach(cleanupRecord)
  }
  return response
}
