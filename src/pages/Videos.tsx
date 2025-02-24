import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '../helpers/DataTable'
import { PageHeader } from '../helpers/PageHeader'
import { useLanguage } from '../hooks/useLanguage'

export function Videos() {
  const navigate = useNavigate()
  const [videos, setVideos] = useState([])
  const [, setLoading] = useState(true)
  const currentLanguage = useLanguage()
  const token = localStorage.getItem('accessToken')

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await fetch(`https://debttracker.uz/${currentLanguage}/publications/videos/`, {
        headers: {
          'Authorization': `Token ${token}`,
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setVideos(data || [])
    } catch (error) {
      console.error('Error fetching videos:', error)
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [currentLanguage])

  const columns = [
    {
      header: 'Title',
      accessor: `translations.${currentLanguage}.title`,
      cell: (item: any) => item.translations[currentLanguage]?.title || '-'
    },
    {
      header: 'Video URL',
      accessor: 'video_url',
      cell: (item: any) => (
        <a 
          href={item.video_url} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 hover:text-blue-800"
        >
          View Video
        </a>
      )
    },
    {
      header: 'Date',
      accessor: 'date_posted',
      cell: (item: any) => new Date(item.date_posted).toLocaleDateString()
    }
  ]

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this video?')) return

    try {
      const response = await fetch(`https://debttracker.uz/${currentLanguage}/publications/videos/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
        }
      })

      if (response.ok) {
        fetchVideos()
      }
    } catch (error) {
      console.error('Error deleting video:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 mt-[50px]">
      <PageHeader
        title="Videos"
        createButtonLabel="Create Video"
        onCreateClick={() => navigate('/videos/new')}
      />

      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={videos}
          columns={columns}
          onRowClick={(item) => navigate(`/videos/${item.id}/edit`)}
          actions={(item) => (
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/videos/${item.id}/edit`)
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(item.id)
                }}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          )}
        />
      </div>
    </div>
  )
}