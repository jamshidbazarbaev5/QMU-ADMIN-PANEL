import { useState, useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { Pagination } from '../components/ui/Pagination'

interface FacultyDean {
  id: number
  department: number
  agency: number
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

interface PaginatedResponse {
  count: number
  next: string | null
  previous: string | null
  results: FacultyDean[]
}

export function FacultyDeansPage() {
  const [deans, setDeans] = useState<FacultyDean[]>([])
  const [filteredDeans, setFilteredDeans] = useState<FacultyDean[]>([])
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const currentLanguage = useLanguage()
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const ITEMS_PER_PAGE = 10

  const fetchAllDeans = async () => {
    try {
      let allDeans: FacultyDean[] = []
      let nextUrl: string | null = 'https://karsu.uz/api/menus/admin/'

      while (nextUrl) {
        const response = await fetch(nextUrl)
        if (!response.ok) throw new Error('Failed to fetch deans')
        const data: PaginatedResponse = await response.json()
        
        // Filter to only show faculty deans
        const facultyDeans = data.results.filter(admin => 
          admin.faculty && !admin.department && !admin.agency
        )
        
        allDeans = [...allDeans, ...facultyDeans]
        nextUrl = data.next
      }

      // Sort deans by ID in descending order to show latest first
      allDeans.sort((a, b) => b.id - a.id)

      setDeans(allDeans)
      updatePaginatedData(allDeans, 1)
    } catch (error) {
      console.error('Error fetching deans:', error)
    }
  }

  const updatePaginatedData = (allDeans: FacultyDean[], page: number) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    setFilteredDeans(allDeans.slice(startIndex, endIndex))
    setTotalPages(Math.ceil(allDeans.length / ITEMS_PER_PAGE))
  }

  const fetchFaculties = async () => {
    try {
      let allFaculties: Faculty[] = [];
      let nextUrl: string | null = 'https://karsu.uz/api/menus/faculty/';
      
      while (nextUrl) {
        const response:any = await fetch(nextUrl);
        if (!response.ok) throw new Error('Failed to fetch faculties');
        
        const data = await response.json();
        
        if (data.results && Array.isArray(data.results)) {
          allFaculties = [...allFaculties, ...data.results];
          nextUrl = data.next;
        } else if (Array.isArray(data)) {
          allFaculties = [...allFaculties, ...data];
          nextUrl = null;
        } else {
          nextUrl = null;
        }
      }
      
      setFaculties(allFaculties);
    } catch (error) {
      console.error('Error fetching faculties:', error);
      // Set empty array on error to prevent mapping issues
      setFaculties([]);
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
      fetchAllDeans()
    } catch (error) {
      console.error('Error deleting dean:', error)
      alert('Failed to delete dean')
    }
  }

  useEffect(() => {
    fetchAllDeans()
    fetchFaculties()
  }, [])

  useEffect(() => {
    updatePaginatedData(deans, currentPage)
  }, [currentPage, deans])

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
        data={filteredDeans}
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

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  )
}