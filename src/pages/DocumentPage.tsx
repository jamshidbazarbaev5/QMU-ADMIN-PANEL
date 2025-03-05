import { useState, useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { Dialog, DialogContent } from '../components/ui/dialog'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { format } from 'date-fns'

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
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [menuId, ] = useState<number>(2) // You might want to make this dynamic
  const currentLanguage = useLanguage()

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`https://debttracker.uz/menus/document/`)
      if (!response.ok) throw new Error('Failed to fetch documents')
      const data = await response.json()
      console.log('Fetched documents:', data)
      setDocuments(data)
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

      const url = editingDocument 
        ? `https://debttracker.uz/menus/document/${editingDocument.id}/`
        : `https://debttracker.uz/menus/document/`

      const response = await fetch(url, {
        method: editingDocument ? 'PUT' : 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Failed to save document')
      
      await fetchDocuments()
      setIsDialogOpen(false)
      setEditingDocument(null)
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
      const response = await fetch(
        `https://debttracker.uz/menus/document/${document.id}/`,
        { method: 'DELETE' }
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

  const handleEdit = (document: Document) => {
    console.log('Editing document:', document)
    setEditingDocument(document)
    setSelectedFile(null)
    setIsDialogOpen(true)
  }

  return (
    <div className="p-6 mt-[50px]">
      <PageHeader
        title="Documents"
        createButtonLabel="Add Document"
        onCreateClick={() => {
          setEditingDocument(null)
          setSelectedFile(null)
          setIsDialogOpen(true)
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
                handleEdit(item)
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <h2 className="text-lg font-semibold mb-4">
            {editingDocument ? 'Edit Document' : 'Create Document'}
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">File</label>
            {editingDocument && (
              <div className="mb-2">
                <a 
                  href={editingDocument.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Current File
                </a>
              </div>
            )}
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full"
            />
          </div>

          <TranslatedForm
            fields={translatedFields}
            languages={['en', 'ru', 'uz', 'kk']}
            onSubmit={handleSubmit}
            initialData={editingDocument?.translations}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}