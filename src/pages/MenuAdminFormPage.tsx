import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import {fetchWithAuth, getAuthHeader} from '../api/api'
// ... import other necessary types and components

// Add all interfaces from MenuAdminsPage
interface MenuAdminTranslation {
  full_name: string
  biography: string
}

interface Menu {
  id: number
  parent: number | null
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

interface Position {
  id: number
  email: string
  translations: {
    [key: string]: {
      name: string
    }
  }
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
  { name: 'biography', label: 'Biography', type: 'richtext' as const, required: true },
]

export function MenuAdminFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentLanguage = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<MenuAdmin | null>(null)
  
  // Add missing state declarations
  const [selectedMenu, setSelectedMenu] = useState<string>('')
  const [selectedFaculty, setSelectedFaculty] = useState<string>('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [selectedAgency, setSelectedAgency] = useState<string>('')
  const [position, setPosition] = useState<string>('')
  const [newAdminEmail, setNewAdminEmail] = useState<string>('')
  const [newAdminPhone, setNewAdminPhone] = useState<string>('')

  // Add state for image
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [positions, setPositions] = useState<Position[]>([])

  // Add new state for parent menu
  const [parentMenus, setParentMenus] = useState<Menu[]>([])
  const [childMenus, setChildMenus] = useState<Menu[]>([])
  const [selectedParentMenu, setSelectedParentMenu] = useState<string>('')

  // Add these helper functions
  const isDisabledBySelection = (field: 'faculty' | 'department' | 'agency') => {
    switch (field) {
      case 'faculty':
        return !!selectedDepartment || !!selectedAgency;
      case 'department':
        return !!selectedAgency || !!selectedFaculty;
      case 'agency':
        return !!selectedDepartment || !!selectedFaculty;
      default:
        return false;
    }
  }

  // Add reset handlers
  const handleAgencyChange = (value: string) => {
    if (value) {
      setSelectedAgency(value);
      setSelectedDepartment('');
      setSelectedFaculty('');
    } else {
      setSelectedAgency('');
    }
  }

  const handleDepartmentChange = (value: string) => {
    if (value) {
      setSelectedDepartment(value);
      setSelectedFaculty('');
      setSelectedAgency('');
    } else {
      setSelectedDepartment('');
    }
  }

  const handleFacultyChange = (value: string) => {
    if (value) {
      setSelectedFaculty(value);
      setSelectedDepartment('');
      setSelectedAgency('');
    } else {
      setSelectedFaculty('');
    }
  }

  // Update fetch functions to use correct endpoints
  const fetchMenus = async () => {
    try {
      const response = await fetch(`https://debttracker.uz/menus/main/`)
      if (!response.ok) throw new Error('Failed to fetch menus')
      const data = await response.json()
      
      // Separate menus into parent and child
      const parents = data.filter((menu: Menu) => !menu.parent)
      const children = data.filter((menu: Menu) => menu.parent)
      
      setParentMenus(parents)
      setChildMenus(children)
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

  const fetchPositions = async () => {
    try {
      const response = await fetch(`https://debttracker.uz/menus/position/`)
      if (!response.ok) throw new Error('Failed to fetch positions')
      const data = await response.json()
      // Ensure we always have an array of positions
      const positionsArray = Array.isArray(data) ? data : [data]
      // Filter out any invalid positions
      const validPositions = positionsArray.filter(pos => pos && pos.id !== undefined)
      setPositions(validPositions)
    } catch (error) {
      console.error('Error fetching positions:', error)
    }
  }

  // Add handler for parent menu selection
  const handleParentMenuChange = (value: string) => {
    setSelectedParentMenu(value)
    setSelectedMenu('') // Reset child menu selection when parent changes
  }

  // Filter child menus based on selected parent
  const filteredChildMenus = childMenus.filter(
    menu => menu.parent === Number(selectedParentMenu)
  )

  // Update handleSubmit function
  const handleSubmit = async (translationData: any) => {
    // Check for required fields
    if (!selectedMenu || !position) {
      alert('Please select Menu and Position')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      
      formData.append('position', position)
      formData.append('menu', selectedMenu)
      
      // Only append the selected fields if they have values
      if (selectedFaculty) {
        formData.append('faculty', selectedFaculty)
      }
      if (selectedDepartment) {
        formData.append('department', selectedDepartment)
      }
      if (selectedAgency) {
        formData.append('agency', selectedAgency)
      }
      
      formData.append('phone_number', editingAdmin?.phone_number || newAdminPhone)
      formData.append('email', editingAdmin?.email || newAdminEmail)
      formData.append('translations', JSON.stringify(translationData))
      
      if (selectedImage) {
        formData.append('main_image', selectedImage)
      }

      const url = id 
        ? `https://debttracker.uz/menus/admin/${id}/`
        : `https://debttracker.uz/menus/admin/`

      const response = await fetchWithAuth(url, {
        method: id ? 'PUT' : 'POST',
        body: formData,
        headers: {
          ...getAuthHeader()
        }
      })

      if (!response.ok) throw new Error('Failed to save admin')
      
      navigate('/menu-admins')
    } catch (error) {
      console.error('Error saving admin:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // First fetch menus
    const initializeData = async () => {
      await fetchMenus()
      // Only fetch admin details after menus are loaded
      if (id) {
        fetchAdminDetails()
      }
    }
    
    // Fetch other data in parallel
    fetchFaculties()
    fetchDepartments()
    fetchAgencies()
    fetchPositions()
    
    initializeData()
  }, [id, currentLanguage])

  const fetchAdminDetails = async () => {
    if (!id) return
    try {
      const response = await fetch(`https://debttracker.uz/menus/admin/${id}/`)
      if (!response.ok) throw new Error('Failed to fetch admin details')
      const data = await response.json()
      setEditingAdmin(data)
      
      // Find the menu in childMenus to get its parent
      const menuItem = childMenus.find(menu => menu.id === data.menu)
      if (menuItem?.parent) {
        setSelectedParentMenu(menuItem.parent.toString())
      }
      
      // Set all the form fields with the fetched data
      setSelectedMenu(data.menu.toString())
      if (data.faculty) setSelectedFaculty(data.faculty.toString())
      if (data.department) setSelectedDepartment(data.department.toString())
      if (data.agency) setSelectedAgency(data.agency.toString())
      setPosition(data.position.toString())
      setNewAdminEmail(data.email)
      setNewAdminPhone(data.phone_number)
    } catch (error) {
      console.error('Error fetching admin details:', error)
    }
  }

  return (
    <div className="p-6 mt-[50px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {id ? 'Edit Administrator' : 'Create Administrator'}
        </h1>
        <Button variant="outline" onClick={() => navigate('/menu-admins')}>
          Back to List
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Position</label>
            <Select 
              value={position} 
              onValueChange={setPosition}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a position" />
              </SelectTrigger>
              <SelectContent className="min-w-[600px]">
                {positions.map((pos) => (
                  <SelectItem 
                    key={pos.id} 
                    value={String(pos.id)}
                    className="whitespace-normal py-2 break-words"
                  >
                    {pos.translations?.[currentLanguage]?.name || `Position ${pos.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Parent Menu</label>
            <Select 
              value={selectedParentMenu} 
              onValueChange={handleParentMenuChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a parent menu" />
              </SelectTrigger>
              <SelectContent className="min-w-[600px]">
                {parentMenus.map((menu) => (
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
            <label className="block text-sm font-medium mb-2">Child Menu</label>
            <Select 
              value={selectedMenu} 
              onValueChange={setSelectedMenu}
              disabled={!selectedParentMenu}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={selectedParentMenu ? "Select a child menu" : "Select parent menu first"} />
              </SelectTrigger>
              <SelectContent className="min-w-[600px]">
                {filteredChildMenus.map((menu) => (
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
              onValueChange={handleFacultyChange}
              disabled={isDisabledBySelection('faculty')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a faculty (optional)" />
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
              onValueChange={handleDepartmentChange}
              disabled={isDisabledBySelection('department')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a department (optional)" />
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
              onValueChange={handleAgencyChange}
              disabled={isDisabledBySelection('agency')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an agency (optional)" />
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
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              className="w-full rounded-md border border-gray-300 p-2"
              value={newAdminPhone}
              onChange={(e) => setNewAdminPhone(e.target.value)}
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
      </div>
    </div>
  )
}