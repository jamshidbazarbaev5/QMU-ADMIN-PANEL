import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Loader2, Trash2 } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { Card } from '../components/ui/card'
import { fetchWithAuth, getAuthHeader } from '../api/api'

interface Feedback {
  id: number
  full_name: string
  email: string
  message: string
}

export default function FeedbackList() {
  const navigate = useNavigate()
  const currentLanguage = useLanguage()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchFeedbacks()
  }, [currentLanguage])

  const fetchFeedbacks = async () => {
    try {
      setIsLoading(true)
      const response = await fetchWithAuth(`https://debttracker.uz/feedback/`,
        {
          headers: getAuthHeader()
        }
      )
      if (!response.ok) throw new Error('Failed to fetch feedbacks')
      const data = await response.json()
      setFeedbacks(data)
    } catch (error) {
      console.error('Error fetching feedbacks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteFeedback = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return

    try {
      const response = await fetchWithAuth(
        `https://debttracker.uz/feedback/${id}/`,
        {
          method: 'DELETE',
          headers: getAuthHeader()
        }
      )
      if (!response.ok) throw new Error('Failed to delete feedback')
      // Refresh the feedbacks list
      fetchFeedbacks()
    } catch (error) {
      console.error('Error deleting feedback:', error)
    }
  }

  const columns = [
    {
      header: 'Full Name',
      accessor: 'full_name',
    },
    {
      header: 'Email',
      accessor: 'email',
    },
    {
      header: 'Message',
      accessor: 'message',
      cell: (item: Feedback) => (
        <div className="max-w-md truncate">{item.message}</div>
      ),
    },
  ]

  const renderActions = (item: Feedback) => (
    <div className="flex gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation()
          navigate(`/feedback/edit/${item.id}`)
        }}
        className="p-2 hover:bg-gray-100 rounded-full"
      >
        <Pencil className="h-4 w-4 text-gray-600" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          deleteFeedback(item.id)
        }}
        className="p-2 hover:bg-gray-100 rounded-full"
      >
        <Trash2 className="h-4 w-4 text-red-600" />
      </button>
    </div>
  )

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6C5DD3]" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 mt-[50px]">
      <PageHeader
        title="Feedback Management"
        createButtonLabel="Create Feedback"
        onCreateClick={() => navigate('/feedback/create')}
      />
      <Card>
        <DataTable
          data={feedbacks}
          columns={columns}
          actions={renderActions}
          onRowClick={(item) => navigate(`/feedback/edit/${item.id}`)}
          currentLanguage={currentLanguage}
        />
      </Card>
    </div>
  )
}