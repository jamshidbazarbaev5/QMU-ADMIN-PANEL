import { useState, useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { fetchWithAuth } from '../api/api'
import { Pagination } from '../components/ui/Pagination'

interface ApiResponse<T> {
  results: T[]
  next: string | null
  previous: string | null
}

interface AgencyDean {
  id: number
  position: number
  agency: number
  faculty?: number
  department?: number
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

interface Agency {
  id: number
  translations: {
    [key: string]: {
      name: string
    }
  }
}

export function AgencyDeansPage() {
  const [deans, setDeans] = useState<AgencyDean[]>([])
  const [filteredDeans, setFilteredDeans] = useState<AgencyDean[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const currentLanguage = useLanguage()
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const ITEMS_PER_PAGE = 10

  const fetchAllDeans = async () => {
    try {
      let allDeans: AgencyDean[] = []
      let nextUrl: string | null = 'https://karsu.uz/api/menus/admin/'

      while (nextUrl) {
        const response: Response = await fetch(nextUrl)
        if (!response.ok) throw new Error('Failed to fetch deans')
        const data: ApiResponse<AgencyDean> = await response.json()
        
        const agencyDeans = data.results.filter((admin: AgencyDean) => 
          admin.agency && !admin.faculty && !admin.department
        )
        
        allDeans = [...allDeans, ...agencyDeans]
        nextUrl = data.next
      }

      // Sort deans by ID in descending order (newest first)
      const sortedDeans = allDeans.sort((a, b) => b.id - a.id)
      
      setDeans(sortedDeans)
      updatePaginatedData(sortedDeans, 1)
    } catch (error) {
      console.error('Error fetching deans:', error)
    }
  }

  const updatePaginatedData = (allDeans: AgencyDean[], page: number) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    setFilteredDeans(allDeans.slice(startIndex, endIndex))
    setTotalPages(Math.ceil(allDeans.length / ITEMS_PER_PAGE))
  }

  const fetchAgencies = async () => {
    try {
      let allAgencies: Agency[] = []
      let nextUrl: string | null = 'https://karsu.uz/api/menus/agency/'

      while (nextUrl) {
        const response: Response = await fetch(nextUrl)
        if (!response.ok) throw new Error('Failed to fetch agencies')
        const data: ApiResponse<Agency> = await response.json()
        allAgencies = [...allAgencies, ...data.results]
        nextUrl = data.next
      }

      setAgencies(allAgencies)
    } catch (error) {
      console.error('Error fetching agencies:', error)
      setAgencies([])
    }
  }

  useEffect(() => {
    fetchAllDeans()
    fetchAgencies()
  }, [])

  useEffect(() => {
    updatePaginatedData(deans, currentPage)
  }, [currentPage, deans])

  const getAgencyName = (agencyId: number) => {
    const agency = agencies.find(a => a.id === agencyId)
    if (!agency) return 'Loading...'
    return agency.translations[currentLanguage]?.name || 'Unnamed Agency'
  }

  const handleDelete = async (dean: AgencyDean) => {
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
      cell: (item: AgencyDean) => item.translations[currentLanguage]?.full_name || '-'
    },
    {
      header: 'Agency',
      accessor: 'agency',
      cell: (item: AgencyDean) => getAgencyName(item.agency)
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
      cell: (item: AgencyDean) => (
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
        title="Agency Deans"
        createButtonLabel="Add Agency Dean"
        onCreateClick={() => {
          navigate('/karsu-admin-panel/agency-deans/create')
        }}
      />

      <DataTable
        data={filteredDeans}
        columns={columns}
        currentLanguage={currentLanguage}
        actions={(item: AgencyDean) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/karsu-admin-panel/agency-deans/${item.id}/edit`)
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