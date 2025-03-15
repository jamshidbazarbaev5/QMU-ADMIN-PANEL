import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"
import { Button } from '../components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { fetchWithAuth, getAuthHeader } from "../api/api"

interface FormValues {
  name_ru: string
  name_en: string
  name_uz: string
  name_kk: string
}

export default function CreateNewsCategory() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const slug = new URLSearchParams(window.location.search).get('slug')
  const isEditMode = !!slug

  const form = useForm<FormValues>({
    defaultValues: {
      name_ru: "",
      name_en: "",
      name_uz: "",
      name_kk: "",
    },
  })

  // Fetch existing category data
  useEffect(() => {
    async function fetchCategory() {
      if (!slug) return

      setIsLoading(true)
      try {
        const response = await fetchWithAuth(`https://karsu.uz/api/news/category/${slug}/`, {
          headers: getAuthHeader()
        })
        
        if (!response.ok) throw new Error('Failed to fetch category')
        
        const data = await response.json()
        
        form.reset({
          name_ru: data.translations?.ru?.name || "",
          name_en: data.translations?.en?.name || "",
          name_uz: data.translations?.uz?.name || "",
          name_kk: data.translations?.kk?.name || "",
        })
      } catch (error) {
        console.error('Error fetching category:', error)
        alert('Failed to fetch category')
        navigate('/karsu-admin-panel/news-categories')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategory()
  }, [slug, form, navigate])

  async function onSubmit(values: FormValues) {
    try {
      
      const translations = {} as any;
    
      if (values.name_ru?.trim()) {
        translations.ru = {
          name: values.name_ru,
          slug: values.name_ru.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        };
      }
      
      if (values.name_en?.trim()) {
        translations.en = {
          name: values.name_en,
          slug: values.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        };
      }
      if (values.name_uz?.trim()) {
        translations.uz = {
          name: values.name_uz,
          slug: values.name_uz.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        };
      }
      
      if (values.name_kk?.trim()) {
        translations.kk = {
          name: values.name_kk,
          slug: values.name_kk.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        };
      }
  

      const url = isEditMode 
        ? `https://karsu.uz/api/news/category/${slug}/`
        : `https://karsu.uz/api/news/category/`

      const response = await fetchWithAuth(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ translations }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${isEditMode ? 'update' : 'create'} category`)
      }

      navigate('/karsu-admin-panel/news-categories')
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} category:`, error)
      alert(`Failed to ${isEditMode ? 'update' : 'create'} category`)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit' : 'Create'} News Category</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-4">
                  {[
                    { name: "name_ru", label: "Name (RU)" },
                    { name: "name_en", label: "Name (EN)" },
                    { name: "name_uz", label: "Name (UZ)" },
                    { name: "name_kk", label: "Name (KK)" },
                  ].map((field) => (
                    <FormField
                      key={field.name}
                      control={form.control}
                      name={field.name as keyof FormValues}
                      render={({ field: fieldProps }) => (
                        <FormItem>
                          <FormLabel>{field.label}</FormLabel>
                          <FormControl>
                            <Input {...fieldProps} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                
                <div className="flex justify-end gap-4">
                  <Button 
                    variant="outline" 
                    type="button"
                    onClick={() => navigate('/karsu-admin-panel/news-categories')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isEditMode ? 'Update' : 'Create'} Category
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}