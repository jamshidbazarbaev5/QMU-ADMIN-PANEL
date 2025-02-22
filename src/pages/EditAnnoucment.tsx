import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"
import { Button } from '../components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"

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

interface FormValues {
  title_ru: string;
  description_ru: string;
  title_en: string;
  description_en: string;
  title_uz: string;
  description_uz: string;
  title_kk: string;
  description_kk: string;
}

export default function EditAnnouncement() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [layoutLanguage, setLayoutLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'ru'
  })
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)

  const form = useForm<FormValues>({
    defaultValues: {
      title_ru: "",
      description_ru: "",
      title_en: "",
      description_en: "",
      title_uz: "",
      description_uz: "",
      title_kk: "",
      description_kk: "",
    },
  })

  // Initial fetch when component mounts
  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!slug) return;
      
      try {
        setIsLoading(true)
        const response = await fetch(`https://debttracker.uz/${layoutLanguage}/announcements/${slug}/`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch announcement')
        }

        const data: Announcement = await response.json()
        setAnnouncement(data)

        // Populate form with all available translations
        Object.entries(data.translations).forEach(([lang, translation]) => {
          if (translation && (lang === 'ru' || lang === 'en' || lang === 'uz' || lang === 'kk')) {
            form.setValue(`title_${lang}` as keyof FormValues, translation.title)
            form.setValue(`description_${lang}` as keyof FormValues, translation.description)
          }
        })
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

  async function onSubmit(values: FormValues) {
    try {
      if (!announcement || !slug) return

      const updatedTranslations = { ...announcement.translations }
      
      const languages: Language[] = ['ru', 'en', 'uz', 'kk']
      languages.forEach((lang) => {
        const titleKey = `title_${lang}` as keyof FormValues
        const descriptionKey = `description_${lang}` as keyof FormValues

        if (values[titleKey] && values[descriptionKey]) {
          const newSlug = values[titleKey]
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')

          updatedTranslations[lang] = {
            title: values[titleKey],
            description: values[descriptionKey],
            slug: newSlug
          }
        }
      })

      const payload = {
        translations: updatedTranslations
      }

      const response = await fetch(`https://debttracker.uz/${layoutLanguage}/announcements/${slug}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Failed to update announcement')
      }

      navigate('/annoucment-list')
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Russian Fields */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-bold">Russian</h3>
                <FormField
                  control={form.control}
                  name="title_ru"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (RU)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description_ru"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (RU)</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* English Fields */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-bold">English</h3>
                <FormField
                  control={form.control}
                  name="title_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (EN)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (EN)</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Uzbek Fields */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-bold">O'zbekcha</h3>
                <FormField
                  control={form.control}
                  name="title_uz"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (UZ)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description_uz"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (UZ)</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Kazakh Fields */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-bold">Қазақша</h3>
                <FormField
                  control={form.control}
                  name="title_kk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (KK)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description_kk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (KK)</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end gap-4">
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => navigate('/annoucment-list')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}