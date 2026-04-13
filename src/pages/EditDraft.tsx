import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
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

interface FileWithId {
  id: number
  name: string
  url: string
}

interface DraftData {
  translations: Record<string, any>
  translation_links: Record<string, string>
  draft_files: Array<{
    id: number
    file: string
  }>
}

export function EditDraft() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [existingFiles, setExistingFiles] = useState<FileWithId[]>([])
  const [filesToDelete, setFilesToDelete] = useState<{[key: number]: number}>({})
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<DraftData | null>(null)

  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const response = await api2.get<DraftData>(`/publications/drafts/${slug}/`)
        setDraft(response.data)
        if (response.data.draft_files) {
          const files = response.data.draft_files.map((fileObj) => ({
            id: fileObj.id,
            name: fileObj.file.split("/").pop() || 'unnamed file',
            url: fileObj.file,
          }))
          setExistingFiles(files)
        }
      } catch (error) {
        console.error('Error fetching draft:', error)
        setError('Failed to load draft')
      } finally {
        setIsLoading(false)
      }
    }

    if (slug) {
      fetchDraft()
    }
  }, [slug])

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

  const handleFileDelete = (file: FileWithId, index: number) => {
    if (file.id) {
      // Store the index-to-id mapping
      setFilesToDelete(prev => ({...prev, [index]: file.id}))
      setExistingFiles(prev => prev.filter(f => f.id !== file.id))
    }
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
    {
      name: "url",
      label: "URL",
      type: "text",
      required: false,
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

      // Add new files
      uploadedFiles.forEach((file, index) => {
        formData.append(`draft_files[${index}]file`, file);
      });

      // Add files to delete using index-based format
      Object.entries(filesToDelete).forEach(([fileId]) => {
        formData.append('files_to_delete', fileId.toString());
      });

      await api2({
        method: 'put',
        url: `/publications/drafts/${slug}/`,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      navigate(`/karsu-new-admin-panel/drafts`);
    } catch (error) {
      console.error('Error updating draft:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 mt-[50px]">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Loading draft data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 mt-[50px]">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 mt-[50px]">
      <Card>
        <CardHeader>
          <CardTitle>Edit Draft</CardTitle>
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
              {existingFiles.map((file, index) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {file.name}
                  </a>
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleFileDelete(file, index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
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
            initialData={draft?.translations}
            translation_links={draft?.translation_links}
          />
        </CardContent>
      </Card>
    </div>
  )
}