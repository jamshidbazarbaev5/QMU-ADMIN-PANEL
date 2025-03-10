import { useState, useEffect } from 'react'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { useLanguage } from '../hooks/useLanguage'
import { Dialog, DialogContent } from '../components/ui/dialog'
import { Pencil, Trash2 } from 'lucide-react'
import { getAuthHeader, fetchWithAuth } from '../api/api'
import { Button } from '../components/ui/button'
import { ChromePicker } from 'react-color'
import {ErrorModal} from "../components/ui/errorModal.tsx";

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
  { name: 'имя', label: 'имя', type: 'text' as const, required: true },
]

export function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const currentLanguage = useLanguage()
  const [color, setColor] = useState('#ffffff')
  const [goalsValue, setGoalsValue] = useState<number>(0)
  const [error, setError] = useState<Record<string, string[]> | string | null>(null)

  const fetchGoals = async () => {
    try {
      const response = await fetchWithAuth(`https://debttracker.uz/news/goals/`, {
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
      const editSlug = editingGoal && (
        editingGoal.translations[currentLanguage]?.slug ||
        editingGoal.translations.en?.slug ||
        editingGoal.translations.ru?.slug ||
        editingGoal.translations.uz?.slug ||
        editingGoal.translations.kk?.slug
      )

      const url = editingGoal 
        ? `https://debttracker.uz/news/goals/${editSlug}/`
        : `https://debttracker.uz/news/goals/`

      const translations = Object.entries(formData).reduce((acc, [lang, data]: [string, any]) => {
        if (lang !== 'goals' && lang !== 'color' && data.name) {
          acc[lang] = {
            name: data.name
          }
        }
        return acc
      }, {} as Record<string, any>)

      const payload = {
        translations,
        color: color.replace('#', ''),
        goals: goalsValue
      }

      const response = await fetchWithAuth(url, {
        method: editingGoal ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(payload)
      })


      if (!response.ok) {
        const errorData = await response.json()
        console.error('Server Error Response:', errorData)

        // Set error state with the error data
        if (typeof errorData === 'object') {
          setError(errorData)
        } else {
          setError(`Failed to ${editingGoal ? 'update' : 'create'} goal`)
        }
        return
      }

      
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
      const deleteSlug = 
        goal.translations[currentLanguage]?.slug ||
        goal.translations.en?.slug ||
        goal.translations.ru?.slug ||
        goal.translations.uz?.slug ||
        goal.translations.kk?.slug

      if (!deleteSlug) {
        throw new Error('No valid slug found for deletion')
      }

      const response = await fetchWithAuth(
        `https://debttracker.uz/news/goals/${deleteSlug}/`,
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
    setColor(`#${goal.color}`)
    setGoalsValue(goal.goals)
    const initialData = Object.keys(goal.translations).reduce((acc, lang) => {
      acc[lang] = {
        name: goal.translations[lang]?.name || '',
        // Keep the original slug
        slug: goal.translations[lang]?.slug || ''
      }
      return acc
    }, {} as Record<string, any>)

    setEditingGoal({ ...goal, translations: initialData })
    setIsDialogOpen(true)
  }

  // Add color picker component
  const ColorPickerField = ({ value, onChange }: { value: string; onChange: (color: string) => void }) => {
    const [showPicker, setShowPicker] = useState(false)

    return (
      <div className="relative">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded border cursor-pointer"
            style={{ backgroundColor: value }}
            onClick={() => setShowPicker(!showPicker)}
          />
          <span>{value}</span>
        </div>
        {showPicker && (
          <div className="absolute z-10 mt-2">
            <div
              className="fixed inset-0"
              onClick={() => setShowPicker(false)}
            />
            <ChromePicker
              color={value}
              onChange={(color) => onChange(color.hex)}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 mt-[50px]">
      <ErrorModal
          isOpen={!!error}
          onClose={() => setError(null)}
          errors={error || {}}
      />
      <PageHeader
        title="Цели"
        createButtonLabel="Добавить цель"
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
            {editingGoal ? 'Редактировать цель' : 'Создать цель'}
          </h2>
          
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Цвет</label>
              <ColorPickerField
                value={color}
                onChange={(newColor) => setColor(newColor)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Цели</label>
              <input
                type="number"
                className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                value={goalsValue}
                onChange={(e) => setGoalsValue(Number(e.target.value))}
                required
                min={0}
              />
            </div>
          </div>

          <TranslatedForm
            fields={fields}
            languages={['uz', 'ru', 'en', 'kk']}
            onSubmit={handleSubmit}
            initialData={editingGoal?.translations}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}