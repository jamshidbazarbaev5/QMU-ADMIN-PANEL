import { useState, useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { Dialog, DialogContent } from '../components/ui/dialog'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { useNavigate } from 'react-router-dom'

interface AgencyTranslation {
  name: string
  description: string
  slug: string
}

interface Agency {
  id: number
  main_image: string
  menu: number
  translations: {
    [key: string]: AgencyTranslation
  }
}

interface Menu {
  id: number
  parent: null
  translations: {
    [key: string]: {
      name: string
      title: string
      slug: string
    }
  }
}

const translatedFields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
  { name: 'description', label: 'Description', type: 'richtext' as const, required: true },
  { name: 'slug', label: 'Slug', type: 'text' as const, required: true }
]

export function AgencyPage() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null)
  const [selectedMenu, setSelectedMenu] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const currentLanguage = useLanguage()
  const navigate = useNavigate()

  const fetchAgencies = async () => {
    try {
      const response = await fetch(`https://debttracker.uz/${currentLanguage}/menus/agency/`)
      if (!response.ok) throw new Error('Failed to fetch agencies')
      const data = await response.json()
      setAgencies(Array.isArray(data) ? data : [data])
    } catch (error) {
      console.error('Error fetching agencies:', error)
    }
  }

  const fetchMenus = async () => {
    try {
      const response = await fetch(`https://debttracker.uz/${currentLanguage}/menus/main/`)
      if (!response.ok) throw new Error('Failed to fetch menus')
      const data = await response.json()
      setMenus(data)
    } catch (error) {
      console.error('Error fetching menus:', error)
    }
  }

  useEffect(() => {
    fetchAgencies()
    fetchMenus()
  }, [currentLanguage])

  const handleSubmit = async (translationData: any) => {
    if (!selectedMenu) {
      alert('Please select a menu')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('menu', selectedMenu.toString())
      formData.append('translations', JSON.stringify(translationData))
      
      if (selectedImage) {
        formData.append('main_image', selectedImage)
      }

      const url = editingAgency 
        ? `https://debttracker.uz/${currentLanguage}/menus/agency/${editingAgency.id}/`
        : `https://debttracker.uz/${currentLanguage}/menus/agency/`

      const response = await fetch(url, {
        method: editingAgency ? 'PUT' : 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Failed to save agency')
      
      await fetchAgencies()
      setIsDialogOpen(false)
      setEditingAgency(null)
      setSelectedImage(null)
      setSelectedMenu(null)
    } catch (error) {
      console.error('Error saving agency:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (agency: Agency) => {
    if (!window.confirm('Are you sure you want to delete this agency?')) return

    try {
      const response = await fetch(
        `https://debttracker.uz/${currentLanguage}/menus/agency/${agency.id}/`,
        { method: 'DELETE' }
      )
      
      if (!response.ok) throw new Error('Failed to delete agency')
      await fetchAgencies()
    } catch (error) {
      console.error('Error deleting agency:', error)
    }
  }

  const columns = [
    { 
      header: 'Name',
      accessor: 'translations',
      cell: (item: Agency) => item.translations[currentLanguage]?.name || '-'
    },
    { 
      header: 'Description',
      accessor: 'translations',
      cell: (item: Agency) => (
        <div 
          className="max-w-md truncate"
          dangerouslySetInnerHTML={{ 
            __html: item.translations[currentLanguage]?.description || '-'
          }}
        />
      )
    },
    {
      header: 'Image',
      accessor: 'main_image',
      cell: (item: Agency) => (
        <img 
          src={item.main_image} 
          alt="Agency"
          className="w-10 h-10 rounded-full object-cover"
        />
      )
    }
  ]

  return (
    <div className="p-6 mt-[50px]">
      <PageHeader
        title="Agencies"
        createButtonLabel="Add Agency"
        onCreateClick={() => navigate('/agencies/new')}
      />

      <DataTable
        data={agencies}
        columns={columns}
        currentLanguage={currentLanguage}
        actions={(item: Agency) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/agencies/${item.id}/edit`)
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
            {editingAgency ? 'Edit Agency' : 'Create Agency'}
          </h2>
          
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Menu</label>
              <Select value={selectedMenu?.toString() || ""} onValueChange={(value) => setSelectedMenu(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a menu" />
                </SelectTrigger>
                <SelectContent>
                  {menus.map((menu) => (
                    <SelectItem key={menu.id} value={menu.id.toString()}>
                      {menu.translations[currentLanguage]?.name || menu.translations.en?.name || `Menu ${menu.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Image</label>
              {editingAgency?.main_image && (
                <img 
                  src={editingAgency.main_image}
                  alt="Current"
                  className="w-20 h-20 object-cover rounded mb-2"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                className="w-full"
              />
            </div>
          </div>

          <TranslatedForm
            fields={translatedFields}
            languages={['en', 'ru', 'uz', 'kk']}
            onSubmit={handleSubmit}
            initialData={editingAgency?.translations}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}