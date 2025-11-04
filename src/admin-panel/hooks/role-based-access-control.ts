// @ts-ignore
import { buildFeature } from 'adminjs'
import { defaultValuesBeforeHook } from './default-values-before.js'
import { roleAccessControlAfterHook } from './role-access-after.js'
import { roleAccessControlBeforeHook } from './role-access-before.js'
import { customComponents } from '../component-loader.js'

export const roleBasedAccessControl = buildFeature((admin) => {
  return {
    actions: {
      new: {
        component: customComponents.CustomAction,
        before: [roleAccessControlBeforeHook, defaultValuesBeforeHook],
        after: [roleAccessControlAfterHook],
      },
      edit: {
        component: customComponents.CustomAction,
        before: [roleAccessControlBeforeHook],
        after: [roleAccessControlAfterHook],
      },
      show: {
        component: customComponents.CustomAction,
        after: [roleAccessControlAfterHook],
      },
      list: {
        component: customComponents.CustomAction,
        after: [roleAccessControlAfterHook],
      },
    },
  }
})
