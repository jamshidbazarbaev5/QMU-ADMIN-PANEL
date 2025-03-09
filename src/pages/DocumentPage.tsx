import { useState, useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { Button } from '../components/ui/button'
import { format } from 'date-fns'
import { fetchWithAuth, getAuthHeader } from "../api/api.ts"
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'

interface DocumentTranslation {
  title: string | null
  description: string
}

interface Document {
  id: number
  menu: number
  footer_menu: number | null
  file: string
  date_post: string
  translations: {
    [key: string]: DocumentTranslation
  }
}

const translatedFields = [
  { name: 'title', label: 'Title', type: 'text' as const, required: true },
  { name: 'description', label: 'Description', type: 'richtext' as const, required: true },
]

export function DocumentPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [menuId, ] = useState<number>(2) // You might want to make this dynamic
  const currentLanguage = useLanguage()
  const navigate = useNavigate()

  const fetchDocuments = async () => {
    try {
      const response = await fetchWithAuth(`https://debttracker.uz/menus/document/`, {
        method: 'GET',
        headers: {
          ...getAuthHeader(),
        },
      })
      if (!response.ok) throw new Error('Failed to fetch documents')
      const data = await response.json()
      console.log('Fetched documents:', data)
      setDocuments(data.results)
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [currentLanguage])

  const handleSubmit = async (translationData: any) => {
    console.log('Submitting translations:', translationData)
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('menu', menuId.toString())
      
      // Add translations
      formData.append('translations', JSON.stringify(translationData))
      
      // Add file if selected
      if (selectedFile) {
        formData.append('file', selectedFile)
      }

      const url = `https://debttracker.uz/menus/document/`

      const response = await fetchWithAuth(url, {
        method: 'POST',
        body: formData,
        headers: {
          ...getAuthHeader(),
        },
      })

      if (!response.ok) throw new Error('Failed to save document')
      
      await fetchDocuments()
      setSelectedFile(null)
    } catch (error) {
      console.error('Error saving document:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (document: Document) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return

    try {
      const response = await fetchWithAuth(
        `https://debttracker.uz/menus/document/${document.id}/`,
        { method: 'DELETE',
        headers: {
          ...getAuthHeader(),
        },
      }
      )
      
      if (!response.ok) throw new Error('Failed to delete document')
      await fetchDocuments()
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  const columns = [
    { 
      header: 'Title',
      accessor: 'translations',
      cell: (item: Document) => item.translations[currentLanguage]?.title || '-'
    },
    { 
      header: 'Description',
      accessor: 'translations',
      cell: (item: Document) =>  <div 
      className="max-w-md truncate"
      dangerouslySetInnerHTML={{ 
        __html: item.translations[currentLanguage]?.description || '-'
      }}
    />
    },
    {
      header: 'File',
      accessor: 'file',
      cell: (item: Document) => (
        <a 
          href={item.file} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          View File
        </a>
        
      )
      
    },
    {
      header: 'Date',
      accessor: 'date_post',
      cell: (item: Document) => format(new Date(item.date_post), 'dd.MM.yyyy')
    }
  ]

  return (
    <div className="p-6 mt-[50px]">
      <PageHeader
        title="Documents"
        createButtonLabel="Add Document"
        onCreateClick={() => {
          navigate('/documents/create')
        }}
      />

      <DataTable
        data={documents}
        columns={columns}
        currentLanguage={currentLanguage}
        actions={(item: Document) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/documents/edit/${item.id}`)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(item)
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        )}
      />
    </div>
  )
}