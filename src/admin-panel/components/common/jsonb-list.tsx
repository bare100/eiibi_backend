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
}

// If the resource is inside this array, we are only displaying the english
// version from the json object
const ONLY_ENGLISH_RESOURCES = ['notifications', 'currencies', 'exchange_rates', 'categories', 'notifications_contents']

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

const JsonbFieldList = ({ property, record }) => {
  const jsonData = record.params[property.name] || {}

  if (typeof jsonData === 'string') {
    return (
      <span>{jsonData}</span>
    )
  }
  const onlyEnglish = ONLY_ENGLISH_RESOURCES.indexOf(property.resourceId) !== -1

  const details = Object.keys(record.params)
    .filter((key) => key.startsWith(`${property.name}.`))
    .reduce((obj, key) => {
      const newKey = key.replace(`${property.name}.`, '')
      if (onlyEnglish && newKey !== 'en' && newKey !== 'USD') {
        return obj
      }

      obj[newKey] = record.params[key]
      return obj
    }, {})

  return (
    <div style={styles.container}>
      <JsonRenderer data={details} />
    </div>
  )
}

export default JsonbFieldList
