import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { fetchWithAuth, getAuthHeader } from '../api/api'

interface AgencyDean {
  id: number
  position: number
  agency: number
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

interface Agency {
  id: number
  translations: {
    [key: string]: {
      name: string
    }
  }
}

interface Menu {
  id: number
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

export function AgencyDeanFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentLanguage = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [editingDean, setEditingDean] = useState<AgencyDean | null>(null)
  
  const [selectedMenu, setSelectedMenu] = useState<string>('')
  const [selectedAgency, setSelectedAgency] = useState<string>('')
  const [selectedPosition, setSelectedPosition] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [positions, setPositions] = useState<Position[]>([])

  // Fetch functions
  const fetchAgencies = async () => {
    try {
      const response = await fetch(`https://karsu.uz/api/menus/agency/`)
      if (!response.ok) throw new Error('Failed to fetch agencies')
      const data = await response.json()
      setAgencies(data)
    } catch (error) {
      console.error('Error fetching agencies:', error)
    }
  }

  const fetchMenus = async () => {
    try {
      const response = await fetch(`https://karsu.uz/api/menus/main/`)
      if (!response.ok) throw new Error('Failed to fetch menus')
      const data = await response.json()
      setMenus(data)
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
      
      setSelectedMenu(data.menu.toString())
      setSelectedAgency(data.agency.toString())
      setSelectedPosition(data.position.toString())
      setEmail(data.email)
      setPhoneNumber(data.phone_number)
    } catch (error) {
      console.error('Error fetching dean details:', error)
    }
  }

  useEffect(() => {
    fetchAgencies()
    fetchMenus()
    fetchPositions()
    if (id) {
      fetchDeanDetails()
    }
  }, [id])

  const handleSubmit = async (translationData: any) => {
    if (!selectedMenu || !selectedAgency || !selectedPosition) {
      alert('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      
      formData.append('position', selectedPosition)
      formData.append('menu', selectedMenu)
      formData.append('agency', selectedAgency)
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
      
      navigate('/karsu-admin-panel/agency-deans')
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
          {id ? 'Edit Agency Dean' : 'Create Agency Dean'}
        </h1>
        <Button variant="outline" onClick={() => navigate('/karsu-admin-panel/agency-deans')}>
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

        <TranslatedForm
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