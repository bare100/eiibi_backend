import React, { useEffect, useState } from 'react'
// @ts-ignore
import { Box, Text } from '@adminjs/design-system'
// @ts-ignore
import { ApiClient } from 'adminjs'

const api = new ApiClient()

const styles = {
  label: {
    display: 'block',
    fontFamily: 'Roboto, sans-serif',
    fontSize: 12,
    lineHeight: '16px',
    marginBottom: 8,
  },
}

const ParentCategoryNameWithLabel = ({ property, record }) => {
  const [parentCategory, setParentCategory] = useState(null)
  const [parentCategoryId, setParentCategoryId] = useState('')
  const parentId = record?.params?.parentCategoryId

  useEffect(() => {
    if (!parentId) return

    const fetchParentCategory = async () => {
      try {
        const { data } = await api.recordAction({
          resourceId: 'categories',
          recordId: parentId,
          actionName: 'show',
        })

        if (data && data.record) {
          setParentCategory(data.record.title['en'] || `Category ID: ${parentId}`)
          setParentCategoryId(data.record.id)
        } else {
          setParentCategory(`Unknown Category (ID: ${parentId})`)
        }
      } catch (error) {
        console.error('Error fetching parent category:', error)
        setParentCategory(`Unknown Category (ID: ${parentId})`)
      }
    }

    fetchParentCategory()
  }, [parentId])

  return (
    <Box style={{ marginBottom: 16 }}>
      <label htmlFor={property.name} style={styles.label}>
        <span style={{ textTransform: 'capitalize' }}>Parent Category</span>
      </label>
      <Text>
        <a style={{ color: 'rgb(0, 123, 255)', textDecoration: 'none' }} href={parentCategory ? `/admin/resources/categories/records/${parentCategoryId}/show` : '#'}>
          {parentCategory || '-'}
        </a>
      </Text>
    </Box>
  )
}

export default ParentCategoryNameWithLabel
