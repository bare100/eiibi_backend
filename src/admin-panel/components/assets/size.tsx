import React from 'react'

const AssetSize = ({ record }) => {
  const size = record.params.size
  const megabytes = (size / (1024 * 1024)).toFixed(2)
  return (
    <span>{megabytes} MB</span>
  )
}

export default AssetSize