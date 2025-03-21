import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { TranslatedForm2 } from '../helpers/TranslatedForm2'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { fetchWithAuth, getAuthHeader } from '../api/api';

interface FacultyDean {
  id: number
  position: number
  faculty: number
  phone_number: string
  email: string
  main_image: string
  menu: number
  translations: {
    [key: string]: {
      full_name: string
      biography: string
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

interface Menu {
  id: number
  parent: number | null
  translations: {
    [key: string]: {
      name: string
      title: string
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

const translatedFields = [
  { name: 'full_name', label: 'Full Name', type: 'text' as const, required: true },
  { name: 'biography', label: 'Biography', type: 'richtext' as const, required: true },
]

export function FacultyDeanFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentLanguage = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [editingDean, setEditingDean] = useState<FacultyDean | null>(null)
  
  const [selectedMenu, setSelectedMenu] = useState<string>('')
  const [selectedFaculty, setSelectedFaculty] = useState<string>('')
  const [selectedPosition, setSelectedPosition] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [selectedParentMenu, setSelectedParentMenu] = useState<string>('')
  const [parentMenus, setParentMenus] = useState<Menu[]>([])
  const [childMenus, setChildMenus] = useState<Menu[]>([])

  const fetchFaculties = async () => {
    try {
      const response = await fetch(`https://karsu.uz/api/menus/faculty/`)
      if (!response.ok) throw new Error('Failed to fetch faculties')
      const data = await response.json()
      setFaculties(data)
    } catch (error) {
      console.error('Error fetching faculties:', error)
    }
  }

  const fetchMenus = async () => {
    try {
      const response = await fetch(`https://karsu.uz/api/menus/main/`)
      if (!response.ok) throw new Error('Failed to fetch menus')
      const data = await response.json()
      
      console.log('All menus:', data)
      
      setMenus(data)
      
      const parentMenusData = data.filter((menu: Menu) => menu.parent === null)
      console.log('Parent menus:', parentMenusData)
      
      setParentMenus(parentMenusData)
    } catch (error) {
      console.error('Error fetching menus:', error)
    }
  }

  const fetchPositions = async () => {
    try {
      const response = await fetch('https://karsu.uz/api/menus/position/')
      if (!response.ok) throw new Error('Failed to fetch positions')
      const data = await response.json()
      setPositions(data)
    } catch (error) {
      console.error('Error fetching positions:', error)
    }
  }

  const fetchDeanDetails = async () => {
    if (!id) return
    try {
      const response = await fetch(`https://karsu.uz/api/menus/admin/${id}/`)
      if (!response.ok) throw new Error('Failed to fetch dean details')
      const data = await response.json()
      setEditingDean(data)
      
      // Set form fields with fetched data
      const selectedMenuData = menus.find(m => m.id === data.menu)
      
      if (selectedMenuData) {
        if (selectedMenuData.parent) {
          // If the menu has a parent, set both parent and child
          setSelectedParentMenu(selectedMenuData.parent.toString())
          // The child menu will be set automatically by the useEffect
          setSelectedMenu(selectedMenuData.id.toString())
        } else {
          // If the menu is a parent menu
          setSelectedParentMenu(selectedMenuData.id.toString())
        }
      }
      
      setSelectedFaculty(data.faculty.toString())
      setSelectedPosition(data.position.toString())
      setEmail(data.email)
      setPhoneNumber(data.phone_number)
    } catch (error) {
      console.error('Error fetching dean details:', error)
    }
  }

  useEffect(() => {
    fetchFaculties()
    fetchMenus()
    fetchPositions()
    if (id) {
      fetchDeanDetails()
    }
  }, [id])

  useEffect(() => {
    if (selectedParentMenu) {
      console.log('Selected parent menu:', selectedParentMenu)
      
      const filteredChildren = menus.filter(
        (menu: Menu) => menu.parent?.toString() === selectedParentMenu
      )
      console.log('Filtered children:', filteredChildren)
      
      setChildMenus(filteredChildren)
      
      // Only clear the selected menu if we're not in the middle of loading edit data
      if (!id) {
        setSelectedMenu('')
      }
    } else {
      setChildMenus([])
      if (!id) {
        setSelectedMenu('')
      }
    }
  }, [selectedParentMenu, menus, id])

  const handleSubmit = async (translationData: any) => {
    if (!selectedMenu || !selectedFaculty || !selectedPosition) {
      alert('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      
      formData.append('position', selectedPosition)
      formData.append('menu', selectedMenu)
      formData.append('faculty', selectedFaculty)
      formData.append('phone_number', phoneNumber)
      formData.append('email', email)
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

      if (!response.ok) throw new Error('Failed to save dean')
      
      navigate('/karsu-admin-panel/faculty-deans')
    } catch (error) {
      console.error('Error saving dean:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 mt-[50px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {id ? 'Edit Faculty Dean' : 'Create Faculty Dean'}
        </h1>
        <Button variant="outline" onClick={() => navigate('/karsu-admin-panel/faculty-deans')}>
          Back to List
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Position</label>
            <Select 
              value={selectedPosition} 
              onValueChange={(value) => {
                setSelectedPosition(value)
                const position = positions.find(p => p.id.toString() === value)
                if (position) {
                  setEmail(position.email)
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a position" />
              </SelectTrigger>
              <SelectContent className="min-w-[600px]">
                {positions.map((position) => (
                  <SelectItem 
                    key={position.id} 
                    value={position.id.toString()}
                    className="whitespace-normal py-2 break-words"
                  >
                    {position.translations[currentLanguage]?.name || `Position ${position.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Parent Menu</label>
            <Select 
              value={selectedParentMenu} 
              onValueChange={setSelectedParentMenu}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a parent menu" />
              </SelectTrigger>
              <SelectContent className="min-w-[600px]">
                {parentMenus.length > 0 ? (
                  parentMenus.map((menu) => (
                    <SelectItem 
                      key={menu.id} 
                      value={menu.id.toString()}
                      className="whitespace-normal py-2 break-words"
                    >
                      {menu.translations[currentLanguage]?.name || `Menu ${menu.id}`}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500">No parent menus available</div>
                )}
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
                {childMenus.length > 0 ? (
                  childMenus.map((menu) => (
                    <SelectItem 
                      key={menu.id} 
                      value={menu.id.toString()}
                      className="whitespace-normal py-2 break-words"
                    >
                      {menu.translations[currentLanguage]?.name || `Menu ${menu.id}`}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500">
                    {selectedParentMenu ? "No child menus available" : "Select a parent menu first"}
                  </div>
                )}
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

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              className="w-full rounded-md border border-gray-300 p-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              className="w-full rounded-md border border-gray-300 p-2"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Image</label>
            {editingDean?.main_image && (
              <img 
                src={editingDean.main_image}
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
          initialData={editingDean?.translations}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}