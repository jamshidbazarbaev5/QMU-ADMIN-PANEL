"use client"

import { useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"
import { useState } from "react"

import { Button } from '../components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import {fetchWithAuth, getAuthHeader} from "../api/api"
import { RichTextEditor } from '../components/ckeditor/RichTextEditor'
import {useNavigate} from "react-router-dom";



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
    },
  })

  const navigate = useNavigate()

  const [currentLanguage, setCurrentLanguage] = useState<'ru' | 'en' | 'uz' | 'kk'>('ru')

  async function onSubmit(values: any) {
    try {
      if (currentLanguage === 'kk') {
        // Create translations object
        const translations: { [key: string]: any } = {};
        
        // Only add languages that have content
        if (values.title_ru?.trim() || values.description_ru?.trim()) {
          translations.ru = {
            title: values.title_ru,
            description: values.description_ru,
          };
        }
        
        if (values.title_en?.trim() || values.description_en?.trim()) {
          translations.en = {
            title: values.title_en,
            description: values.description_en,
          };
        }
        
        if (values.title_uz?.trim() || values.description_uz?.trim()) {
          translations.uz = {
            title: values.title_uz,
            description: values.description_uz,
          };
        }
        
        if (values.title_kk?.trim() || values.description_kk?.trim()) {
          translations.kk = {
            title: values.title_kk,
            description: values.description_kk,
          };
        }

        const payload = {
          translations: translations
        };

        const response = await fetchWithAuth('https://karsu.uz/api/announcements/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          },
          body: JSON.stringify(payload),
        })

        if (response.ok) {
          form.reset()
          setCurrentLanguage('ru')
          navigate('/karsu-admin-panel/annoucment-list')
        } else {
          const errorData = await response.json()
          console.error('Validation errors:', errorData)
        }
      } else {
        if (currentLanguage === 'ru') setCurrentLanguage('en')
        else if (currentLanguage === 'en') setCurrentLanguage('uz')
        else if (currentLanguage === 'uz') setCurrentLanguage('kk')
      }
    } catch (error) {
      console.error('Error creating announcement:', error)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Yangi E'lon Yaratish - {currentLanguage.toUpperCase()} Version</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {currentLanguage === 'ru' && (
                <div className="space-y-8">
                  <FormField
                    control={form.control}
                    name="title_ru"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sarlavha (RU)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter title in Russian" {...field} required={false} />
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
                            placeholder="Enter description in Russian"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentLanguage === 'en' && (
                <div className="space-y-8">
                  <FormField
                    control={form.control}
                    name="title_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title (EN)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter title in English" {...field} required={false}/>
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
                            placeholder="Enter description in English"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentLanguage === 'uz' && (
                <div className="space-y-8">
                  <FormField
                    control={form.control}
                    name="title_uz"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sarlavha (UZ)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter title in Uzbek" {...field} required={false}/>
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
                            placeholder="Enter description in Uzbek"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentLanguage === 'kk' && (
                <div className="space-y-8">
                  <FormField
                    control={form.control}
                    name="title_kk"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Тақырып (KK)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter title in Kazakh" {...field} required={false}/>
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
                        <FormLabel>Сипаттама (KK)</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Enter description in Kazakh"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="flex justify-end gap-4">
                <Button variant="outline">Bekor qilish</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {currentLanguage === 'kk' ? 'Finish' : 'Next Language'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

