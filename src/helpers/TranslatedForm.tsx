import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Editor } from '@tinymce/tinymce-react'

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
            <TabsContent key={lang} value={lang} className="mt-4">
              <div className="space-y-6">
                {fields.map(field => (
                  <div key={field.name} className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.type === 'richtext' ? (
                      <div className="min-h-[200px] border rounded-md">
                        <Editor
                          apiKey="fu6z5mrrefbmryy7w66yyh4653o1rh9pxrukdby6v1nlozuj"
                          init={{
                            height: 300,
                            menubar: false,
                            plugins: [
                              'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
                              'searchreplace', 'visualblocks', 'code', 'fullscreen',
                              'insertdatetime', 'table', 'code', 'help', 'wordcount'
                            ],
                            toolbar: 'undo redo | formatselect | ' +
                              'bold italic | alignleft aligncenter ' +
                              'alignright alignjustify | bullist numlist | ' +
                              'removeformat | help',
                            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                          }}
                          value={formData[lang]?.[field.name] || ''}
                          onEditorChange={(content) => {
                            setFormData({
                              ...formData,
                              [lang]: { ...formData[lang], [field.name]: content }
                            })
                          }}
                        />
                      </div>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                        value={formData[lang]?.[field.name] || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          [lang]: { ...formData[lang], [field.name]: e.target.value }
                        })}
                        required={field.required}
                        rows={4}
                      />
                    ) : (
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
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