import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Button } from "../components/ui/button"
import { Loader2 } from "lucide-react"
import { RichTextEditor } from '../components/ckeditor/RichTextEditor'

interface TranslatedField {
    name: string
    label: string
    type: 'text' | 'textarea' | 'richtext'
    required?: boolean
    editorConfig?: any
  }
  
  interface TranslatedFormProps {
    fields: TranslatedField[]
    languages: string[]
    onSubmit: (data: any) => void
    initialData?: any
    isLoading?: boolean
    submitButton?: React.ReactNode
    sharedFields?: string[]
  }
  
  export function TranslatedForm({ fields, languages, onSubmit, initialData, isLoading, sharedFields = [] }: TranslatedFormProps) {
    const [formData, setFormData] = useState(initialData || {})
    const [currentTab, setCurrentTab] = useState(languages[0])
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      onSubmit(formData)
    }
  
    const handleFieldChange = (language: string, fieldName: string, value: string) => {
      if (sharedFields.includes(fieldName)) {
        const newFormData = { ...formData }
        languages.forEach(lang => {
          newFormData[lang] = {
            ...newFormData[lang],
            [fieldName]: value
          }
        })
        setFormData(newFormData)
      } else {
        setFormData({
          ...formData,
          [language]: { ...formData[language], [fieldName]: value }
        })
      }
    }
  
    const renderField = (field: TranslatedField, language: string) => {
      if (field.type === 'richtext') {
        return (
          <RichTextEditor
            value={formData[language]?.[field.name] || ''}
            onChange={(content) => handleFieldChange(language, field.name, content)}
          />
        )
      }
      
      if (field.type === 'textarea') {
        return (
          <textarea
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            value={formData[language]?.[field.name] || ''}
            onChange={(e) => handleFieldChange(language, field.name, e.target.value)}
            required={field.required}
            rows={4}
          />
        )
      }
      
      return (
        <input
          type="text"
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          value={formData[language]?.[field.name] || ''}
          onChange={(e) => handleFieldChange(language, field.name, e.target.value)}
          required={field.required}
        />
      )
    }
  
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs value={currentTab} className="w-full" onValueChange={setCurrentTab}>
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${languages.length}, 1fr)` }}>
            {languages.map(lang => (
              <TabsTrigger key={lang} value={lang}>
                {lang.toUpperCase()}
              </TabsTrigger>
            ))}
          </TabsList>

          {languages.map(lang => (
            <TabsContent key={lang} value={lang} className="mt-4">
              <div className="space-y-6">
                {fields.map(field => (
                  <div key={field.name} className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderField(field, lang)}
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-[#6C5DD3] text-white hover:bg-[#5b4eb8]"
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
      </form>
    )
  }