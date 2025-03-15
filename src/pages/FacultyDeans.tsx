import { useState, useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'

interface FacultyDean {
  id: number
  position: number
  faculty: number
  phone_number: string
  email: string
  main_image: string
  translations: {
    [key: string]: {
      full_name: string
      biography: string
    }
  }
}

interface Faculty {
  id: number
  translations: {
    [key: string]: {
      name: string
    }
  }
}

export function FacultyDeansPage() {
  const [deans, setDeans] = useState<FacultyDean[]>([])
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const currentLanguage = useLanguage()
  const navigate = useNavigate()

  const fetchDeans = async () => {
    try {
      const response = await fetch(`https://karsu.uz/api/menus/admin/`)
      if (!response.ok) throw new Error('Failed to fetch deans')
      const data = await response.json()
      // Filter to only show faculty deans
      const facultyDeans = Array.isArray(data) ? 
        data.filter(admin => admin.faculty && !admin.department && !admin.agency) : 
        []
      setDeans(facultyDeans)
    } catch (error) {
      console.error('Error fetching deans:', error)
    }
  }

  const fetchFaculties = async () => {
    try {
      const response = await fetch(`https://karsu.uz/api/menus/faculty/`)
      if (!response.ok) throw new Error('Failed to fetch faculties')
      const data = await response.json()
      setFaculties(data)
    } catch (error) {
      console.error('Error fetching faculties:', error)
    }
  }

  const handleDelete = async (dean: FacultyDean) => {
    if (!window.confirm('Are you sure you want to delete this dean?')) return

    try {
      const response = await fetch(`https://karsu.uz/api/menus/admin/${dean.id}/`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete dean')
      
      // Refresh the deans list after successful deletion
      fetchDeans()
    } catch (error) {
      console.error('Error deleting dean:', error)
      alert('Failed to delete dean')
    }
  }

  useEffect(() => {
    fetchDeans()
    fetchFaculties()
  }, [])

  const getFacultyName = (facultyId: number) => {
    const faculty = faculties.find(f => f.id === facultyId)
    return faculty?.translations[currentLanguage]?.name || `Faculty ${facultyId}`
  }

  const columns = [
    { 
      header: 'Full Name',
      accessor: 'translations',
      cell: (item: FacultyDean) => item.translations[currentLanguage]?.full_name || '-'
    },
    {
      header: 'Faculty',
      accessor: 'faculty',
      cell: (item: FacultyDean) => getFacultyName(item.faculty)
    },
    {
      header: 'Email',
      accessor: 'email'
    },
    {
      header: 'Phone',
      accessor: 'phone_number'
    },
    {
      header: 'Image',
      accessor: 'main_image',
      cell: (item: FacultyDean) => (
        <img 
          src={item.main_image} 
          alt="Dean"
          className="w-10 h-10 rounded-full object-cover"
        />
      )
    }
  ]

  return (
    <div className="p-6 mt-[50px]">
      <PageHeader
        title="Faculty Deans"
        createButtonLabel="Add Dean"
        onCreateClick={() => {
          navigate('/karsu-admin-panel/faculty-deans/new')
        }}
      />

      <DataTable
        data={deans}
        columns={columns}
        currentLanguage={currentLanguage}
        actions={(item: FacultyDean) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/karsu-admin-panel/faculty-deans/${item.id}/edit`)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(item)
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        )}
      />
    </div>
  )
}