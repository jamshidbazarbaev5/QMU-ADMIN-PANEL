import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { TranslatedForm2 } from '../helpers/TranslatedForm2'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import {fetchWithAuth, getAuthHeader} from '../api/api'
import { ErrorModal } from "../components/ui/errorModal"
// ... import other necessary types and components

// Remove these interfaces as they're no longer needed
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
  { name: 'full_name', label: 'Full Name', type: 'text' as const, required: false },
  { name: 'biography', label: 'Biography', type: 'richtext' as const, required: false },
]

export function MenuAdminFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentLanguage = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<MenuAdmin | null>(null)
  
  // Remove faculty, department, agency states
  const [selectedMenu, setSelectedMenu] = useState<string>('')
  const [position, setPosition] = useState<string>('')
  const [newAdminEmail, setNewAdminEmail] = useState<string>('')
  const [newAdminPhone, setNewAdminPhone] = useState<string>('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [parentMenus, setParentMenus] = useState<Menu[]>([])
  const [childMenus, setChildMenus] = useState<Menu[]>([])
  const [selectedParentMenu, setSelectedParentMenu] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Keep only necessary fetch functions
  const fetchMenus = async () => {
    try {
      const response = await fetch(`https://karsu.uz/api/menus/main/`)
      if (!response.ok) throw new Error('Failed to fetch menus')
      const data = await response.json()
      
      const parents = data.filter((menu: Menu) => !menu.parent)
      const children = data.filter((menu: Menu) => menu.parent)
      
      setParentMenus(parents)
      setChildMenus(children)
    } catch (error) {
      console.error('Error fetching menus:', error)
    }
  }

  const fetchPositions = async () => {
    try {
      const response = await fetch(`https://karsu.uz/api/menus/position/`)
      if (!response.ok) throw new Error('Failed to fetch positions')
      const data = await response.json()
      const positionsArray = Array.isArray(data) ? data : [data]
      const validPositions = positionsArray.filter(pos => pos && pos.id !== undefined)
      setPositions(validPositions)
    } catch (error) {
      console.error('Error fetching positions:', error)
    }
  }

  const handleParentMenuChange = (value: string) => {
    setSelectedParentMenu(value)
    setSelectedMenu('')
  }

  const filteredChildMenus = childMenus.filter(
    menu => menu.parent === Number(selectedParentMenu)
  )

  const handleSubmit = async (translationData: any) => {
    try {
      if (!selectedMenu || !position) {
        throw new Error('Please select Menu and Position')
      }

      setIsLoading(true)
      const formData = new FormData()
      
      formData.append('position', position)
      formData.append('menu', selectedMenu)
      formData.append('phone_number', editingAdmin?.phone_number || newAdminPhone)
      formData.append('email', editingAdmin?.email || newAdminEmail)
      formData.append('translations', JSON.stringify(translationData))
      
      if (selectedImage) {
        formData.append('main_image', selectedImage)
      }

      const url = id 
        ? `https://karsu.uz/api/menus/admin/${id}/`
        : `https://karsu.uz/api/menus/admin/`

      const response = await fetchWithAuth(url, {
        method: id ? 'PUT' : 'POST',
        body: formData,
        headers: {
          ...getAuthHeader()
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.log('API Error Response:', errorData) // For debugging
        
        if (typeof errorData === 'object') {
          // Handle API error response
          const errorMessages = Object.entries(errorData)
            .map(([field, errors]) => {
              // Handle non-translation errors
              if (field !== 'translations' && Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`
              }
              // Handle translation errors
              if (field === 'translations' && typeof errors === 'object') {
                return Object.entries(errors || {})
                  .map(([lang, langErrors]: [string, any]) => {
                    if (typeof langErrors === 'object') {
                      return Object.entries(langErrors)
                        .map(([fieldName, fieldError]) => 
                          `${fieldName} (${lang.toUpperCase()}): ${fieldError}`)
                        .join('\n')
                    }
                    return `${lang}: ${langErrors}`
                  })
                  .join('\n')
              }
              return `${field}: ${errors}`
            })
            .filter(Boolean) // Remove any undefined/empty entries
            .join('\n')
          throw new Error(errorMessages)
        } else if (typeof errorData === 'string') {
          throw new Error(errorData)
        } else {
          throw new Error('Failed to save admin. Please check your input and try again.')
        }
      }
      
      navigate('/karsu-admin-panel/menu-admins')
    } catch (error) {
      let errorMessage = 'An unexpected error occurred'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAdminDetails = async () => {
    if (!id) return
    try {
      const response = await fetch(`https://karsu.uz/api/menus/admin/${id}/`)
      if (!response.ok) throw new Error('Failed to fetch admin details')
      const data = await response.json()
      setEditingAdmin(data)
      
      // Find the child menu first
      const menuItem = childMenus.find(menu => menu.id === data.menu)
      
      // Set the menu selections
      if (menuItem) {
        setSelectedParentMenu(String(menuItem.parent))
        setSelectedMenu(String(menuItem.id))
      }
      
      // Set other fields
      setPosition(String(data.position))
      setNewAdminEmail(data.email)
      setNewAdminPhone(data.phone_number)
    } catch (error) {
      console.error('Error fetching admin details:', error)
    }
  }

  useEffect(() => {
    const initializeData = async () => {
      // First fetch menus
      await fetchMenus()
      // Then fetch admin details if we're editing
      if (id) {
        await fetchAdminDetails()
      }
    }
    
    fetchPositions()
    initializeData()
  }, [id]) // Remove currentLanguage dependency since it's not needed for initialization

  return (
    <div className="p-6 mt-[50px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {id ? 'Edit Administrator' : 'Create Administrator'}
        </h1>
        <Button variant="outline" onClick={() => navigate('/karsu-admin-panel/menu-admins')}>
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

        <TranslatedForm2
          fields={translatedFields}
          languages={['en', 'ru', 'uz', 'kk']}
          onSubmit={handleSubmit}
          initialData={editingAdmin?.translations}
          isLoading={isLoading}
        />
      </div>

      <ErrorModal
        isOpen={!!error}
        onClose={() => setError(null)}
        message={error || ''}
      />
    </div>
  )
}