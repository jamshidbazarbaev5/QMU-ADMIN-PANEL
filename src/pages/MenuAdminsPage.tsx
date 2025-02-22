import { useState, useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { Dialog, DialogContent } from '../components/ui/dialog'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'

interface MenuAdminTranslation {
  full_name: string
  biography: string
}

interface MenuAdmin {
  id: number
  position: number
  faculty: number
  department: number
  agency: number
  phone_number: string
  email: string
  main_image: string
  menu: number
  footer_menu: number | null
  translations: {
    [key: string]: MenuAdminTranslation
  }
}

const translatedFields = [
  { name: 'full_name', label: 'Full Name', type: 'text' as const, required: true },
  { name: 'biography', label: 'Biography', type: 'textarea' as const, required: true },
]

export function MenuAdminsPage() {
  const [admins, setAdmins] = useState<MenuAdmin[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<MenuAdmin | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const currentLanguage = useLanguage()

  const fetchAdmins = async () => {
    try {
      const response = await fetch(`https://debttracker.uz/${currentLanguage}/menus/admin/`)
      if (!response.ok) throw new Error('Failed to fetch admins')
      const data = await response.json()
      setAdmins(Array.isArray(data) ? data : [data])
    } catch (error) {
      console.error('Error fetching admins:', error)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [currentLanguage])

  const handleSubmit = async (translationData: any) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      
      // Add basic fields
      formData.append('position', '1')
      formData.append('faculty', '1')
      formData.append('department', '4')
      formData.append('agency', '1')
      formData.append('menu', '2')
      
      // Add form fields if editing
      if (editingAdmin) {
        formData.append('phone_number', editingAdmin.phone_number)
        formData.append('email', editingAdmin.email)
      }

      // Add translations
      formData.append('translations', JSON.stringify(translationData))
      
      // Add image if selected
      if (selectedImage) {
        formData.append('main_image', selectedImage)
      }

      const url = editingAdmin 
        ? `https://debttracker.uz/${currentLanguage}/menus/admin/${editingAdmin.id}/`
        : `https://debttracker.uz/${currentLanguage}/menus/admin/`

      const response = await fetch(url, {
        method: editingAdmin ? 'PUT' : 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Failed to save admin')
      
      await fetchAdmins()
      setIsDialogOpen(false)
      setEditingAdmin(null)
      setSelectedImage(null)
    } catch (error) {
      console.error('Error saving admin:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (admin: MenuAdmin) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return

    try {
      const response = await fetch(
        `https://debttracker.uz/${currentLanguage}/menus/admin/${admin.id}/`,
        { method: 'DELETE' }
      )
      
      if (!response.ok) throw new Error('Failed to delete admin')
      await fetchAdmins()
    } catch (error) {
      console.error('Error deleting admin:', error)
    }
  }

  const columns = [
    { 
      header: 'Full Name',
      accessor: 'translations',
      cell: (item: MenuAdmin) => item.translations[currentLanguage]?.full_name || '-'
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
      cell: (item: MenuAdmin) => (
        <img 
          src={item.main_image} 
          alt="Admin"
          className="w-10 h-10 rounded-full object-cover"
        />
      )
    }
  ]

  return (
    <div className="p-6 mt-[50px]">
      <PageHeader
        title="Menu Administrators"
        createButtonLabel="Add Administrator"
        onCreateClick={() => {
          setEditingAdmin(null)
          setSelectedImage(null)
          setIsDialogOpen(true)
        }}
      />

      <DataTable
        data={admins}
        columns={columns}
        currentLanguage={currentLanguage}
        actions={(item: MenuAdmin) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                setEditingAdmin(item)
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
            {editingAdmin ? 'Edit Administrator' : 'Create Administrator'}
          </h2>
          
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="w-full rounded-md border border-gray-300 p-2"
                value={editingAdmin?.email || ''}
                onChange={(e) => setEditingAdmin(prev => 
                  prev ? {...prev, email: e.target.value} : null
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                className="w-full rounded-md border border-gray-300 p-2"
                value={editingAdmin?.phone_number || ''}
                onChange={(e) => setEditingAdmin(prev => 
                  prev ? {...prev, phone_number: e.target.value} : null
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Image</label>
              {editingAdmin?.main_image && (
                <img 
                  src={editingAdmin.main_image}
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
            initialData={editingAdmin?.translations}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}