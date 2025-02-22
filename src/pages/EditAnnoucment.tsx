import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { TranslatedForm } from '../helpers/TranslatedForm'

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://debttracker.uz';

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
      type: 'textarea' as const,
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
        const urlSearchParams = new URLSearchParams(window.location.search);
        const id = urlSearchParams.get('id');
        
        if (!id) {
          throw new Error('Announcement ID is required');
        }

        const response = await fetch(`${API_BASE_URL}/api/announcements/${id}`, {
          headers: {
            'Accept-Language': layoutLanguage,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: Announcement = await response.json();
        setAnnouncement(data);
      } catch (error) {
        console.error('Error fetching announcement:', error);
        // Show user-friendly error message
        alert('Unable to load announcement. Please try again later.');
        navigate('/annoucment-list'); // Redirect back to list on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncement();
  }, [slug, layoutLanguage, navigate]);

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
      if (!announcement) return;

      const urlSearchParams = new URLSearchParams(window.location.search);
      const id = urlSearchParams.get('id');

      if (!id) {
        throw new Error('Announcement ID is required');
      }

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

      const response = await fetch(`${API_BASE_URL}/api/announcements/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': layoutLanguage,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to update announcement');
      }

      navigate('/annoucment-list');
    } catch (error) {
      console.error('Error updating announcement:', error);
      alert('Failed to update announcement. Please try again.');
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