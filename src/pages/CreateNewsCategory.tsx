import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"
import { Button } from '../components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { getAuthHeader } from "../api/api"

interface FormValues {
  name_ru: string
  name_en: string
  name_uz: string
  name_kk: string
}

export default function CreateNewsCategory() {
  const navigate = useNavigate()
  const [] = useState<string>(() => {
    return localStorage.getItem('language') || 'ru'
  })

  const form = useForm<FormValues>({
    defaultValues: {
      name_ru: "",
      name_en: "",
      name_uz: "",
      name_kk: "",
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      const translations = {
        ru: {
          name: values.name_ru,
          slug: values.name_ru.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        },
        en: {
          name: values.name_en,
          slug: values.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        },
        uz: {
          name: values.name_uz,
          slug: values.name_uz.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        },
        kk: {
          name: values.name_kk,
          slug: values.name_kk.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        }
      }

      const response = await fetch(`https://debttracker.uz/news/category/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ translations }),
      })

      if (!response.ok) {
        throw new Error('Failed to create category')
      }

      navigate('/news-categories')
    } catch (error) {
      console.error('Error creating category:', error)
      alert('Failed to create category')
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create News Category</CardTitle>
        </CardHeader>
        <CardContent>
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
                  onClick={() => navigate('/news-categories')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Category
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}