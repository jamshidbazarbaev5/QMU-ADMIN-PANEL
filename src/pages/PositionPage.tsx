import { useState, useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { Dialog, DialogContent } from '../components/ui/dialog'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useNavigate } from 'react-router-dom'
import { Pagination } from '../components/ui/Pagination'

interface PositionTranslation {
  name: string
  description: string
}

interface Position {
  id: number
  email: string
  position: number
  translations: {
    [key: string]: PositionTranslation
  }
}

interface PaginatedResponse {
  count: number
  next: string | null
  previous: string | null
  results: Position[]
}

const translatedFields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
]

export function PositionPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const currentLanguage = useLanguage()
  const [email, setEmail] = useState('')
  const [position, setPosition] = useState('')
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const ITEMS_PER_PAGE = 10

  const fetchAllPositions = async () => {
    try {
      let allPositions: Position[] = []
      let nextUrl: string | null = 'https://karsu.uz/api/menus/position/'

      while (nextUrl) {
        const response = await fetch(nextUrl)
        if (!response.ok) throw new Error('Failed to fetch positions')
        const data: PaginatedResponse = await response.json()
        allPositions = [...allPositions, ...data.results]
        nextUrl = data.next
      }

      // Sort positions by ID in descending order (newest first)
      const sortedPositions = allPositions.sort((a, b) => b.id - a.id)
      
      setPositions(sortedPositions)
      updatePaginatedData(sortedPositions, 1)
    } catch (error) {
      console.error('Error fetching positions:', error)
    }
  }

  const updatePaginatedData = (allPositions: Position[], page: number) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    setFilteredPositions(allPositions.slice(startIndex, endIndex))
    setTotalPages(Math.ceil(allPositions.length / ITEMS_PER_PAGE))
  }

  useEffect(() => {
    fetchAllPositions()
  }, [])

  useEffect(() => {
    updatePaginatedData(positions, currentPage)
  }, [currentPage, positions])

  const handleSubmit = async (translationData: any) => {
    if (!position) {
      alert('Please enter a position number')
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        email: editingPosition?.email || email,
        position: parseInt(position),
        translations: translationData
      }

      const url = editingPosition 
        ? `https://karsu.uz/api/menus/position/${editingPosition.id}/`
        : `https://karsu.uz/api/menus/position/`

      const response = await fetch(url, {
        method: editingPosition ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Failed to save position')
      
      await fetchAllPositions()
      setIsDialogOpen(false)
      setEditingPosition(null)
      setEmail('')
      setPosition('')
    } catch (error) {
      console.error('Error saving position:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (position: Position) => {
    if (!window.confirm('Are you sure you want to delete this position?')) return

    try {
      const response = await fetch(
        `https://karsu.uz/api/menus/position/${position.id}/`,
        { method: 'DELETE' }
      )
      
      if (!response.ok) throw new Error('Failed to delete position')
      await fetchAllPositions()
    } catch (error) {
      console.error('Error deleting position:', error)
    }
  }

  return (
    <div className="p-6 mt-[50px]">
      <PageHeader
        title="Positions"
        createButtonLabel="Add Position"
        onCreateClick={() => navigate('/karsu-new-admin-panel/positions/new')}
      />

      <DataTable
        data={filteredPositions}
        columns={[
          { 
            header: 'Name',
            accessor: 'translations',
            cell: (item: Position) => item.translations['kk']?.name || '-'
          },
         
          { 
            header: 'Email',
            accessor: 'email',
          },
         
        ]}
        currentLanguage={currentLanguage}
        actions={(item: Position) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/karsu-new-admin-panel/positions/${item.id}/edit`)
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
        onPageChange={setCurrentPage}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <h2 className="text-lg font-semibold mb-4">
            {editingPosition ? 'Edit Position' : 'Create Position'}
          </h2>

          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Position Number</label>
              <input
                type="number"
                className="w-full rounded-md border border-gray-300 p-2"
                value={editingPosition?.position || position}
                onChange={(e) => {
                  if (editingPosition) {
                    setEditingPosition(prev => prev ? {...prev, position: parseInt(e.target.value)} : null)
                  } else {
                    setPosition(e.target.value)
                  }
                }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="w-full rounded-md border border-gray-300 p-2"
                value={editingPosition?.email || email}
                onChange={(e) => {
                  if (editingPosition) {
                    setEditingPosition(prev => prev ? {...prev, email: e.target.value} : null)
                  } else {
                    setEmail(e.target.value)
                  }
                }}
                required
              />
            </div>
          </div>

          <TranslatedForm
            fields={translatedFields}
            languages={['en', 'ru', 'uz', 'kk']}
            onSubmit={handleSubmit}
            initialData={editingPosition?.translations}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}