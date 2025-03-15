import { useState, useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { fetchWithAuth } from '../api/api'

interface AgencyDean {
  id: number
  position: number
  agency: number
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
  const [agencies, setAgencies] = useState<Agency[]>([])
  const currentLanguage = useLanguage()
  const navigate = useNavigate()

  const fetchDeans = async () => {
    try {
      const response = await fetch(`https://karsu.uz/api/menus/admin/`)
      if (!response.ok) throw new Error('Failed to fetch deans')
      const data = await response.json()
      // Filter to only show agency deans
      const agencyDeans = Array.isArray(data) ? 
        data.filter(admin => admin.agency && !admin.faculty && !admin.department) : 
        []
      setDeans(agencyDeans)
    } catch (error) {
      console.error('Error fetching deans:', error)
    }
  }

  const fetchAgencies = async () => {
    try {
      const response = await fetch(`https://karsu.uz/api/menus/agency/`)
      if (!response.ok) throw new Error('Failed to fetch agencies')
      const data = await response.json()
      setAgencies(data)
    } catch (error) {
      console.error('Error fetching agencies:', error)
    }
  }

  useEffect(() => {
    fetchDeans()
    fetchAgencies()
  }, [])

  const getAgencyName = (agencyId: number) => {
    const agency = agencies.find(a => a.id === agencyId)
    return agency?.translations[currentLanguage]?.name || `Agency ${agencyId}`
  }

  const handleDelete = async (dean: AgencyDean) => {
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
        data={deans}
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
    </div>
  )
}