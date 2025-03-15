import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../helpers/PageHeader'
import { createQuantity, fetchWithAuth, getAuthHeader, updateQuantity } from '../api/api'
import { TranslatedForm } from '../helpers/TranslatedForm'

interface QuantityFormProps {
  initialData?: any
  isEditing?: boolean
}

export function QuantityForm({ isEditing }: QuantityFormProps) {
  const navigate = useNavigate()
  const { id } = useParams()
  const token = localStorage.getItem('accessToken')
  const [isLoading, setIsLoading] = useState(isEditing)
  const [formData, setFormData] = useState({
    en: { title: '', quantity: '' },
    ru: { title: '', quantity: '' },
    uz: { title: '', quantity: '' },
    kk: { title: '', quantity: '' }
  })

  useEffect(() => {
    if (isEditing && id) {
      fetchQuantity()
    } else {
      setIsLoading(false)
    }
  }, [id, isEditing])

  const fetchQuantity = async () => {
    if (!id) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetchWithAuth(`https://karsu.uz/api/publications/quantities/${id}`, {
        headers: {
          ...getAuthHeader()
        }
      })
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      
      // Update to use translations from the API response
      setFormData({
        en: { title: data.translations.en.title, quantity: data.quantity.toString() },
        ru: { title: data.translations.ru.title, quantity: data.quantity.toString() },
        uz: { title: data.translations.uz.title, quantity: data.quantity.toString() },
        kk: { title: data.translations.kk.title, quantity: data.quantity.toString() }
      })
    } catch (error) {
      console.error('Error:', error)
      navigate('/karsu-admin-panel/quantities')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: any) => {
    if (!token) {
      navigate('/karsu-admin-panel/login')
      return
    }

    try {
      const translations = {
        en: { title: data.en.title },
        ru: { title: data.ru.title },
        uz: { title: data.uz.title },
        kk: { title: data.kk.title }
      }

      const submitData = {
        translations,
        quantity: parseInt(data.en.quantity), // quantity is shared across languages
      }

      if (isEditing && id) {
        await updateQuantity(id, submitData)
      } else {
        await createQuantity(submitData)
      }

      navigate('/karsu-admin-panel/quantities')
    } catch (error: any) {
      console.error('Error:', error)
      if (error.response?.status === 401) {
        console.log('Token expired, redirecting to login')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        navigate('/karsu-admin-panel/login')
        return
      }
      alert(error.message || 'Failed to save quantity. Please check console for details.')
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  const fields = [
    {
      name: 'title',
      label: 'Title',
      type: 'text' as const,
      required: true
    },
    {
      name: 'quantity',
      label: 'Quantity',
      type: 'text' as const,
      required: true
    }
  ]

  return (
    <div className="container mx-auto p-6">
      <PageHeader
        title={isEditing ? 'Edit Quantity' : 'Create Quantity'}
        createButtonLabel="Back to Quantities"
        onCreateClick={() => navigate('/karsu-admin-panel/quantities')}
      />

      <div className="bg-white rounded-lg shadow p-6">
        <TranslatedForm
          fields={fields}
          languages={['en', 'ru', 'uz', 'kk']}
          onSubmit={handleSubmit}
          initialData={formData}
          isLoading={isLoading}
          sharedFields={['quantity']}
        />
      </div>
    </div>
  )
}