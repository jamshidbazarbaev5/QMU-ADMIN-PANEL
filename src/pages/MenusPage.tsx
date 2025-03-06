import { useState, useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { Dialog, DialogContent } from '../components/ui/dialog'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import {fetchWithAuth, getAuthHeader} from '../api/api'

interface MenuTranslation {
  name: string
  title: string
  slug?: string
}

interface Menu {
  id: number
  parent: number | null
  translations: {
    [key: string]: MenuTranslation
  }
}

const fields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
  { name: 'title', label: 'Title', type: 'text' as const, required: true },
]

// Add parent select field component
const ParentSelect = ({ value, onChange, menus }: { 
  value: number | null, 
  onChange: (value: number | null) => void,
  menus: Menu[]
}) => {
  const currentLanguage = useLanguage()
  
  return (
    <select 
      value={value || ''} 
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className="w-full p-2 border rounded"
    >
      <option value="">No parent</option>
      {menus.map((menu) => (
        <option key={menu.id} value={menu.id}>
          {menu.translations[currentLanguage]?.name}
        </option>
      ))}
    </select>
  )
}

export function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [menuType, setMenuType] = useState<'main' | 'footer'>('main')
  const currentLanguage = useLanguage()
  const [selectedParent, setSelectedParent] = useState<number | null>(null)

  const fetchMenus = async () => {
    try {
      const response = await fetchWithAuth(`https://debttracker.uz/menus/${menuType}/`, {
        headers: getAuthHeader(),
      })

      if (!response.ok) throw new Error('Failed to fetch menus')
      const data = await response.json()
      setMenus(data)
    } catch (error) {
      console.error('Error fetching menus:', error)
    }
  }

  useEffect(() => {
    fetchMenus()
  }, [currentLanguage, menuType])

  const handleSubmit = async (formData: any) => {
    setIsLoading(true)
    try {
      const url = editingMenu 
        ? `https://debttracker.uz/menus/${menuType}/${editingMenu.translations[currentLanguage].slug}/`
        : `https://debttracker.uz/menus/${menuType}/`

      const response = await fetchWithAuth(url, {
        method: editingMenu ? 'PUT' : 'POST',
        headers: {
          ...getAuthHeader()
        },
        body: JSON.stringify({
          parent: selectedParent,
          translations: formData
        }),
      })

      if (!response.ok) throw new Error('Failed to save menu')
      
      await fetchMenus()
      setIsDialogOpen(false)
      setEditingMenu(null)
    } catch (error) {
      console.error('Error saving menu:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (menu: Menu) => {
    // Get the first available translation's slug
    const availableLanguages = Object.keys(menu.translations);
    if (availableLanguages.length === 0) {
      console.error('No translations available for this menu');
      return;
    }

    // Use current language's slug if available, otherwise use the first available translation
    const languageToUse = menu.translations[currentLanguage] 
      ? currentLanguage 
      : availableLanguages[0];
    
    const slug = menu.translations[languageToUse].slug;
    if (!slug) {
      console.error('Cannot delete menu: missing slug');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this menu?')) return

    try {
      const response = await fetchWithAuth(
        `https://debttracker.uz/menus/${menuType}/${slug}/`,
        { method: 'DELETE', headers: getAuthHeader() }
      )
      
      if (!response.ok) throw new Error('Failed to delete menu')
      await fetchMenus()
    } catch (error) {
      console.error('Error deleting menu:', error)
    }
  }

  const columns = [
    { 
      header: 'Name',
      accessor: 'translations',
      cell: (item: Menu) => item.translations[currentLanguage]?.name
    },
    { 
      header: 'Title',
      accessor: 'translations',
      cell: (item: Menu) => item.translations[currentLanguage]?.title
    },
  ]

  return (
    <div className="p-6 mt-[50px]">
      <Tabs value={menuType} onValueChange={(value: string) => setMenuType(value as 'main' | 'footer')}>
        <TabsList className="mb-4">
          <TabsTrigger value="main">Main Menu</TabsTrigger>
          <TabsTrigger value="footer">Footer Menu</TabsTrigger>
        </TabsList>

        <TabsContent value={menuType}>
          <PageHeader
            title={menuType === 'main' ? 'Main Menu' : 'Footer Menu'}
            createButtonLabel="Add Menu"
            onCreateClick={() => {
              setEditingMenu(null)
              setIsDialogOpen(true)
            }}
          />

          <DataTable
            data={menus}
            columns={columns}
            currentLanguage={currentLanguage}
            actions={(item: Menu) => (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingMenu(item)
                    setSelectedParent(item.parent)
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
                {editingMenu ? 'Edit Menu' : 'Create Menu'}
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Parent Menu</label>
                <ParentSelect 
                  value={selectedParent} 
                  onChange={setSelectedParent}
                  menus={menus.filter(m => m.id !== editingMenu?.id)} 
                />
              </div>
              <TranslatedForm
                fields={fields}
                languages={['en', 'ru', 'uz', 'kk']}
                onSubmit={handleSubmit}
                initialData={editingMenu?.translations}
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}