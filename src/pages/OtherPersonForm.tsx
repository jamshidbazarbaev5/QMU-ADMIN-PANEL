import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { ErrorModal } from '../components/ui/errorModal'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import api2 from '../api/api2'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"

export function OtherPersonForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id
  
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEditMode)
  const [error, setError] = useState<string | null>(null)
  const [person, setPerson] = useState<any>(null)
  const [mainImage, setMainImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [menus, setMenus] = useState<any[]>([])
  const [selectedParentMenu, setSelectedParentMenu] = useState<string>('')
  const [selectedChildMenu, setSelectedChildMenu] = useState<string>('')

  const fetchMenus = async () => {
    try {
      const response = await api2.get('/menus/main/')
      setMenus(response.data)
    } catch (error) {
      console.error('Error fetching menus:', error)
      setError('Failed to load menus')
    }
  }

  useEffect(() => {
    // Run this effect when both menus are loaded and person data is available
    if (menus.length > 0 && person?.menu) {
      const menuItem = menus.find(m => m.id === person.menu)
      if (menuItem) {
        if (menuItem.parent) {
          // If it's a child menu, set both parent and child
          setSelectedParentMenu(menuItem.parent.toString())
          setSelectedChildMenu(menuItem.id.toString())
        } else {
          // If it's a parent menu, just set the parent
          setSelectedParentMenu(menuItem.id.toString())
        }
      }
    }
  }, [menus, person])

  const fetchPersonDetails = async () => {
    if (!id) return
    try {
      setInitialLoading(true)
      const response = await api2.get(`/publications/persons/${id}/`)
      const personData = response.data
      setPerson(personData)
      
      if (personData.main_image) {
        setImagePreview(personData.main_image)
      }
    } catch (error) {
      console.error('Error fetching person:', error)
      setError('Failed to load person details')
    } finally {
      setInitialLoading(false)
    }
  }

  useEffect(() => {
    fetchMenus()
    if (id) {
      fetchPersonDetails()
    }
  }, [id])

  const handleSubmit = async (translationData: any) => {
    if (!selectedChildMenu) {
      alert('Please select a menu');
      return;
    }

    try {
      setLoading(true);

      // Create translations object from flat data
      const translations: { [key: string]: any } = {};
      const languages = ['en', 'ru', 'uz', 'kk'];
      
      languages.forEach(lang => {
        const langData: { [key: string]: string } = {};
        translatedFields.forEach(field => {
          const value = translationData[`${field.name}_${lang}`];
          if (value) {
            langData[field.name] = value;
          }
        });
        if (Object.keys(langData).length > 0) {
          translations[lang] = langData;
        }
      });

      // Check if any language has valid full_name
      const hasValidTranslation = Object.values(translations).some(
        (translation) => translation.full_name && translation.full_name.trim() !== ''
      );

      if (!hasValidTranslation) {
        throw new Error("At least one translation with full name must be provided");
      }

      const formData = new FormData();
      formData.append('menu', selectedChildMenu);
      formData.append('translations', JSON.stringify(translations));

      if (mainImage) {
        formData.append('main_image', mainImage);
      }

      const url = id ? `/publications/persons/${id}/` : '/publications/persons/'

      await api2({
        method: id ? 'put' : 'post',
        url,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      navigate(`/karsu-new-admin-panel/other-people`);
    } catch (error) {
      console.error('Error saving person:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const translatedFields = [
    {
      name: 'full_name',
      label: 'Full Name',
      type: 'text' as const,
      required: true
    },
    {
      name: 'description',
      label: 'Description',
      type: 'richtext' as const,
      required: true
    }
  ]

  if (initialLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{id ? 'Edit Person' : 'Add New Person'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Parent Menu
                </label>
                <Select
                  value={selectedParentMenu}
                  onValueChange={(value) => {
                    setSelectedParentMenu(value);
                    setSelectedChildMenu('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Parent Menu" />
                  </SelectTrigger>
                  <SelectContent>
                    {menus
                      .filter(menu => !menu.parent)
                      .map((menu) => (
                        <SelectItem key={menu.id} value={menu.id.toString()}>
                          {menu.translations.kk.name}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Child Menu
                </label>
                <Select
                  value={selectedChildMenu}
                  onValueChange={(value) => setSelectedChildMenu(value)}
                  disabled={!selectedParentMenu}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Child Menu" />
                  </SelectTrigger>
                  <SelectContent>
                    {menus
                      .filter(menu => menu.parent === Number(selectedParentMenu))
                      .map((menu) => (
                        <SelectItem key={menu.id} value={menu.id.toString()}>
                          {menu.translations.kk.name}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Main Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setMainImage(file)
                    setImagePreview(URL.createObjectURL(file))
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#6C5DD3] file:text-white hover:file:bg-[#5b4eb8]"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded"
                  />
                </div>
              )}
            </div>

            <TranslatedForm
              fields={translatedFields}
              languages={['en', 'ru', 'uz', 'kk']}
              onSubmit={handleSubmit}
              isLoading={loading}
              initialData={person?.translations}
            />
          </div>
        </CardContent>
      </Card>

      <ErrorModal
        isOpen={!!error}
        onClose={() => setError(null)}
        message={error || ''}
      />
    </div>
  )
}