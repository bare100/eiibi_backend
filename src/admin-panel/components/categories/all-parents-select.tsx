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
}

const AllCategoriesSelect: React.FC<EditPropertyProps> = ({ property, record, onChange }) => {
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)

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
          (category) => !category.params.parentCategoryId
        )

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
      <Select
        value={selectedCategory}
        options={categories}
        isLoading={loading}
        onChange={(selected) => {
          setSelectedCategory(selected)
          onChange(property.name, selected.value)
        }}
        placeholder="Select a Category"
      />
    </div>

  )
}

export default AllCategoriesSelect
