import { useState, useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { fetchWithAuth, getAuthHeader } from '../api/api'


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




export function DepartmentPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const navigate = useNavigate()
  const currentLanguage = useLanguage()

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`https://karsu.uz/api/menus/department/`)
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

  const getAvailableSlug = (translations: { [key: string]: DepartmentTranslation }) => {
    // Try to get slug from any available translation
    for (const lang of ['en', 'ru', 'uz', 'kk']) {
      if (translations[lang]?.slug) {
        return translations[lang].slug;
      }
    }
    return null;
  }

  const handleEdit = (department: Department) => {
    const slug = getAvailableSlug(department.translations);
    if (!slug) {
      console.error('No available translation slug found');
      return;
    }
    navigate(`/karsu-admin-panel/departments/${slug}/edit`);
  }

  const handleDelete = async (department: Department) => {
    const slug = getAvailableSlug(department.translations);
    if (!slug) {
      console.error('No available translation slug found');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this department?')) {
      return;
    }

    try {
      await fetchWithAuth(`https://karsu.uz/api/menus/department/${slug}/`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      await fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
    }
  }

  const columns = [
    { 
      header: 'Name',
      accessor: 'translations',
      cell: (item: Department) => item.translations['kk']?.name
    },
    { 
      header: 'Description',
      accessor: 'translations',
      cell: (item: Department) =>  <div 
      className="max-w-md truncate"
      dangerouslySetInnerHTML={{ 
        __html: item.translations['kk']?.description || '-'
      }}
    />
    },
  ]

  return (
    <div className="p-6 mt-[50px]">
      <PageHeader
        title="Departments"
        createButtonLabel="Add Department"
        onCreateClick={() => navigate('/karsu-admin-panel/departments/create')}
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