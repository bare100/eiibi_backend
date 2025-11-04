import React from 'react'

const CustomCategoryIconList = ({ record }) => {
  const remoteUrl = record.params.remoteIconUrl
  if (!remoteUrl) {
    return <span>Not set</span>
  }

  return <div><img src={remoteUrl} alt={record.params['name.en']} style={{ width: '50px', height: '50px' }} /></div>
}

export default CustomCategoryIconList