import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../helpers/PageHeader'
import { createQuantity, updateQuantity } from '../api/api'

interface QuantityFormProps {
  initialData?: any
  isEditing?: boolean
}

export function QuantityForm({ isEditing }: QuantityFormProps) {
  const navigate = useNavigate()
  const { id } = useParams()
  const token = localStorage.getItem('accessToken')
  const [title, setTitle] = useState('')
  const [quantity, setQuantity] = useState('')
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isEditing && id) {
      fetchQuantity()
    }
  }, [id, isEditing])

  const fetchQuantity = async () => {
    try {
      const response = await fetch(`https://debttracker.uz/publications/quantities/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setTitle(data.title)
      setQuantity(data.quantity.toString())
    } catch (error) {
      console.error('Error:', error)
      navigate('/quantities')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted with data:', { title, quantity })

    if (!token) {
      navigate('/login')
      return
    }

    try {
      setIsSubmitting(true)

      if (isEditing && id) {
        await updateQuantity(id, {
          title,
          quantity: parseInt(quantity),
        })
      } else {
        try {
          const newQuantity = await createQuantity({
            title,
            quantity: parseInt(quantity),
          })
          console.log('Created new quantity:', newQuantity)
        } catch (error:any) {
          if (error.message.includes('Received list instead of created object')) {
            // The quantity might have been created successfully despite the response format error
            console.warn('Quantity may have been created but received unexpected response format')
          } else {
            throw error // Re-throw other errors
          }
        }
      }

      navigate('/quantities')
    } catch (error:any) {
      console.error('Error:', error)
      if (error.response?.status === 401) {
        console.log('Token expired, redirecting to login')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        navigate('/login')
        return
      }
      alert(error.message || 'Failed to save quantity. Please check console for details.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <PageHeader
        title={isEditing ? 'Edit Quantity' : 'Create Quantity'}
        createButtonLabel="Back to Quantities"
        onCreateClick={() => navigate('/quantities')}
      />

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 bg-[#6C5DD3] text-white rounded-lg hover:bg-[#5b4eb8] transition-colors disabled:opacity-50"
          >
            {isSubmitting 
              ? 'Saving...' 
              : isEditing 
                ? 'Update Quantity' 
                : 'Create Quantity'
            }
          </button>
        </form>
      </div>
    </div>
  )
}