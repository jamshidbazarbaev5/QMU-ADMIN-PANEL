import { useState, useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { Dialog, DialogContent, DialogTitle } from '../components/ui/dialog'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useNavigate } from 'react-router-dom'

interface FacultyTranslation {
  name: string
  slug: string
  description: string
  history_of_faculty: string | null
}

interface Faculty {
  id: number
  email: string
  logo: string
  translations: {
    [key: string]: FacultyTranslation
  }
}

const translatedFields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
  { 
    name: 'description', 
    label: 'Description', 
    type: 'richtext' as const, 
    required: true
  },
  { 
    name: 'history_of_faculty', 
    label: 'History of Faculty', 
    type: 'richtext' as const
  }
]

export function FacultyPage() {
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null)
  const [email, setEmail] = useState('')
  const currentLanguage = useLanguage()
  const navigate = useNavigate()

  const fetchFaculties = async () => {
    try {
      const response = await fetch(`https://debttracker.uz/menus/faculty/`)
      if (!response.ok) throw new Error('Failed to fetch faculties')
      const data = await response.json()
      setFaculties(data)
    } catch (error) {
      console.error('Error fetching faculties:', error)
    }
  }

  useEffect(() => {
    fetchFaculties()
  }, [currentLanguage])

  const handleSubmit = async (translationData: any) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      
      // Add logo if selected
      if (selectedLogo) {
        formData.append('logo', selectedLogo)
      }
      
      // Add email
      formData.append('email', email)
      
      // Add translations
      formData.append('translations', JSON.stringify(translationData))

      const url = editingFaculty 
        ? `https://debttracker.uz/menus/faculty/${editingFaculty.translations[currentLanguage].slug}/`
        : `https://debttracker.uz/menus/faculty/`

      const response = await fetch(url, {
        method: editingFaculty ? 'PUT' : 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to save faculty')
      
      await fetchFaculties()
      setIsDialogOpen(false)
      setEditingFaculty(null)
      setSelectedLogo(null)
      setEmail('')
    } catch (error) {
      console.error('Error saving faculty:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (faculty: Faculty) => {
    if (!window.confirm('Are you sure you want to delete this faculty?')) return

    try {
      const response = await fetch(
        `https://debttracker.uz/menus/faculty/${faculty.translations[currentLanguage].slug}/`,
        { 
          method: 'DELETE',
          credentials: 'include'
        }
      )
      
      if (!response.ok) throw new Error('Failed to delete faculty')
      await fetchFaculties()
    } catch (error) {
      console.error('Error deleting faculty:', error)
    }
  }

  const columns = [
    { 
      header: 'Logo',
      accessor: 'logo',
      cell: (item: Faculty) => (
        <img src={item.logo} alt="Faculty logo" className="h-10 w-10 object-cover rounded" />
      )
    },
    { 
      header: 'Name',
      accessor: 'translations',
      cell: (item: Faculty) => item.translations[currentLanguage]?.name
    },
    { header: 'Email', accessor: 'email' },
    { 
      header: 'Description',
      accessor: 'translations',
      cell: (item: Faculty) => {
        const description = item.translations[currentLanguage]?.description || '-';
        // Create a temporary element to decode HTML entities
        const doc = new DOMParser().parseFromString(description, 'text/html');
        // Strip HTML tags and decode entities
        const strippedText = doc.body.textContent || '';
        const truncatedText = strippedText.length > 100 
          ? strippedText.substring(0, 100) + '...' 
          : strippedText;
        
        return <div className="max-w-md">{truncatedText}</div>;
      }
    },
    {
      header: 'Actions',
      cell: (item: Faculty) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/faculties/${item.translations[currentLanguage].slug}/edit`)
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
      )
    }
  ]

  useEffect(() => {
    if (editingFaculty) {
      setEmail(editingFaculty.email)
    }
  }, [editingFaculty])

  return (
    <div className="p-6 mt-[50px]">
      <PageHeader
        title="Faculties"
        createButtonLabel="Add Faculty"
        onCreateClick={() => navigate('/faculties/new')}
      />

      <DataTable
        data={faculties}
        columns={columns}
        currentLanguage={currentLanguage}
       
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogTitle className="text-lg font-semibold mb-4">
            {editingFaculty ? 'Edit Faculty' : 'Create Faculty'}
          </DialogTitle>
          
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedLogo(e.target.files?.[0] || null)}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <TranslatedForm
            fields={translatedFields}
            languages={['en', 'ru', 'uz', 'kk']}
            onSubmit={handleSubmit}
            initialData={editingFaculty?.translations}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}