import { useState, useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { Dialog, DialogContent } from '../components/ui/dialog'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'

interface PositionTranslation {
  name: string
}

interface Position {
  id: number
  email: string
  translations: {
    [key: string]: PositionTranslation
  }
}

const translatedFields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true }
]

export function PositionPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const currentLanguage = useLanguage()

  const fetchPositions = async () => {
    try {
      const response = await fetch(`https://debttracker.uz/${currentLanguage}/menus/position/`)
      if (!response.ok) throw new Error('Failed to fetch positions')
      const data = await response.json()
      setPositions(Array.isArray(data) ? data : [data])
    } catch (error) {
      console.error('Error fetching positions:', error)
    }
  }

  useEffect(() => {
    fetchPositions()
  }, [currentLanguage])

  const handleSubmit = async (translationData: any) => {
    setIsLoading(true)
    try {
      const payload = {
        email: editingPosition?.email || 'blabla@gmail.com', // You might want to make this configurable
        translations: translationData
      }

      const url = editingPosition 
        ? `https://debttracker.uz/${currentLanguage}/menus/position/${editingPosition.id}/`
        : `https://debttracker.uz/${currentLanguage}/menus/position/`

      const response = await fetch(url, {
        method: editingPosition ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Failed to save position')
      
      await fetchPositions()
      setIsDialogOpen(false)
      setEditingPosition(null)
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
        `https://debttracker.uz/${currentLanguage}/menus/position/${position.id}/`,
        { method: 'DELETE' }
      )
      
      if (!response.ok) throw new Error('Failed to delete position')
      await fetchPositions()
    } catch (error) {
      console.error('Error deleting position:', error)
    }
  }

  const columns = [
    { 
      header: 'Name',
      accessor: 'translations',
      cell: (item: Position) => item.translations[currentLanguage]?.name || '-'
    },
    { 
      header: 'Email',
      accessor: 'email',
    }
  ]

  return (
    <div className="p-6 mt-[50px]">
      <PageHeader
        title="Positions"
        createButtonLabel="Add Position"
        onCreateClick={() => {
          setEditingPosition(null)
          setIsDialogOpen(true)
        }}
      />

      <DataTable
        data={positions}
        columns={columns}
        currentLanguage={currentLanguage}
        actions={(item: Position) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                setEditingPosition(item)
                setIsDialogOpen(true)
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <h2 className="text-lg font-semibold mb-4">
            {editingPosition ? 'Edit Position' : 'Create Position'}
          </h2>

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