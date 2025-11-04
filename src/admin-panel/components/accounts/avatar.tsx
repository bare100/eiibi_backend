// @ts-ignore
import { ApiClient } from 'adminjs'
import { useEffect, useState } from 'react'

const AccountAvatar = ({ record, where }) => {
  const [assetPath, setAssetPath] = useState(null)
  const imageSize = where === 'list' ? 50 : 130

  const api = new ApiClient();

  useEffect(() => {
    if (!record.params.assetId) {
      return
    }

    api.recordAction({
      resourceId: 'assets',
      recordId: record.params.assetId,
      actionName: 'show',
    }).then(response => {
      const assetPath = response.data.record?.params?.path
      if (assetPath) {
        setAssetPath(assetPath)
      }
    }).catch(error => {
      console.error('Could not fetch asset', error)
    })
  }, [])

  if (assetPath) {
    return (
      <img
        src={`/assets/${assetPath}`}
        alt={record.params.email}
        style={{
          width: imageSize,
          height: imageSize,
          borderRadius: '50%',
        }}
      />
    )
  }

  return (
    <img
      src={record.params.picture}
      alt={record.params.email}
      style={{
        width: imageSize,
        height: imageSize,
        borderRadius: '50%',
      }}
    />
  )
}

export default AccountAvatar
