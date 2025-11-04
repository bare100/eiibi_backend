

import React, { useState } from 'react'

const styles = {
  label: {
    display: 'block',
    fontFamily: 'Roboto, sans-serif',
    fontSize: 12,
    lineHeight: '16px',
    marginBottom: 8,
  },
}

const SimpleInput = ({ property, record, onChange }) => {
  const [value, setValue] = useState(record.params[property.name])
  const handleChange = (e) => {
    let value = e.target.value
    try {
      value = JSON.parse(e.target.value)
    } catch (error) { }

    setValue(value)
    onChange(property.name, value)
  }

  return (
    <div>
      <label htmlFor={property.name} style={styles.label}>
        <span style={{ textTransform: 'capitalize' }}> {property.name}</span>
      </label>
      <input
        name={property.name}
        value={value}
        onChange={handleChange}
        style={{
          width: '100%',
          padding: '8px',
          boxSizing: 'border-box',
          marginBottom: 16,
          border: '1px solid rgb(187, 195, 203)',
        }}
      />
    </div>
  )
}

export default SimpleInput
