import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { TranslatedForm } from '../helpers/TranslatedForm'
import { fetchWithAuth, getAuthHeader } from "../api/api"

type Language = 'en' | 'ru' | 'uz' | 'kk'

interface Translation {
  title: string
  description: string
  slug: string
}

interface Announcement {
  id: number
  date_post: string
  translations: {
    [key in Language]?: Translation
  }
}



export default function EditAnnouncement() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [layoutLanguage, setLayoutLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'ru'
  })
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)

  const fields = [
    {
      name: 'title',
      label: 'Title',
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

  const languages: Language[] = ['ru', 'en', 'uz', 'kk']

  // Initial fetch when component mounts
  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!slug) return;
      
      try {
        setIsLoading(true)
        const response = await fetch(`https://karsu.uz/api/announcements/${slug}/`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch announcement')
        }

        const data: Announcement = await response.json()
        setAnnouncement(data)
      } catch (error) {
        console.error('Error fetching announcement:', error)
        alert('Failed to fetch announcement')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnnouncement()
  }, [slug, layoutLanguage])

  // Listen for language changes from layout
  useEffect(() => {
    const handleStorageChange = () => {
      const newLanguage = localStorage.getItem('language') as Language
      if (newLanguage && newLanguage !== layoutLanguage) {
        setLayoutLanguage(newLanguage)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [layoutLanguage])

  // Transform announcement data for TranslatedForm
  const getInitialData = () => {
    if (!announcement) return {}
    
    const initialData: { [key: string]: { title: string, description: string } } = {}
    
    Object.entries(announcement.translations).forEach(([lang, translation]) => {
      if (translation) {
        initialData[lang] = {
          title: translation.title,
          description: translation.description
        }
      }
    })
    
    return initialData
  }

  async function onSubmit(formData: any) {
    try {
      if (!announcement || !slug) return

      const updatedTranslations = { ...announcement.translations }
      
      Object.entries(formData).forEach(([lang, data]: [string, any]) => {
        if (data.title && data.description) {
          const newSlug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')

          updatedTranslations[lang as Language] = {
            title: data.title,
            description: data.description,
            slug: newSlug
          }
        }
      })

      const payload = {
        translations: updatedTranslations
      }

      const response = await fetchWithAuth(`https://karsu.uz/api/announcements/${slug}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Failed to update announcement')
      }

      navigate('/karsu-admin-panel/annoucment-list')
    } catch (error) {
      console.error('Error updating announcement:', error)
      alert('Failed to update announcement')
    }
  }

  if (isLoading) {
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
          <CardTitle>Edit Announcement #{announcement?.id}</CardTitle>
        </CardHeader>
        <CardContent>
          <TranslatedForm
            fields={fields}
            languages={languages}
            onSubmit={onSubmit}
            initialData={getInitialData()}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}