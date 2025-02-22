import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"

interface TranslatedField {
    name: string
    label: string
    type: 'text' | 'textarea'
    required?: boolean
  }
  
  interface TranslatedFormProps {
    fields: TranslatedField[]
    languages: string[]
    onSubmit: (data: any) => void
    initialData?: any
    isLoading?: boolean
  }
  
  export function TranslatedForm({ fields, languages, onSubmit, initialData, isLoading }: TranslatedFormProps) {
    const [formData, setFormData] = useState(initialData || {})
    const [currentTab, setCurrentTab] = useState(languages[0])
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      onSubmit(formData)
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
            <TabsContent key={lang} value={lang}>
              <div className="space-y-4">
                {fields.map(field => (
                  <div key={field.name} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        value={formData[lang]?.[field.name] || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          [lang]: { ...formData[lang], [field.name]: e.target.value }
                        })}
                        required={field.required}
                      />
                    ) : (
                      <input
                        type={field.type}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        value={formData[lang]?.[field.name] || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          [lang]: { ...formData[lang], [field.name]: e.target.value }
                        })}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#6C5DD3] hover:bg-[#5b4eb8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6C5DD3]"
        >
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      </form>
    )
  }