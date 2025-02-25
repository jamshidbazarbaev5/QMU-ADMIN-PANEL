import { useState, useEffect } from 'react'
import { PageHeader } from '../helpers/PageHeader'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { fetchWithAuth, getAuthHeader } from '../api/api';

interface PostFormProps {
  initialData?: any
  isEditing?: boolean
}
interface TranslatedField {
    name: string
    label: string
    type: 'text' | 'textarea' | 'richtext'
    required?: boolean
    editorConfig?: any
  }

export function PostForm({ initialData, isEditing }: PostFormProps) {
  const navigate = useNavigate()
  const { slug } = useParams()
  const currentLanguage = useLanguage()
  const token = localStorage.getItem('accessToken')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [selectedMenu, setSelectedMenu] = useState(initialData?.menu || '')
  const [selectedFooterMenu, setSelectedFooterMenu] = useState(initialData?.footer_menu || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [postData, setPostData] = useState(initialData)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      if (!isEditing || !slug) return
      if (!token) {
        console.error('No token found')
        navigate('/login')
        return
      }

      try {
        setIsLoading(true)
        const response = await fetchWithAuth(
          `https://debttracker.uz/en/publications/posts/${slug}/`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!response.ok) {
          if (response.status === 401) {
            console.error('Unauthorized access')
            navigate('/login')
            return
          }
          throw new Error('Failed to fetch post')
        }

        const data = await response.json()
        setPostData(data)
        setSelectedMenu(data.menu || '')
        setSelectedFooterMenu(data.footer_menu || '')
      } catch (error) {
        console.error('Error fetching post:', error)
        navigate('/posts')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPost()
  }, [slug, currentLanguage, isEditing, token, navigate])

  if (isLoading) {
    return <div className="container mx-auto p-6 mt-[50px]">Loading...</div>
  }

  const fields: TranslatedField[] = [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'richtext', required: true },
  ]

  const handleSubmit = async (translations: any) => {
    setErrorMessage(null)
    
    if (!token) {
      console.error('No token found')
      navigate('/login')
      return
    }

    try {
      setIsSubmitting(true)
      const formData = new FormData()
      if (selectedImage) {
        formData.append('main_image', selectedImage)
      }
      formData.append('menu', selectedMenu || '')
      formData.append('footer_menu', selectedFooterMenu || '')
      formData.append('translations', JSON.stringify(translations))

      const url = isEditing 
        ? `https://debttracker.uz/${currentLanguage}/publications/posts/${slug}/`
        : `https://debttracker.uz/${currentLanguage}/publications/posts/`
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        body: formData,
        headers: {
            ...getAuthHeader(),
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred' }))
        if (response.status === 401) {
          console.error('Unauthorized access')
          navigate('/login')
          return
        }
        setErrorMessage(errorData.detail || 'Failed to save post')
        throw new Error(errorData.detail || 'Failed to save post')
      }

      navigate('/posts')
    } catch (error) {
      console.error('Error saving post:', error)
      if (!errorMessage) {
        setErrorMessage('An error occurred while saving the post')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto p-6 mt-[50px]">
      <PageHeader
        title={isEditing ? 'Edit Post' : 'Create Post'}
        createButtonLabel="Back to Posts"
        onCreateClick={() => navigate('/posts')}
      />

      <div className="bg-white rounded-lg shadow p-6">
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {errorMessage}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Main Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#6C5DD3] file:text-white hover:file:bg-[#5b4eb8]"
          />
          {initialData?.main_image && (
            <img src={initialData.main_image} alt="Current" className="mt-2 h-32 object-cover rounded" />
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Header Menu
          </label>
          <select
            value={selectedMenu}
            onChange={(e) => setSelectedMenu(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          >
            <option value="">Not in Header Menu</option>
            <option value="1">Header Menu</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Footer Menu
          </label>
          <select
            value={selectedFooterMenu}
            onChange={(e) => setSelectedFooterMenu(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          >
            <option value="">Not in Footer Menu</option>
            <option value="2">Footer Menu</option>
          </select>
        </div>

        <TranslatedForm
          fields={fields}
          languages={['en', 'ru', 'uz', 'kk']}
          initialData={postData?.translations}
          onSubmit={handleSubmit}
          submitButton={
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 bg-[#6C5DD3] text-white rounded-lg hover:bg-[#5b4eb8] transition-colors disabled:opacity-50"
            >
              {isSubmitting 
                ? 'Saving...' 
                : isEditing 
                  ? 'Update Post' 
                  : 'Create Post'
              }
            </button>
          }
        />
      </div>
    </div>
  )
}