import React, { useState } from 'react';
// @ts-ignore
import { useNotice, ApiClient } from 'adminjs'
// @ts-ignore
import { Box, DropZone, Label, Button } from '@adminjs/design-system';


export const CustomCategoryIconEdit = ({ record }) => {
  const [file, setFile] = useState(null);
  const notice = useNotice();
  const api = new ApiClient();

  const handleDrop = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
  };

  const reloadLocation = () => {
    try {
      // @ts-ignore
      location.reload()
    } catch (error) { }
  }

  const handleSubmit = async (ev) => {
    ev.stopPropagation()
    ev.preventDefault()

    if (!file) {
      notice({ message: 'Please select a file before submitting.', type: 'error' });
      return;
    }
    const formData = new FormData();
    formData.append('files', file);
    formData.append('categoryId', record.id)

    try {
      const response = await api.resourceAction({
        resourceId: 'categories',
        actionName: 'uploadCustomIcon',
        data: formData,
        headers: {
          'content-type': 'multipart/form-data',
        }
      })

      const result = response.data
      if (result.notice.type !== 'success') {
        notice({ message: result.notice.message, type: 'error' });
        return
      }

      notice({ message: result.notice.message, type: 'success' });
      reloadLocation()
    } catch (error) {
      notice({ message: 'There was a problem while trying to upload your icon', type: 'error' })
    }
  };

  const handleDeleteAsset = async (ev) => {
    ev.stopPropagation()
    ev.preventDefault()
    const api = new ApiClient();

    try {
      await api.recordAction({
        resourceId: 'categories',
        actionName: 'removeIcon',
        recordId: record.id,
      })

      notice({ message: 'Icon was deleted', type: 'success' });
      reloadLocation()
    } catch (error) {
      notice({ message: 'Could not delete icon.', type: 'error' });
    }
  }

  const existingAsset = record.populated?.assetId?.params
  if (existingAsset) {
    return <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16, overflowX: 'auto' }}>
      <Label>{'Uploaded icon'}</Label>
      <div className='asset-root'>
        <img
          src={`/assets/${existingAsset.path}`}
          style={{ height: 250, width: 250, borderRadius: 4 }}
        />
        <div className='asset-action'>
          <Button variant="contained" onClick={handleDeleteAsset}>
            Remove from category
          </Button>
        </div>
      </div>
    </div>
  }

  return (
    <Box flex flexDirection="column" alignItems="center" >
      <div style={{ width: '100%', marginBottom: 16 }}>
        <Label>{'Custom Icon'}</Label>
        <span>You can upload your custom icon to be used for this category, or you can use the "Icon" field, to use an icon that is available inside the mobile app, or you can set a remote URL, to use an icon that is found online.</span>
      </div>

      <div style={{ width: '100%' }}>
        <DropZone onChange={handleDrop} style={{ width: '100%' }} />
      </div>

      <div style={{ marginTop: 24 }}>
        <Button isLoading={true} variant="primary" onClick={handleSubmit}>
          Upload
        </Button>
      </div>
    </Box>
  );
}

export default CustomCategoryIconEdit