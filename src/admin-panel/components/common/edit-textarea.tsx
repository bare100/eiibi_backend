import React, { useState } from 'react'
import { DEFAULT_MULTI_LANGUAGE_OBJECT } from '../../constants'

const styles = {
  label: {
    display: 'block',
    fontFamily: 'Roboto, sans-serif',
    fontSize: 12,
    lineHeight: '16px',
    marginBottom: 8,
  },
}

const EditTextarea = ({ property, record, onChange }) => {
  const detailsInitialValue = Object.keys(record.params)
    .filter((key) => key.startsWith(`${property.name}.`))
    .reduce((obj, key) => {
      const newKey = key.replace(`${property.name}.`, '') // Remove "details." prefix
      obj[newKey] = record.params[key]
      return obj
    }, {})

  const [details, setDetails] = useState(Object.keys(detailsInitialValue).length ? detailsInitialValue : DEFAULT_MULTI_LANGUAGE_OBJECT)

  const handleChange = (e) => {
    let value = e.target.value
    try {
      value = JSON.parse(e.target.value)
    } catch (error) { }

    setDetails(value)
    onChange(property.name, value)
  }

  return (
    <div>
      <label htmlFor={property.name} style={styles.label}>
        <span style={{ textTransform: 'capitalize' }}> {property.name}</span>
      </label>
      <textarea
        name={property.name}
        value={JSON.stringify(details)}
        onChange={handleChange}
        style={{
          width: '100%',
          padding: '8px',
          boxSizing: 'border-box',
          minHeight: '80px',
          marginBottom: 16,
          border: '1px solid rgb(187, 195, 203)',
        }}
      />
    </div>
  )
}

export default EditTextarea
