import React, { useState } from 'react';
// @ts-ignore
import { useActionContext, Button, Modal, Box, Text } from '@adminjs/design-system';

const BulkDeleteButton = (props) => {
  const { records, actionPerformed } = useActionContext();
  const [showModal, setShowModal] = useState(false);

  const handleDeleteClick = () => {
    setShowModal(true);
  };

  const handleConfirm = async () => {
    setShowModal(false);
    await actionPerformed({ name: 'customBulkDelete' }); // Call the custom bulk delete action
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <>
      <Button onClick={handleDeleteClick} variant="danger">
        Delete Selected
      </Button>

      {showModal && (
        <Modal>
          <Box variant="white" padding="20px">
            <Text>Are you sure you want to delete {records.length} record(s)?</Text>
            <Box marginTop="20px" display="flex" justifyContent="space-between">
              <Button onClick={handleConfirm} variant="primary">
                Confirm
              </Button>
              <Button onClick={handleCancel} variant="text">
                Cancel
              </Button>
            </Box>
          </Box>
        </Modal>
      )}
    </>
  );
};

export default BulkDeleteButton;
