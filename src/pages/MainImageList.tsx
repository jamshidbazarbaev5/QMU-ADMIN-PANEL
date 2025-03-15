import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { DataTable } from '../helpers/DataTable'
import { PageHeader } from '../helpers/PageHeader'
import { fetchWithAuth, getAuthHeader } from '../api/api'

interface MainImage {
  id: number
  main_img: string
  is_active: boolean
  created_at: string
}

interface Column {
  header: string
  accessor: string
  cell?: (item: any) => React.ReactNode
}

export function MainImageList() {
  const [images, setImages] = useState<MainImage[]>([])
  const navigate = useNavigate()

  const fetchImages = async () => {
    try {
      const response = await fetchWithAuth('https://karsu.uz/api/publications/images/', {
        headers: getAuthHeader()
      })
      if (response.ok) {
        const data = await response.json()
        setImages(data)
      }
    } catch (error) {
      console.error('Error fetching images:', error)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [])

  const handleDelete = async (image: MainImage) => {
    try {
        const response = await fetchWithAuth(`https://karsu.uz/api/publications/images/${image.id}/`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })
      
      if (response.ok) {
        fetchImages()
      }
    } catch (error) {
      console.error('Error deleting image:', error)
    }
  }

  const columns: Column[] = [
    {
      header: 'ID',
      accessor: 'id',
      cell: (item: MainImage) => item.id
    },
    {
      header: 'Image',
      accessor: 'main_img',
      cell: (item: MainImage) => (
        <img 
          src={item.main_img} 
          alt="Main" 
          className="w-20 h-20 object-cover rounded"
        />
      )
    },
    {
      header: 'Status',
      accessor: 'is_active',
      cell: (item: MainImage) => (
        <span className={`px-2 py-1 rounded-full text-sm ${
          item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {item.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    
  ]

  const renderActions = (item: MainImage) => (
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation()
          navigate(`/karsu-admin-panel/main-images/${item.id}/edit`)
        }}
        className="flex items-center gap-2 px-3 py-1 text-[#6C5DD3] hover:bg-[#6C5DD3]/10 rounded-md transition-colors"
      >
        <Pencil className="h-4 w-4" />
        Edit
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleDelete(item)
        }}
        className="flex items-center gap-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    </div>
  )

  return (
    <div className="container mx-auto p-6">
      <PageHeader
        title="Main Images"
        createButtonLabel="Add New Image"
        onCreateClick={() => navigate('/karsu-admin-panel/main-images/new')}
      />

      <DataTable
        data={images}
        columns={columns}
        actions={renderActions}
      />
    </div>
  )
}