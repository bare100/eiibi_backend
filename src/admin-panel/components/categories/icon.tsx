import React from 'react'

const CategoryUploadedIcon = ({ record }) => {
  const existingAsset = record.populated?.assetId?.params

  if (!existingAsset) {
    return <span>Not set</span>
  }

  return (
    <img
      src={`/assets/${existingAsset.path}`}
      alt={existingAsset.path}
      style={{ width: 50, height: 50, borderRadius: 4 }}
    />
  )
}

export default CategoryUploadedIcon
