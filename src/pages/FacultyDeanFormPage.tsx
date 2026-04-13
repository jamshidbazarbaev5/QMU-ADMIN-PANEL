import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { TranslatedForm2 } from '../helpers/TranslatedForm2'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import api2 from '../api/api2'
import axios from 'axios'

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
      let allFaculties: Faculty[] = [];
      let nextUrl: string | null = 'https://karsu.uz/api/menus/faculty/';
      
      while (nextUrl) {
        const response :any = await fetch(nextUrl);
        if (!response.ok) throw new Error('Failed to fetch faculties');
        
        const data = await response.json();
        
        if (data.results && Array.isArray(data.results)) {
          allFaculties = [...allFaculties, ...data.results];
          nextUrl = data.next;
        } else if (Array.isArray(data)) {
          allFaculties = [...allFaculties, ...data];
          nextUrl = null;
        } else {
          nextUrl = null;
        }
      }
      
      setFaculties(allFaculties);
    } catch (error) {
      console.error('Error fetching faculties:', error);
      // Set empty array on error to prevent mapping issues
      setFaculties([]);
    }
  }

  const fetchMenus = async () => {
    try {
      const { data } = await api2.get('/menus/main/')
      console.log('All menus:', data)
      setMenus(data)
      
      // Log each menu with its parent relationship for debugging
      data.forEach((menu: Menu) => {
        console.log(`Menu ${menu.id}: ${menu.translations.en?.name || 'No name'} - Parent: ${menu.parent || 'None'}`)
      })
      
      const parentMenusData = data.filter((menu: Menu) => menu.parent === null)
      console.log('Parent menus:', parentMenusData)
      setParentMenus(parentMenusData)
    } catch (error) {
      console.error('Error fetching menus:', error)
    }
  }

  const fetchPositions = async () => {
    try {
      let allPositions: Position[] = [];
      let nextUrl: string | null = 'https://karsu.uz/api/menus/position/';
      
      while (nextUrl) {
        const response :any = await fetch(nextUrl);
        if (!response.ok) throw new Error('Failed to fetch positions');
        
        const data = await response.json();
        
        if (data.results && Array.isArray(data.results)) {
          allPositions = [...allPositions, ...data.results];
          nextUrl = data.next;
        } else if (Array.isArray(data)) {
          allPositions = [...allPositions, ...data];
          nextUrl = null;
        } else {
          nextUrl = null;
        }
      }
      
      setPositions(allPositions);
    } catch (error) {
      console.error('Error fetching positions:', error);
      // Set empty array on error to prevent mapping issues
      setPositions([]);
    }
  }

  const fetchDeanDetails = async () => {
    if (!id) return
    try {
      const { data } = await api2.get(`/menus/admin/${id}/`)
      console.log('Dean details:', data)
      setEditingDean(data)
      
      // Set faculty, position, email and phone
      setSelectedFaculty(data.faculty.toString())
      setSelectedPosition(data.position.toString())
      setEmail(data.email)
      setPhoneNumber(data.phone_number)
      
      // Wait for menus to be loaded before setting menu selections
      if (menus.length === 0) {
        // If menus aren't loaded yet, fetch them first
        const menusResponse = await api2.get('/menus/main/')
        const menusData = menusResponse.data
        setMenus(menusData)
        
        // Set parent menus
        const parentMenusData = menusData.filter((menu: Menu) => menu.parent === null)
        setParentMenus(parentMenusData)
        
        // Find the selected menu
        if (data.menu) {
          const selectedMenuData = menusData.find((m: Menu) => m.id === data.menu)
          
          if (selectedMenuData) {
            // If it has a parent, it's a child menu
            if (selectedMenuData.parent !== null) {
              setSelectedParentMenu(selectedMenuData.parent.toString())
              setSelectedMenu(data.menu.toString())
              
              // Set child menus for this parent
              const childMenusData = menusData.filter(
                (m: Menu) => m.parent?.toString() === selectedMenuData.parent?.toString()
              )
              setChildMenus(childMenusData)
            } else {
              // It's a parent menu
              setSelectedParentMenu(data.menu.toString())
              
              // Set child menus for this parent
              const childMenusData = menusData.filter(
                (m: Menu) => m.parent?.toString() === data.menu.toString()
              )
              setChildMenus(childMenusData)
            }
          }
        }
      } else {
        // Menus are already loaded
        if (data.menu) {
          const selectedMenuData = menus.find(m => m.id === data.menu)
          
          if (selectedMenuData) {
            if (selectedMenuData.parent !== null) {
              // It's a child menu
              setSelectedParentMenu(selectedMenuData.parent.toString())
              setSelectedMenu(data.menu.toString())
            } else {
              // It's a parent menu
              setSelectedParentMenu(data.menu.toString())
            }
          }
        }
      }
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
      const filteredChildren = menus.filter(
        (menu: Menu) => menu.parent?.toString() === selectedParentMenu
      )
      setChildMenus(filteredChildren)
      
      // Only reset selectedMenu if we're not in edit mode
      if (!id && !editingDean) {
        setSelectedMenu('')
      }
    } else {
      setChildMenus([])
      if (!id && !editingDean) {
        setSelectedMenu('')
      }
    }
  }, [selectedParentMenu, menus, id, editingDean])

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

      // Filter out empty translations
      const filteredTranslations = Object.fromEntries(
        Object.entries(translationData).filter(([_, translation]) => {
          const translationObj = translation as { title?: string, full_name?: string, biography?: string }
          return Object.values(translationObj).some(value => value && value.trim() !== '')
        })
      )

      formData.append('translations', JSON.stringify(filteredTranslations))
      
      if (selectedImage) {
        formData.append('main_image', selectedImage)
      }

      const url = id ? `/menus/admin/${id}/` : '/menus/admin/'
      const method = id ? 'put' : 'post'

      await api2({
        method,
        url,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },  
      })

      navigate('/karsu-new-admin-panel/faculty-deans')
    } catch (error) {
      console.error('Error saving dean:', error)
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.detail || 'Failed to save dean')
      } else {
        alert('An unexpected error occurred')
      }
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
                {positions && positions.length > 0 ? (
                  positions.map((position) => (
                    <SelectItem 
                      key={position.id} 
                      value={position.id.toString()}
                      className="whitespace-normal py-2 break-words"
                    >
                      {position.translations[currentLanguage]?.name || `Position ${position.id}`}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500">No positions available</div>
                )}
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
                {faculties && faculties.length > 0 ? (
                  faculties.map((faculty) => (
                    <SelectItem 
                      key={faculty.id} 
                      value={faculty.id.toString()}
                      className="whitespace-normal py-2 break-words"
                    >
                      {faculty.translations[currentLanguage]?.name || `Faculty ${faculty.id}`}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500">No faculties available</div>
                )}
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