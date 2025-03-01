import { useState, useEffect } from 'react'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { useLanguage } from '../hooks/useLanguage'
import { Dialog, DialogContent } from '../components/ui/dialog'
import { Pencil, Trash2 } from 'lucide-react'
import { getAuthHeader, fetchWithAuth } from '../api/api'
import { Button } from '../components/ui/button'

interface Goal {
  id: number
  goals: number
  color: string
  translations: Record<string, { 
    name: string
    slug: string 
  }>
}

const fields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
  { name: 'color', label: 'Color', type: 'text' as const, required: true },
]

export function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const currentLanguage = useLanguage()

  const fetchGoals = async () => {
    try {
      const response = await fetchWithAuth(`https://debttracker.uz/${currentLanguage}/news/goals/`, {
        headers: getAuthHeader()
      })
      const data = await response.json()
      setGoals(Array.isArray(data) ? data : [data])
    } catch (error) {
      console.error('Error fetching goals:', error)
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [currentLanguage])

  const handleSubmit = async (formData: any) => {
    setIsLoading(true)
    try {
      // For edit, find an existing slug from any available language
      const editSlug = editingGoal && (
        editingGoal.translations[currentLanguage]?.slug ||
        editingGoal.translations.en?.slug ||
        editingGoal.translations.ru?.slug ||
        editingGoal.translations.uz?.slug ||
        editingGoal.translations.kk?.slug
      )

      const url = editingGoal 
        ? `https://debttracker.uz/${currentLanguage}/news/goals/${editSlug}/`
        : `https://debttracker.uz/${currentLanguage}/news/goals/`

      // Prepare translations with slugs
      const translations = Object.entries(formData).reduce((acc, [lang, data]: [string, any]) => {
        acc[lang] = {
          name: data.name,
          slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        }
        return acc
      }, {} as Record<string, any>)

      const payload = {
        translations,
        color: formData[currentLanguage].color || 'ffffff',
        goals: editingGoal?.goals || 2
      }

      const response = await fetchWithAuth(url, {
        method: editingGoal ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Failed to save goal')
      
      await fetchGoals()
      setIsDialogOpen(false)
      setEditingGoal(null)
    } catch (error) {
      console.error('Error saving goal:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (goal: Goal) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return

    try {
      const response = await fetchWithAuth(
        `https://debttracker.uz/${currentLanguage}/news/goals/${goal.translations[currentLanguage].slug}/`,
        { 
          method: 'DELETE',
          headers: getAuthHeader()
        }
      )
      
      if (!response.ok) throw new Error('Failed to delete goal')
      await fetchGoals()
    } catch (error) {
      console.error('Error deleting goal:', error)
    }
  }

  const columns = [
    { 
      header: 'Name',
      accessor: 'translations',
      cell: (item: Goal) => item.translations[currentLanguage]?.name || '-'
    },
    { 
      header: 'Color',
      accessor: 'color',
      cell: (item: Goal) => (
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded border"
            style={{ backgroundColor: `#${item.color}` }}
          />
          #{item.color}
        </div>
      )
    }
  ]

  const handleEdit = (goal: Goal) => {
    // Keep the original translations data for maintaining slugs
    const initialData = Object.keys(goal.translations).reduce((acc, lang) => {
      acc[lang] = {
        name: goal.translations[lang]?.name || '',
        color: goal.color,
        // Keep the original slug
        slug: goal.translations[lang]?.slug || ''
      }
      return acc
    }, {} as Record<string, any>)

    setEditingGoal({ ...goal, translations: initialData })
    setIsDialogOpen(true)
  }

  return (
    <div className="p-6 mt-[50px]">
      <PageHeader
        title="Goals"
        createButtonLabel="Add Goal"
        onCreateClick={() => {
          setEditingGoal(null)
          setIsDialogOpen(true)
        }}
      />

      <DataTable
        data={goals}
        columns={columns}
        currentLanguage={currentLanguage}
        actions={(item: Goal) => (
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <h2 className="text-lg font-semibold mb-4">
            {editingGoal ? 'Edit Goal' : 'Create Goal'}
          </h2>
          <TranslatedForm
            fields={fields}
            languages={['uz', 'ru', 'en', 'kk']}
            onSubmit={handleSubmit}
            initialData={editingGoal?.translations}
            isLoading={isLoading}
            sharedFields={['color']}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}