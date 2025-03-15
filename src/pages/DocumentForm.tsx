import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { Button } from '../components/ui/button'
import { fetchWithAuth, getAuthHeader } from "../api/api.ts"
import { Card, CardContent } from '../components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"

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
  menu_posts: any[]
}

interface Document {
  id: number
  menu: number
  footer_menu: number | null
  file: string
  date_post: string
  translations: {
    [key: string]: {
      title: string | null
      description: string | null
    }
  }
}

interface Translations {
  [key: string]: {
    title: string | null;
    description: string | null;
  }
}

const translatedFields = [
  { name: 'title', label: 'Title', type: 'text' as const, required: true },
  { name: 'description', label: 'Description', type: 'richtext' as const, required: true },
]

// Helper function to check if a translation has content
const hasTranslationContent = (translation: any): boolean => {
  if (!translation) return false;
  
  return Object.values(translation).some(value => {
    if (typeof value === 'string') {
      // Remove HTML tags and trim whitespace for rich text
      const cleanValue = value.replace(/<[^>]*>/g, '').trim();
      return cleanValue.length > 0;
    }
    return false;
  });
};

export function DocumentForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [document, setDocument] = useState<Document | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [menus, setMenus] = useState<Menu[]>([])
  const [selectedMenu, setSelectedMenu] = useState<number | null>(null)
  const currentLanguage = useLanguage()
  const languages = ['en', 'ru', 'uz', 'kk']

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await fetchWithAuth('https://karsu.uz/api/menus/main/', {
          headers: getAuthHeader(),
        })
        if (!response.ok) throw new Error('Failed to fetch menus')
        const data = await response.json()
        setMenus(data)
      } catch (error) {
        console.error('Error fetching menus:', error)
      }
    }

    fetchMenus()
  }, [])

  useEffect(() => {
    if (id) {
      const fetchDocument = async () => {
        try {
          const response = await fetchWithAuth(`https://karsu.uz/api/menus/document/${id}/`, {
            headers: getAuthHeader(),
          })
          if (!response.ok) throw new Error('Failed to fetch document')
          const data = await response.json()
          
          // Create translations object with default values if missing
          const translations = languages.reduce((acc, lang) => {
            acc[lang] = {
              title: data.translations?.[lang]?.title || '',
              description: data.translations?.[lang]?.description || ''
            }
            return acc
          }, {} as Translations)
          
          setDocument({
            ...data,
            translations
          })
          setSelectedMenu(data.menu)
        } catch (error) {
          console.error('Error fetching document:', error)
        }
      }
      fetchDocument()
    }
  }, [id])

  console.log('Document translations:', document?.translations)

  const handleSubmit = async (translationData: any) => {
    if (!selectedMenu) {
      alert('Please select a menu')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('menu', selectedMenu.toString())
      
      // Filter out empty translations
      const filledTranslations = Object.entries(translationData).reduce((acc, [lang, data]) => {
        if (hasTranslationContent(data)) {
          acc[lang] = data;
        }
        return acc;
      }, {} as any);
      
      formData.append('translations', JSON.stringify(filledTranslations))
      
      if (selectedFile) {
        formData.append('file', selectedFile)
      }

      const url = id 
        ? `https://karsu.uz/api/menus/document/${id}/`
        : `https://karsu.uz/api/menus/document/`

      const response = await fetchWithAuth(url, {
        method: id ? 'PUT' : 'POST',
        body: formData,
        headers: {
          ...getAuthHeader(),
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Server Error Response:', errorData)
        throw new Error('Failed to save document')
      }

      navigate('/karsu-admin-panel/document')
    } catch (error) {
      console.error('Error saving document:', error)
      alert('Failed to save document')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 mt-[50px]">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/karsu-admin-panel//documents')}>
          Back to Documents
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {id ? 'Edit Document' : 'Create Document'}
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Menu *</label>
            <Select
              value={selectedMenu?.toString()}
              onValueChange={(value) => setSelectedMenu(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a menu" />
              </SelectTrigger>
              <SelectContent>
                {menus.map((menu) => (
                  <SelectItem key={menu.id} value={menu.id.toString()}>
                    {menu.translations[currentLanguage]?.name || 'Untitled Menu'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">File</label>
            {document && (
              <div className="mb-2">
                <a 
                  href={document.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Current File
                </a>
              </div>
            )}
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full"
            />
          </div>

          <TranslatedForm
            fields={translatedFields}
            languages={languages}
            onSubmit={handleSubmit}
            initialData={document?.translations}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}