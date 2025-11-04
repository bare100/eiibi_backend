import React from 'react'
// @ts-ignore
import { Button } from '@adminjs/design-system';
// @ts-ignore
import { ApiClient, useNotice } from 'adminjs'

const PostAssets = (props) => {
  const notice = useNotice()
  const api = new ApiClient();

  const reloadLocation = () => {
    try {
      // @ts-ignore
      location.reload()
    } catch (error) { }
  }

  const handleDeleteAsset = async (id: string) => {
    const assetsCount = props.record.params.assets.length
    if (assetsCount <= 1) {
      notice({ message: 'You cannot remove an asset from the post if it is the only one left.', type: 'error' })
      return
    }

    try {
      await api.recordAction({
        resourceId: 'assets',
        actionName: 'delete',
        recordId: id
      })

      notice({ message: 'Asset was deleted', type: 'success' });
      reloadLocation()
    } catch (error) {
      notice({ message: 'Could not delete asset.', type: 'error' });
    }
  }

  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 16, overflowX: 'auto' }}>
      {props.record.params.assets.map((asset, index) => {
        return (
          <div className='asset-root'>
            <img
              key={index}
              src={`/assets/${asset.path}`}
              style={{ height: 250, width: 250, borderRadius: 4 }}
            />
            <div className='asset-action'>
              <Button variant="contained" onClick={() => handleDeleteAsset(asset.id)}>
                Delete
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default PostAssets
