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

interface Menu {
  id: number
  translations: {
    [key: string]: {
      name: string
      title: string
      slug: string
    }
  }
}

interface Faculty {
  id: number
  translations: {
    [key: string]: {
      name: string
    }
  }
}

interface Department {
  id: number
  translations: {
    [key: string]: {
      name: string
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
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminPhone, setNewAdminPhone] = useState('')
  const [menus, setMenus] = useState<Menu[]>([])
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  
  const [selectedMenu, setSelectedMenu] = useState<string>('')
  const [selectedFaculty, setSelectedFaculty] = useState<string>('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [selectedAgency, setSelectedAgency] = useState<string>('')
  const [position, setPosition] = useState<string>('')
  const navigate = useNavigate()

  const fetchAdmins = async () => {
    try {
      const response = await fetch(`https://debttracker.uz/menus/admin/`)
      if (!response.ok) throw new Error('Failed to fetch admins')
      const data = await response.json()
      setAdmins(Array.isArray(data) ? data : [data])
    } catch (error) {
      console.error('Error fetching admins:', error)
    }
  }

  const fetchMenus = async () => {
    try {
      const response = await fetch(`https://debttracker.uz/menus/main/`)
      if (!response.ok) throw new Error('Failed to fetch menus')
      const data = await response.json()
      setMenus(data)
    } catch (error) {
      console.error('Error fetching menus:', error)
    }
  }

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

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`https://debttracker.uz/menus/department/`)
      if (!response.ok) throw new Error('Failed to fetch departments')
      const data = await response.json()
      setDepartments(data)
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchAgencies = async () => {
    try {
      const response = await fetch(`https://debttracker.uz/menus/agency/`)
      if (!response.ok) throw new Error('Failed to fetch agencies')
      const data = await response.json()
      setAgencies(data)
    } catch (error) {
      console.error('Error fetching agencies:', error)
    }
  }

  useEffect(() => {
    fetchAdmins()
    fetchMenus()
    fetchFaculties()
    fetchDepartments()
    fetchAgencies()
  }, [currentLanguage])

  const handleSubmit = async (translationData: any) => {
    if (!selectedMenu || !selectedFaculty || !selectedDepartment || !selectedAgency || !position) {
      alert('Please select all required fields')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      
      // Add position to form data
      formData.append('position', position)
      
      // Add selections
      formData.append('menu', selectedMenu)
      formData.append('faculty', selectedFaculty)
      formData.append('department', selectedDepartment)
      formData.append('agency', selectedAgency)
      
      // Add form fields for both editing and creating
      formData.append('phone_number', editingAdmin?.phone_number || newAdminPhone)
      formData.append('email', editingAdmin?.email || newAdminEmail)
      formData.append('translations', JSON.stringify(translationData))
      
      if (selectedImage) {
        formData.append('main_image', selectedImage)
      }

      const url = editingAdmin 
        ? `https://debttracker.uz/menus/admin/${editingAdmin.id}/`
        : `https://debttracker.uz/menus/admin/`

      const response = await fetch(url, {
        method: editingAdmin ? 'PUT' : 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Failed to save admin')
      
      await fetchAdmins()
      setIsDialogOpen(false)
      setEditingAdmin(null)
      setSelectedImage(null)
      // Reset new admin fields
      setNewAdminEmail('')
      setNewAdminPhone('')
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
        `https://debttracker.uz/menus/admin/${admin.id}/`,
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
          navigate('/menu-admins/create')
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
                navigate(`/menu-admins/${item.id}/edit`)
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
        <DialogContent className="min-w-[900px]">
          <h2 className="text-lg font-semibold mb-4">
            {editingAdmin ? 'Edit Administrator' : 'Create Administrator'}
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Position</label>
              <input
                type="number"
                min="0"
                className="w-full rounded-md border border-gray-300 p-2"
                value={editingAdmin?.position || position}
                onChange={(e) => {
                  if (editingAdmin) {
                    setEditingAdmin(prev => prev ? {...prev, position: Number(e.target.value)} : null)
                  } else {
                    setPosition(e.target.value)
                  }
                }}
                placeholder="Enter position number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Menu</label>
              <Select 
                value={selectedMenu} 
                onValueChange={setSelectedMenu}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a menu" />
                </SelectTrigger>
                <SelectContent className="min-w-[600px]">
                  {menus.map((menu) => (
                    <SelectItem 
                      key={menu.id} 
                      value={menu.id.toString()}
                      className="whitespace-normal py-2 break-words"
                    >
                      {menu.translations[currentLanguage]?.name || `Menu ${menu.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Faculty</label>
              <Select 
                value={selectedFaculty} 
                onValueChange={setSelectedFaculty}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a faculty" />
                </SelectTrigger>
                <SelectContent className="min-w-[600px]">
                  {faculties.map((faculty) => (
                    <SelectItem 
                      key={faculty.id} 
                      value={faculty.id.toString()}
                      className="whitespace-normal py-2 break-words"
                    >
                      {faculty.translations[currentLanguage]?.name || `Faculty ${faculty.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Department</label>
              <Select 
                value={selectedDepartment} 
                onValueChange={setSelectedDepartment}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent className="min-w-[600px]">
                  {departments.map((department) => (
                    <SelectItem 
                      key={department.id} 
                      value={department.id.toString()}
                      className="whitespace-normal py-2 break-words"
                    >
                      {department.translations[currentLanguage]?.name || `Department ${department.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Agency</label>
              <Select 
                value={selectedAgency} 
                onValueChange={setSelectedAgency}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an agency" />
                </SelectTrigger>
                <SelectContent className="min-w-[600px]">
                  {agencies.map((agency) => (
                    <SelectItem 
                      key={agency.id} 
                      value={agency.id.toString()}
                      className="whitespace-normal py-2 break-words"
                    >
                      {agency.translations[currentLanguage]?.name || `Agency ${agency.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="w-full rounded-md border border-gray-300 p-2"
                value={editingAdmin?.email || newAdminEmail}
                onChange={(e) => {
                  if (editingAdmin) {
                    setEditingAdmin(prev => prev ? {...prev, email: e.target.value} : null)
                  } else {
                    setNewAdminEmail(e.target.value)
                  }
                }}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                className="w-full rounded-md border border-gray-300 p-2"
                value={editingAdmin?.phone_number || newAdminPhone}
                onChange={(e) => {
                  if (editingAdmin) {
                    setEditingAdmin(prev => prev ? {...prev, phone_number: e.target.value} : null)
                  } else {
                    setNewAdminPhone(e.target.value)
                  }
                }}
              />
            </div>

            <div className="col-span-2">
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