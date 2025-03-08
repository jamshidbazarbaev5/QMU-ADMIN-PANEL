import { useState, useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { getAuthHeader } from '../api/api'

interface DepartmentTranslation {
  name: string
  slug?: string
  description: string
}

interface Department {
  id: number
  faculty: number
  translations: {
    [key: string]: DepartmentTranslation
  }
}

const translatedFields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
  { name: 'description', label: 'Description', type: 'richtext' as const, required: true },
]

export function DepartmentPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const navigate = useNavigate()
  const currentLanguage = useLanguage()

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`https://debttracker.uz/menus/department/`)
      if (!response.ok) throw new Error('Failed to fetch departments')
      const data = await response.json()
      console.log('Fetched departments:', data)
      setDepartments(data)
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [currentLanguage])

  const handleEdit = (department: Department) => {
    navigate(`/departments/${department.translations[currentLanguage].slug}/edit`)
  }

  const columns = [
    { 
      header: 'Name',
      accessor: 'translations',
      cell: (item: Department) => item.translations[currentLanguage]?.name
    },
    { 
      header: 'Description',
      accessor: 'translations',
      cell: (item: Department) =>  <div 
      className="max-w-md truncate"
      dangerouslySetInnerHTML={{ 
        __html: item.translations[currentLanguage]?.description || '-'
      }}
    />
    },
  ]

  return (
    <div className="p-6 mt-[50px]">
      <PageHeader
        title="Departments"
        createButtonLabel="Add Department"
        onCreateClick={() => navigate('/departments/create')}
      />

      <DataTable
        data={departments}
        columns={columns}
        currentLanguage={currentLanguage}
        actions={(item: Department) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                handleEdit(item)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                // handleDelete(item)
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