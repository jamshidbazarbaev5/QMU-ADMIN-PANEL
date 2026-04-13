import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { TranslatedForm } from "../helpers/TranslatedForm"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import api2 from '../api/api2'

interface TranslatedField {
  name: string
  label: string
  type: "text" | "textarea" | "richtext"
  required?: boolean
  editorConfig?: any
}

export function DraftForm() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = (file: File) => {
    setUploadedFiles(prev => {
      const fileExists = prev.some(f => 
        f.name === file.name || 
        (f instanceof File && f.name === file.name)
      )
      
      if (!fileExists) {
        return [...prev, file]
      }
      return prev
    })
  }

  const fields: TranslatedField[] = [
    { 
      name: "title", 
      label: "Title", 
      type: "text", 
      required: true 
    },
    {
      name: "description",
      label: "Description",
      type: "richtext",
      required: true,
      editorConfig: {
        onFileUpload: handleFileUpload,
      },
    },
  ]

  const handleSubmit = async (translationData: any) => {
    try {
      setIsSubmitting(true);

      // Create translations object from flat data
      const translations: { [key: string]: any } = {};
      const languages = ['en', 'ru', 'uz', 'kk'];
      
      languages.forEach(lang => {
        const langData: { [key: string]: string } = {};
        fields.forEach(field => {
          const value = translationData[`${field.name}_${lang}`];
          if (value) {
            langData[field.name] = value;
          }
        });
        if (Object.keys(langData).length > 0) {
          translations[lang] = langData;
        }
      });

      // Check if any language has valid title
      const hasValidTranslation = Object.values(translations).some(
        (translation) => translation.title && translation.title.trim() !== ""
      );

      if (!hasValidTranslation) {
        throw new Error("At least one translation must be provided");
      }

      const formData = new FormData();
      formData.append('translations', JSON.stringify(translations));

      uploadedFiles.forEach((file, index) => {
        formData.append(`draft_files[${index}]file`, file);
      });

      await api2({
        method: 'post',
        url: '/publications/drafts/',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      navigate(`/karsu-new-admin-panel/drafts`);
    } catch (error) {
      console.error('Error creating draft:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 mt-[50px]">
      <Card>
        <CardHeader>
          <CardTitle>Create Draft</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Uploaded Files
            </label>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <span className="text-gray-700">{file.name}</span>
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => {
                      setUploadedFiles(prev =>
                        prev.filter((_, i) => i !== index)
                      )
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <TranslatedForm
            fields={fields}
            languages={["en", "ru", "uz", "kk"]}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  )
}