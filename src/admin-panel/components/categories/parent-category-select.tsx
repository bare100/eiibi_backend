import React, { useEffect, useState } from 'react'
// @ts-ignore
import { Select } from '@adminjs/design-system'
// @ts-ignore
import { ApiClient, EditPropertyProps } from 'adminjs'

const api = new ApiClient()

const styles = {
  label: {
    display: 'block',
    fontFamily: 'Roboto, sans-serif',
    fontSize: 12,
    lineHeight: '16px',
    marginBottom: 8,
  },
  childTitle: {
    display: 'inline-flex',
    fontSize: 12,
    lineHeight: '16px',
    marginBottom: 8,
    background: 'rgb(137, 138, 154, 0.1)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    textDecoration: 'none',
    maxWidth: 'fit-content'
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

const CustomCategorySelect: React.FC<EditPropertyProps> = ({ property, record, onChange }) => {
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedCategory, setSelectedCategory] = useState(null)
  const [childrenCategories, setChildrenCategories] = useState([])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        let page = 1
        let allCategories = []
        let hasMore = true

        while (hasMore) {
          const queryString = new URLSearchParams({
            page: page.toString(),
          }).toString()

          // Fetch categories
          const { data } = await api.resourceAction({
            resourceId: 'categories',
            actionName: 'list',
            params: {
              perPage: 500,
              page,
            },
            query: queryString, // Pass as a string
          })

          allCategories = [...allCategories, ...data.records]

          if (data.records.length < 500) {
            hasMore = false
          } else {
            page++
          }
        }

        const filteredCategories = allCategories.filter(
          (category) => category.id !== record.id && !category.params.parentCategoryId
        )
        const childrenCategories = allCategories.filter(
          (category) => category.params.parentCategoryId === record.id
        )

        if (childrenCategories?.length) {
          setChildrenCategories(childrenCategories)
          return
        }

        const categoryOptions = filteredCategories.map((category) => ({
          value: category.id,
          label: category.title['en'] || `Category ID: ${category.id}`,
        }))

        setCategories(categoryOptions)
        if (record?.params?.[property.name]) {
          const selected = categoryOptions.find(
            (category) => category.value === record?.params?.[property.name]
          )
          setSelectedCategory(selected || null)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return (
    <div style={{ marginTop: 16 }}>
      <label htmlFor={property.name} style={styles.label}>
        <span style={{ textTransform: 'capitalize' }}>Parent Category</span>
      </label>
      {childrenCategories.length ? (
        <div>
          <p style={styles.infoRoot}>This category has children categories. It cannot have a parent category.</p>
          <div style={{ marginTop: 16, marginBottom: 8 }}>Children of this category:</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {childrenCategories.map((category) => (
              <a
                href={`/admin/resources/categories/records/${category.id}/show`}
                key={category.id}
                style={styles.childTitle}
              >
                <span >
                  {category.title['en'] ?? category.title[Object.keys(category.title)[0]]}
                </span>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <Select
          value={selectedCategory}
          options={categories}
          isLoading={loading}
          onChange={(selected) => {
            setSelectedCategory(selected)
            onChange(property.name, selected.value)
          }}
          placeholder="Select a Parent Category"
        />
      )}
    </div>
  )
}

export default CustomCategorySelect
