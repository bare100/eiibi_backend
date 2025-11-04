import React from 'react'

const styles = {
  container: {
    padding: '10px',
    borderRadius: '5px',
    backgroundColor: '#f7f7f9',
    fontFamily: 'monospace',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#333',
  },
  key: {
    color: '#d6336c',
    marginRight: '5px',
  },
  value: {
    color: '#007bff',
  },
  nested: {
    paddingLeft: '20px',
    margin: '5px 0',
    borderLeft: '2px solid #e2e3e5',
  },
  label: {
    display: 'block',
    fontFamily: 'Roboto, sans-serif',
    fontSize: 12,
    lineHeight: '16px',
    color: 'rgb(137, 138, 154)',
    marginBottom: 4,
    fontWeight: 300,
  },
}

const JsonRenderer = ({ data }) => {
  if (typeof data === 'object' && data !== null) {
    return (
      <ul style={styles.nested}>
        {Object.entries(data).map(([key, value]) => (
          <li key={key}>
            <span style={styles.key}>{key}:</span> <JsonRenderer data={value} />
          </li>
        ))}
      </ul>
    )
  } else {
    return <span style={styles.value}>{String(data)}</span>
  }
}

const JsonbField = ({ property, record }) => {
  const jsonData = record.params[property.name] || {}

  if (typeof jsonData === 'string') {
    return (
      <div style={{ marginBottom: 24 }}>
        <label htmlFor={property.name} style={styles.label}>
          <span style={{ textTransform: 'capitalize' }}> {property.name}</span>
        </label>
        <span>{jsonData}</span>
      </div>
    )
  }

  const details = Object.keys(record.params)
    .filter((key) => key.startsWith(`${property.name}.`))
    .reduce((obj, key) => {
      const newKey = key.replace(`${property.name}.`, '') // Remove "details." prefix
      obj[newKey] = record.params[key]
      return obj
    }, {})

  return (
    <div style={{ marginBottom: 24 }}>
      <label style={styles.label}>
        <span style={{ textTransform: 'capitalize' }}> {property.name}</span>
      </label>
      <div style={styles.container}>
        <JsonRenderer data={details} />
      </div>
    </div>
  )
}

export default JsonbField
