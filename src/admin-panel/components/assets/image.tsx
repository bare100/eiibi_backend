import React from 'react'

const AssetImage = ({ where, record }) => {
  const imageSize = where === 'list' ? 50 : 200

  if (!record.params.path) {
    return <span>Not set</span>
  }

  return (
    <img
      src={`/assets/${record.params.path}`}
      alt={record.params.path}
      style={{ width: imageSize, height: imageSize, borderRadius: 4 }}
    />
  )
}

export default AssetImage
