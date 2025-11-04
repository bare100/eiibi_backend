import React, { useState } from 'react'
import { DEFAULT_MULTI_LANGUAGE_OBJECT } from '../../constants'
// @ts-ignore
import { Input } from '@adminjs/design-system';

const styles = {
  label: {
    display: 'block',
    fontFamily: 'Roboto, sans-serif',
    fontSize: 12,
    lineHeight: '16px',
    marginBottom: 8,
  },
  translationItemRoot: {
    marginLeft: 24,
    marginBottom: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  infoRoot: {
    fontSize: 12,
    marginBottom: 8,
    display: 'block',
    padding: 16,
    background: 'rgb(137, 138, 154, 0.1)',
    borderRadius: 4,
    margin: '12px 0',
  }
}

const TranslatedValue = ({ property, record, onChange }) => {
  const detailsInitialValue = Object.keys(record.params)
    .filter((key) => key.startsWith(`${property.name}.`))
    .reduce((obj, key) => {
      const newKey = key.replace(`${property.name}.`, '') // Remove "details." prefix
      obj[newKey] = record.params[key]
      return obj
    }, {})

  const [details, setDetails] = useState(Object.keys(detailsInitialValue).length ? detailsInitialValue : DEFAULT_MULTI_LANGUAGE_OBJECT)

  const handleChange = (e, lang) => {
    let value = e.target.value

    const newValue = { ...details, [lang]: value }
    setDetails(newValue)
    onChange(property.name, newValue)
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={property.name} style={styles.label}>
        <span style={{ textTransform: 'capitalize' }}> {property.name}</span>
      </label>
      <span style={styles.infoRoot}>This value is translated in multiple languages. Make sure to check all of them</span>
      <div>
        {Object.keys(details).map((key, index) => {
          return <div key={index} style={styles.translationItemRoot}>
            <div style={{ display: 'flex', minWidth: '15%', width: 'auto', alignItems: 'center', justifyContent: 'end' }}>
              <span>{key}</span>
            </div>
            <Input value={details[key]} onChange={(e) => handleChange(e, key)} />
          </div>
        })}
      </div>
    </div>
  )
}

export default TranslatedValue
