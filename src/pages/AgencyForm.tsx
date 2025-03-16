import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Loader2 } from 'lucide-react'
import {fetchWithAuth, getAuthHeader} from '../api/api';

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

const translatedFields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: false },
  { name: 'description', label: 'Description', type: 'richtext' as const, required: false },
//   { name: 'slug', label: 'Slug', type: 'text' as const, required: true }
]

export default function AgencyForm() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const currentLanguage = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [menus, setMenus] = useState<Menu[]>([])
  const [selectedMenu, setSelectedMenu] = useState<number | null>(null)
  const [initialData, setInitialData] = useState(null)
  const [existingImage, setExistingImage] = useState<string | null>(null)

  useEffect(() => {
    fetchMenus()
    if (slug) {
      fetchAgency()
    }
  }, [slug, currentLanguage])

  const fetchMenus = async () => {
    try {
      const response = await fetchWithAuth(`https://karsu.uz/api/menus/main/`,{
        headers:getAuthHeader()
      })
      if (!response.ok) throw new Error('Failed to fetch menus')
      const data = await response.json()
      setMenus(data)
    } catch (error) {
      console.error('Error fetching menus:', error)
    }
  }

  const fetchAgency = async () => {
    try {
      setIsLoading(true)
      const response = await fetchWithAuth(`https://karsu.uz/api/menus/agency/${slug}/`, {
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error('Failed to fetch agency')
      const data = await response.json()
      setSelectedMenu(data.menu)
      setInitialData(data.translations)
      setExistingImage(data.main_image)
    } catch (error) {
      console.error('Error fetching agency:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: any) => {
    if (!selectedMenu) {
      alert('Please select a menu')
      return
    }

    setIsLoading(true)
    try {
      // Filter out empty translations
      const filteredTranslations = Object.entries(data.translations).reduce((acc, [lang, trans]: [string, any]) => {
        // Check if translation has any non-empty values
        if (trans.name || trans.description || trans.slug) {
          acc[lang] = trans
        }
        return acc
      }, {} as Record<string, any>)

      const formData = new FormData()
      formData.append('menu', selectedMenu.toString())
      formData.append('translations', JSON.stringify(filteredTranslations))
      
      if (selectedImage) {
        formData.append('main_image', selectedImage)
      }

      const url = slug 
        ? `https://karsu.uz/api/menus/agency/${slug}/`
        : `https://karsu.uz/api/menus/agency/`

      const response = await fetchWithAuth(url, {
        method: slug ? 'PUT' : 'POST',
        headers: {
          'Accept': 'application/json',
          ...getAuthHeader()
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save agency')
      }
      
      navigate('/karsu-admin-panel/agency')
    } catch (error) {
      console.error('Error saving agency:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && slug) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6C5DD3]" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{slug ? 'Edit' : 'Create'} Agency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Menu</label>
              <Select
                value={selectedMenu?.toString() || ""}
                onValueChange={(value) => setSelectedMenu(Number(value))}
              >
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
              {existingImage && (
                <div className="mb-2">
                  <img 
                    src={existingImage}
                    alt="Current"
                    className="w-20 h-20 object-cover rounded"
                  />
                  <p className="text-sm text-gray-500 mt-1">Current image</p>
                </div>
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
            initialData={initialData}
            isLoading={isLoading}
          />

          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/karsu-admin-panel/agencies')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}