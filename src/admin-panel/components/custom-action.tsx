import { FC } from 'react'
import {
  // @ts-ignore
  ActionProps,
  // @ts-ignore
  BaseActionComponent,
  // @ts-ignore
  BasePropertyJSON,
  // @ts-ignore
  useCurrentAdmin,
} from 'adminjs'

const CustomAction: FC<ActionProps> = (props) => {
  const [currentAdmin] = useCurrentAdmin()
  const newProps = { ...props }

  // This is important - `component` option controls which custom
  // component is rendered by `BaseActionComponent` and we don't
  // want to render this code here again. That would create an
  // infinite loop.
  newProps.action = { ...newProps.action, component: undefined }

  // Configuration is stored in each property's custom props.
  const filter = (property: BasePropertyJSON) => {
    const { role } = property.custom
    return !role || currentAdmin?.role === String(role)
  }

  // Since we want to remove properties from all actions, a common
  // filtering function can be used.
  const { resource } = newProps
  resource.listProperties = resource.listProperties.filter(filter)
  resource.editProperties = resource.editProperties.filter(filter)
  resource.showProperties = resource.showProperties.filter(filter)
  resource.filterProperties = resource.filterProperties.filter(filter)

  return <BaseActionComponent {...newProps} />
}

export default CustomAction;
