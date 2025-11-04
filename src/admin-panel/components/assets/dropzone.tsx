import React, { useState } from 'react';
// @ts-ignore
import { useNotice, ApiClient } from 'adminjs'
// @ts-ignore
import { Box, DropZone, Label, Button } from '@adminjs/design-system';

const AssetDropzone = (props) => {
  const [file, setFile] = useState(null);
  const notice = useNotice();
  const api = new ApiClient();

  const handleDrop = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
  };

  const handleSubmit = async () => {
    if (!file) {
      notice({ message: 'Please select a file before submitting.', type: 'error' });
      return;
    }

    const formData = new FormData();
    formData.append('files', file);

    try {

      const response = await api.resourceAction({
        resourceId: 'assets',
        actionName: 'new',
        data: formData,
        headers: {
          'content-type': 'multipart/form-data',
        }
      })

      const result = response.data
      if (result.notice.type === 'success') {
        notice({ message: result.notice.message, type: 'success' });
        // @ts-ignore
        window.location.href = result.redirectUrl;
      } else {
        notice({ message: result.notice.message, type: 'error' });
      }
    } catch (error) {
      notice({ message: 'There was a problem while trying to upload your file', type: 'error' })
    }
  };

  return (
    <Box flex flexDirection="column" alignItems="center" >
      <div style={{ width: '100%' }}>
        <Label>{'Upload Image *'}</Label>
      </div>

      <div style={{ width: '100%' }}>
        <DropZone onChange={handleDrop} style={{ width: '100%' }} />
      </div>

      <div style={{ marginTop: 24 }}>
        <Button isLoading={true} variant="primary" onClick={handleSubmit}>
          Create
        </Button>
      </div>
    </Box>
  );
}

export default AssetDropzone