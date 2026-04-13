"use client"

import { useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from '../components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { fetchWithAuth, getAuthHeader } from "../api/api"
import { RichTextEditor } from '../components/ckeditor/RichTextEditor'
import { useNavigate } from "react-router-dom"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs"



const formatDateForServer = (date: string, time: string) => {
  // Create date object in local timezone
  const localDate = new Date(`${date}T${time}`);
  // Convert to UTC
  return localDate.toISOString();
}

export default function CreateAnnouncement() {
  const form = useForm({
    defaultValues: {
      title_ru: "",
      description_ru: "",
      title_en: "",
      description_en: "",
      title_uz: "",
      description_uz: "",
      title_kk: "",
      description_kk: "",
      date_posted_date: new Date().toISOString().split('T')[0],
      date_posted_time: new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit'
      }),
      date_post: new Date().toISOString(),
    },
  })

  const navigate = useNavigate()
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const handleFileUpload = (file: File) => {
    setUploadedFiles(prev => [...prev, file])
  }

  async function onSubmit(values: any) {
    try {
      // Create translations object
      const translations: { [key: string]: any } = {}
      
      // Only add languages that have content
      if (values.title_ru?.trim() || values.description_ru?.trim()) {
        translations.ru = {
          title: values.title_ru,
          description: values.description_ru,
        }
      }
      
      if (values.title_en?.trim() || values.description_en?.trim()) {
        translations.en = {
          title: values.title_en,
          description: values.description_en,
        }
      }
      
      if (values.title_uz?.trim() || values.description_uz?.trim()) {
        translations.uz = {
          title: values.title_uz,
          description: values.description_uz,
        }
      }
      
      if (values.title_kk?.trim() || values.description_kk?.trim()) {
        translations.kk = {
          title: values.title_kk,
          description: values.description_kk,
        }
      }

      // Create FormData
      const formData = new FormData()
      formData.append('translations', JSON.stringify(translations))
      formData.append('date_post', values.date_post)

      // Add uploaded files
      uploadedFiles.forEach(file => {
        formData.append('upload_files', file)
      })

      const response = await fetchWithAuth('https://karsu.uz/api/announcements/', {
        method: 'POST',
        headers: {
          ...getAuthHeader()
        },
        body: formData,
      })

      if (response.ok) {
        form.reset()
      navigate('/karsu-new-admin-panel/annoucment-list')
      } else {
        const errorData = await response.json()
        console.error('Validation errors:', errorData)
      }
    } catch (error) {
      console.error('Error creating announcement:', error)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Yangi E'lon Yaratish</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date_posted_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publication Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value)
                            const newDateTime = formatDateForServer(
                              e.target.value,
                              form.getValues('date_posted_time')
                            )
                            form.setValue('date_post', newDateTime)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_posted_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publication Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value)
                            const newDateTime = formatDateForServer(
                              form.getValues('date_posted_date'),
                              e.target.value
                            )
                            form.setValue('date_post', newDateTime)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Tabs defaultValue="ru" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="ru">Russian</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="uz">Uzbek</TabsTrigger>
                  <TabsTrigger value="kk">Karakalpak</TabsTrigger>
                </TabsList>

                <TabsContent value="ru" className="space-y-8">
                  <FormField
                    control={form.control}
                    name="title_ru"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sarlavha (RU)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter title in Russian" {...field} />
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
                        <FormLabel>Tavsif (RU)</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}
                            onFileUpload={handleFileUpload}
                            placeholder="Enter description in Russian"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="en" className="space-y-8">
                  <FormField
                    control={form.control}
                    name="title_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title (EN)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter title in English" {...field} />
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
                          <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}
                            onFileUpload={handleFileUpload}
                            placeholder="Enter description in English"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="uz" className="space-y-8">
                  <FormField
                    control={form.control}
                    name="title_uz"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sarlavha (UZ)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter title in Uzbek" {...field} />
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
                        <FormLabel>Tavsif (UZ)</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}
                            onFileUpload={handleFileUpload}
                            placeholder="Enter description in Uzbek"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="kk" className="space-y-8">
                  <FormField
                    control={form.control}
                    name="title_kk"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title (KK)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter title in Karakalpak" {...field} />
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
                          <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}
                            onFileUpload={handleFileUpload}
                            placeholder="Enter description in Karakalpak"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-4">
                <Button variant="outline" type="button" onClick={() => navigate(-1)}>Bekor qilish</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

