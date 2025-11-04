import React, { Fragment, useState } from 'react'
// @ts-ignore
import { useNotice, ApiClient } from 'adminjs'
import {
  Box,
  Button,
  TextArea,
  Modal,
  Label,
  Link,
  // @ts-ignore
} from '@adminjs/design-system'
import { DEFAULT_MULTI_LANGUAGE_OBJECT } from '../../constants'

const NOT_VALID_JSON_ERROR = 'The title field is not a valid JSON. Make sure it does not have a comma (,) on the last row of the object and all the keys and properties are wrapped in double quotes (").'

const SendAccountNotificationModal = (props) => {
  const { records } = props
  const defaultValue = JSON.stringify(
    DEFAULT_MULTI_LANGUAGE_OBJECT,
    null,
    '\t'
  ).replace('],\n\t"', '],\n\n\t"')

  const [title, setTitle] = useState(defaultValue)
  const [description, setDescription] = useState(defaultValue)
  const [modalOpened, setModalOpened] = useState(false)
  const notice = useNotice()

  const api = new ApiClient()

  const handleSubmit = async () => {
    setModalOpened(false)

    // @ts-ignore
    const cleanTitle = title.replaceAll('\t', '').replaceAll('\n', '')
    // @ts-ignore
    const cleanDescription = description.replaceAll('\t', '').replaceAll('\n', '')

    const titleIsValidJSON = isValidJson(cleanTitle)
    if (!titleIsValidJSON) {
      notice({ message: NOT_VALID_JSON_ERROR, type: 'error' })
      return
    }

    const descriptionIsValidJSON = isValidJson(cleanDescription)
    if (!descriptionIsValidJSON) {
      notice({ message: NOT_VALID_JSON_ERROR, type: 'error' })
      return
    }

    try {
      const payload = {
        title: JSON.parse(cleanTitle),
        description: JSON.parse(cleanDescription)
      }

      const response = await api.bulkAction({
        resourceId: 'accounts',
        actionName: 'sendNotification',
        recordIds: records.map((record) => record.id),
        data: payload
      })

      const result = response.data
      if (result.notice.type !== 'success') {
        notice({ message: result.notice.message, type: 'error' })
        return
      }

      notice({ message: result.notice.message, type: 'success' })
      // @ts-ignore
      location.reload()
    } catch (error) {
      notice({
        message: `There was a problem while trying to send notification: ${error}`,
        type: 'error',
      })
    }
  }

  return (
    <Box>
      <p>You are sending push notifications to {records.length} account(s)</p>
      <p style={{ marginBottom: 24, marginTop: 4 }}>
        {records.map((record, index) => {
          return (
            <Fragment key={index}>
              <Link
                blank
                size="lg"
                href={`/admin/resources/accounts/records/${record.id}/show`}
              >
                {record.title}
              </Link>
              {index < records.length - 1 ? ',' : ''}
            </Fragment>
          )
        })}
      </p>
      <p style={{ marginBottom: 24 }}>
        Make sure you provide a name and a description for all the available
        languages. This will help users to have a friendly user experience.
      </p>
      <Label>Title</Label>
      <TextArea
        value={title}
        rows={10}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter title"
        width="100%"
      />
      <Label style={{ marginTop: 24 }}>Description</Label>
      <TextArea
        value={description}
        rows={10}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter description"
        width="100%"
      />
      {modalOpened && (
        <Modal
          buttons={[
            {
              label: 'Cancel',
            },
            {
              label: 'Send',
              variant: 'primary',
              onClick: handleSubmit,
            },
          ]}
          icon="AlertTriangle"
          label="Warning"
          onClose={() => {
            setModalOpened(false)
          }}
          onOverlayClick={() => {
            setModalOpened(false)
          }}
          title="Do you really want to send this push notification?"
          subTitle="The push notification will be sent to the user(s) if they have enabled push notifications from the app."
          variant="primary"
        />
      )}
      <Button
        onClick={() => {
          setModalOpened(true)
        }}
        variant="primary"
        marginTop="20px"
      >
        Submit
      </Button>
    </Box>
  )
}

export default SendAccountNotificationModal


function isValidJson(str) {
  try {
    const parsed = JSON.parse(str);
    // Check if the parsed value is an object and not null
    return typeof parsed === 'object' && parsed !== null;
  } catch (e) {
    return false;
  }
}
