import { useState, useEffect } from 'react'
import { PageHeader } from '../helpers/PageHeader'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { fetchWithAuth } from '../api/api'

interface VideoFormProps {
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

export function VideoForm({ initialData, isEditing }: VideoFormProps) {
  const navigate = useNavigate()
  const { id } = useParams()
  const currentLanguage = useLanguage()
  const token = localStorage.getItem('accessToken')
  const [videoUrl, setVideoUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [videoData, setVideoData] = useState(initialData)
  const [isLoading, setIsLoading] = useState(isEditing)

  useEffect(() => {
    const fetchVideo = async () => {
      if (!isEditing || !id) return
      if (!token) {
        navigate('/login')
        return
      }

      try {
        setIsLoading(true)
        const response = await fetchWithAuth(
          `https://debttracker.uz/publications/videos/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch video: ${response.status}`)
        }

        const data = await response.json()
        setVideoData(data)
        setVideoUrl(data.video_url || '')
      } catch (error) {
        console.error('Error fetching video:', error)
        if ((error as any)?.response?.status === 403) {
          localStorage.removeItem('accessToken')
          navigate('/login')
        } else {
          navigate('/videos')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchVideo()
  }, [id, currentLanguage, isEditing, token, navigate])

  if (isLoading) {
    return <div className="container mx-auto p-6 mt-[50px]">Loading...</div>
  }

  const fields: TranslatedField[] = [
    { name: 'title', label: 'Title', type: 'text', required: true },
  ]

  function transformYouTubeUrl(url: string): string {
    try {
      const videoUrl = new URL(url);
      
      // Handle youtube.com/watch?v= URLs
      if (videoUrl.searchParams.has('v')) {
        const videoId = videoUrl.searchParams.get('v');
        return `https://www.youtube.com/embed/${videoId}`;
      }
      
      // Handle youtu.be/ URLs
      if (videoUrl.hostname === 'youtu.be') {
        const videoId = videoUrl.pathname.slice(1);
        return `https://www.youtube.com/embed/${videoId}`;
      }
      
      // If it's already an embed URL, return as is
      if (videoUrl.pathname.includes('/embed/')) {
        return url;
      }
      
      return url; // Return original if no transformation needed
    } catch {
      return url; // Return original if URL parsing fails
    }
  }

  const handleSubmit = async (translations: any) => {
    console.log('Starting submission with translations:', translations)
    console.log('Current video URL:', videoUrl)
    
    if (!token) {
      console.log('No token found, redirecting to login')
      navigate('/login')
      return
    }

    try {
      setIsSubmitting(true)
      const transformedUrl = transformYouTubeUrl(videoUrl)
      console.log('Transformed URL:', transformedUrl)

      const payload = {
        video_url: transformedUrl,
        translations: translations
      }
      console.log('Submitting payload:', payload)

      const url = isEditing 
        ? `https://debttracker.uz/publications/videos/${id}`
        : `https://debttracker.uz/publications/videos`
      console.log('Submitting to URL:', url)
      
      const response = await fetchWithAuth(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response body:', errorText)
        throw new Error(`Failed to save video: ${response.status}`)
      }

      navigate('/videos')
    } catch (error) {
      console.error('Detailed error:', error)
      if ((error as any)?.response?.status === 403) {
        console.log('403 error detected, clearing token')
        localStorage.removeItem('accessToken')
        navigate('/login')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto p-6 mt-[50px]">
      <PageHeader
        title={isEditing ? 'Edit Video' : 'Create Video'}
        createButtonLabel="Back to Videos"
        onCreateClick={() => navigate('/videos')}
      />

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Video URL
          </label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            placeholder="https://www.youtube.com/watch?v=..."
            required
          />
        </div>

        <TranslatedForm
          fields={fields}
          languages={['en', 'ru', 'uz', 'kk']}
          initialData={videoData?.translations}
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
                  ? 'Update Video' 
                  : 'Create Video'
              }
            </button>
          }
        />
      </div>
    </div>
  )
}