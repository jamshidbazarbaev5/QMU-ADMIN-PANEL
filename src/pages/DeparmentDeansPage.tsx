import { useState, useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { fetchWithAuth } from '../api/api'

interface DepartmentDean {
  id: number
  position: number
  department: number
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

interface Department {
  id: number
  translations: {
    [key: string]: {
      name: string
    }
  }
}

export function DepartmentDeansPage() {
  const [deans, setDeans] = useState<DepartmentDean[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const currentLanguage = useLanguage()
  const navigate = useNavigate()

  const fetchDeans = async () => {
    try {
      const response = await fetch(`https://karsu.uz/api/menus/admin/`)
      if (!response.ok) throw new Error('Failed to fetch deans')
      const data = await response.json()
      // Filter to only show department deans
      const departmentDeans = Array.isArray(data) ? 
        data.filter(admin => admin.department && !admin.faculty && !admin.agency) : 
        []
      setDeans(departmentDeans)
    } catch (error) {
      console.error('Error fetching deans:', error)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`https://karsu.uz/api/menus/department/`)
      if (!response.ok) throw new Error('Failed to fetch departments')
      const data = await response.json()
      setDepartments(data)
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  useEffect(() => {
    fetchDeans()
    fetchDepartments()
  }, [])

  const getDepartmentName = (departmentId: number) => {
    const department = departments.find(d => d.id === departmentId)
    return department?.translations[currentLanguage]?.name || `Department ${departmentId}`
  }

  const handleDelete = async (dean: DepartmentDean) => {
    if (!window.confirm('Are you sure you want to delete this dean?')) return

    try {
      const response = await fetchWithAuth(
        `https://karsu.uz/api/menus/admin/${dean.id}/`,
        { method: 'DELETE' }
      )
      
      if (!response.ok) throw new Error('Failed to delete dean')
      await fetchDeans()
    } catch (error) {
      console.error('Error deleting dean:', error)
    }
  }

  const columns = [
    { 
      header: 'Full Name',
      accessor: 'translations',
      cell: (item: DepartmentDean) => item.translations['kk']?.full_name || '-'
    },
    {
      header: 'Department',
      accessor: 'department',
      cell: (item: DepartmentDean) => getDepartmentName(item.department)
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
      cell: (item: DepartmentDean) => (
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
        title="Department Deans"
        createButtonLabel="Add Department Dean"
        onCreateClick={() => {
          navigate('/karsu-admin-panel/department-deans/create')
        }}
      />

      <DataTable
        data={deans}
        columns={columns}
        currentLanguage={currentLanguage}
        actions={(item: DepartmentDean) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/karsu-admin-panel/department-deans/${item.id}/edit`)
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