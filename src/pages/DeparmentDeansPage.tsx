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
  faculty: number
  agency: number
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

interface Position {
  id: number;
  translations: {
    [key: string]: {
      name: string;
    }
  }
}

export function DepartmentDeansPage() {
  const [deans, setDeans] = useState<DepartmentDean[]>([])
  const [allDeans, setAllDeans] = useState<DepartmentDean[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10
  const currentLanguage = useLanguage()
  const navigate = useNavigate()

  const fetchAllPositions = async () => {
    try {
      let allPositions: Position[] = []
      let nextUrl = 'https://karsu.uz/api/menus/position/'

      while (nextUrl) {
        const response = await fetch(nextUrl)
        if (!response.ok) throw new Error('Failed to fetch positions')
        const data = await response.json()
        
        allPositions = [...allPositions, ...data.results]
        nextUrl = data.next
      }

      setPositions(allPositions)
    } catch (error) {
      console.error('Error fetching positions:', error)
    }
  }

  const fetchAllDeans = async () => {
    setLoading(true)
    try {
      let fetchedDeans: DepartmentDean[] = []
      let nextUrl = 'https://karsu.uz/api/menus/admin/'

      while (nextUrl) {
        const response = await fetch(nextUrl)
        if (!response.ok) throw new Error('Failed to fetch deans')
        const data = await response.json()
        
        fetchedDeans = [...fetchedDeans, ...data.results]
        nextUrl = data.next
      }

      // Filter to only show department deans
      const departmentDeans = fetchedDeans.filter(admin => 
        admin.department && !admin.faculty && !admin.agency
      )
      
      setAllDeans(departmentDeans)
      setTotalItems(departmentDeans.length)
    } catch (error) {
      console.error('Error fetching deans:', error)
    } finally {
      setLoading(false)
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
    fetchAllDeans()
    fetchDepartments()
    fetchAllPositions()
  }, [])

  useEffect(() => {
    // Handle pagination changes
    const start = (currentPage - 1) * itemsPerPage
    const paginatedDeans = allDeans.slice(start, start + itemsPerPage)
    setDeans(paginatedDeans)
  }, [currentPage, allDeans])

  const getDepartmentName = (departmentId: number) => {
    const department = departments.find(d => d.id === departmentId)
    return department?.translations[currentLanguage]?.name || `Department ${departmentId}`
  }

  const getPositionName = (positionId: number) => {
    const position = positions.find(p => p.id === positionId)
    return position?.translations[currentLanguage]?.name || `Position ${positionId}`
  }

  const handleDelete = async (dean: DepartmentDean) => {
    if (!window.confirm('Are you sure you want to delete this dean?')) return

    try {
      const response = await fetchWithAuth(
        `https://karsu.uz/api/menus/admin/${dean.id}/`,
        { method: 'DELETE' }
      )
      
      if (!response.ok) throw new Error('Failed to delete dean')
      await fetchAllDeans()
    } catch (error) {
      console.error('Error deleting dean:', error)
    }
  }

  const columns = [
    { 
      header: 'Full Name',
      accessor: 'translations',
      cell: (item: DepartmentDean) => item.translations[currentLanguage]?.full_name || '-'
    },
    {
      header: 'Position',
      accessor: 'position',
      cell: (item: DepartmentDean) => getPositionName(item.position)
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

  // Add pagination controls component
  const PaginationControls = () => {
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    
    return (
      <div className="flex justify-end mt-4 gap-2">
        <Button
          variant="outline"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => prev - 1)}
        >
          Previous
        </Button>
        <span className="py-2 px-4">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(prev => prev + 1)}
        >
          Next
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 mt-[50px]">
      <PageHeader
        title="Department Deans"
        createButtonLabel="Add Department Dean"
        onCreateClick={() => {
          navigate('/karsu-new-admin-panel/department-deans/create')
        }}
      />

      {loading ? (
        <div className="flex justify-center py-8">Loading...</div>
      ) : (
        <>
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
                    navigate(`/karsu-new-admin-panel/department-deans/${item.id}/edit`)
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
          <PaginationControls />
        </>
      )}
    </div>
  )
}