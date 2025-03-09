import { useState, useEffect } from 'react'
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

// Add this interface to define the structure of form data
interface FormDataType {
  [language: string]: {
    [fieldName: string]: string;
  };
}

export function TranslatedForm({ fields, languages, onSubmit, initialData, isLoading, sharedFields = [] }: TranslatedFormProps) {
  console.log('TranslatedForm props:', {
    fields,
    languages,
    initialData,
    sharedFields
  });

  const [formData, setFormData] = useState<FormDataType>(() => {
    console.log('Initializing formData with:', { initialData });
    if (initialData) {
      // Create a copy of initialData
      const data = {...initialData};
      console.log('Initial data copy:', data);
      
      // For shared fields, ensure they exist in all languages
      languages.forEach(lang => {
        data[lang] = data[lang] || {};
        
        // Copy shared fields from any language that has them to all languages
        sharedFields.forEach(fieldName => {
          // Find the first language that has this field value
          const sourceLanguage = languages.find(l => data[l]?.[fieldName]);
          console.log(`Looking for ${fieldName} in languages:`, {
            sourceLanguage,
            value: sourceLanguage ? data[sourceLanguage][fieldName] : undefined
          });
          
          if (sourceLanguage) {
            data[lang][fieldName] = data[sourceLanguage][fieldName];
          }
        });
        
        // Initialize any missing fields
        fields.forEach(field => {
          if (data[lang][field.name] === undefined) {
            data[lang][field.name] = '';
          }
        });
      });
      
      console.log('Initialized form data:', data);
      return data;
    }
    
    // Initialize empty form data
    const emptyData: FormDataType = {};
    languages.forEach(lang => {
      emptyData[lang] = {};
      fields.forEach(field => {
        emptyData[lang][field.name] = '';
      });
    });
    console.log('Created empty form data:', emptyData);
    return emptyData;
  });

  useEffect(() => {
    if (!initialData) return; 
    
    const data = {...initialData};
    
    languages.forEach(lang => {
      data[lang] = data[lang] || {};
      
      sharedFields.forEach(fieldName => {
        const sourceLanguage = languages.find(l => data[l]?.[fieldName]);
        console.log(`Processing shared field ${fieldName}:`, {
          sourceLanguage,
          value: sourceLanguage ? data[sourceLanguage][fieldName] : undefined
        });
        
        if (sourceLanguage) {
          data[lang][fieldName] = data[sourceLanguage][fieldName];
        }
      });
      
      fields.forEach(field => {
        if (data[lang][field.name] === undefined) {
          data[lang][field.name] = '';
        }
      });
    });
    
    console.log('Setting new form data:', data);
    setFormData(data);
  }, [initialData]); // Only depend on initialData

  console.log('TranslatedForm formData:', formData)

  const [currentTab, setCurrentTab] = useState(languages[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submitting form data:', formData)
    onSubmit(formData)
  }

  const handleFieldChange = (language: string, fieldName: string, value: string) => {
    if (sharedFields.includes(fieldName)) {
      const newFormData: FormDataType = { ...formData }
      languages.forEach(lang => {
        newFormData[lang] = {
          ...newFormData[lang],
          [fieldName]: value
        }
      })
      setFormData(newFormData)
    } else {
      setFormData((prev: FormDataType) => ({
        ...prev,
        [language]: { 
          ...prev[language], 
          [fieldName]: value 
        }
      }))
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
              Сохранение...
            </>
          ) : (
            'Сохранить'
          )}
        </Button>
      </div>
    </form>
  )
}