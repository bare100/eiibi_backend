import React from 'react'
// @ts-ignore
import { Box, Link, Label } from '@adminjs/design-system'

const PostCategoryCard = (params) => {
  const { record, property, where } = params
  const isOnList = where === 'list'

  const isMainCategory = property.name === 'mainCategoryId'
  const category =
    record.populated[isMainCategory ? 'mainCategoryId' : 'subCategoryId']

  return (
    <Box>
      {!isOnList && <Label style={{ marginBottom: 4, color: 'rgb(137, 138, 154)' }}>{property.name}</Label>}
      <Link href={`/admin/resources/categories/records/${category.id}/show`}>
        {category.title.en}
      </Link>
      {!isOnList && <div style={{ marginBottom: 24 }} />}

    </Box>
  )
}

export default PostCategoryCard
