import { useState, useEffect } from 'react'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { TranslatedForm2 } from '../helpers/TranslatedForm2'
import { useLanguage } from '../hooks/useLanguage'
import { Dialog, DialogContent } from '../components/ui/dialog'
import { Pencil, Trash2 } from 'lucide-react'
import { getAuthHeader, fetchWithAuth } from '../api/api'
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "../components/ui/alert-dialog"

interface Link {
  id: number
  name: string
  url: string
  img: string | File
  translations?: Record<string, { name: string }>
}

const fields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
  { name: 'url', label: 'URL', type: 'text' as const, required: true },
]

export function LinksPage() {
  const [links, setLinks] = useState<Link[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const currentLanguage = useLanguage()
  const [deletingLink, setDeletingLink] = useState<Link | null>(null)

  const fetchLinks = async () => {
    const response = await fetchWithAuth('https://karsu.uz/api/references/links/', {
      headers: getAuthHeader()
    });
    const data = await response.json();
    setLinks(data);
  }

  useEffect(() => {
    fetchLinks()
  }, [])

  const handleSubmit = async (formData: any) => {
    setIsLoading(true)
    try {
      const url = editingLink 
        ? `https://karsu.uz/api/references/links/${editingLink.id}/`
        : 'https://karsu.uz/api/references/links/'
      
      const submitData = new FormData()
      
      // Add translations for each language
      const translations: Record<string, { name: string }> = {}
      Object.entries(formData).forEach(([lang, data]: [string, any]) => {
        translations[lang] = { name: data.name }
      })
      
      // Use URL from the current language form
      submitData.append('url', formData[currentLanguage].url)
      submitData.append('translations', JSON.stringify(translations))
      
      if (selectedImage) {
        submitData.append('img', selectedImage)
      }
      
      const response = await fetchWithAuth(url, {
        method: editingLink ? 'PUT' : 'POST',
        body: submitData,
        headers: getAuthHeader()
      })

      if (response.ok) {
        await fetchLinks()
        setIsDialogOpen(false)
        setEditingLink(null)
        setSelectedImage(null)
      } else {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to save link')
      }
    } catch (error) {
      console.error('Error saving link:', error)
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (link: Link) => {
    try {
      const response = await fetchWithAuth(
        `https://karsu.uz/api/references/links/${link.id}/`,
        {
          method: 'DELETE',
          headers: getAuthHeader(),
        }
      );

      if (response.ok) {
        await fetchLinks();
        setDeletingLink(null);
      } else {
        throw new Error('Failed to delete link');
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      // You might want to show an error message to the user here
    }
  };

  const columns = [
    { 
      header: 'Name', 
      accessor: 'name',
      cell: (item: Link) => item.translations?.[currentLanguage]?.name || item.name
    },
    { header: 'URL', accessor: 'url' },
    { 
      header: 'Image', 
      accessor: 'img',
      cell: (item: Link) => (
        <img 
          src={typeof item.img === 'string' ? item.img : URL.createObjectURL(item.img as File)} 
          alt={typeof item.img === 'string' ? item.name : ''} 
          className="h-10 w-10 object-cover rounded cursor-pointer" 
          onClick={(e) => {
            e.stopPropagation();
            setPreviewImage(typeof item.img === 'string' ? item.img : URL.createObjectURL(item.img as File));
          }}
        />
      )
    },
  ]

  const handleEdit = async (link: Link) => {
    setEditingLink(link)
    setSelectedImage(null)
    setIsDialogOpen(true)
    
    // Fetch translations for the link
    const response = await fetchWithAuth(`https://karsu.uz/api/references/links/${link.id}/`, {
      headers: getAuthHeader()
    });
    const linkData = await response.json();
    
    // Initialize data for all supported languages
    const translatedData = ['uz', 'ru', 'en', 'kk'].reduce((acc, lang) => {
      acc[lang] = {
        name: linkData.translations[lang]?.name,  
        url: linkData.url  // URL is shared across all languages
      };
      return acc;
    }, {} as Record<string, any>);
    
    setEditingLink({ ...linkData, translations: translatedData });
  }

  return (
    <div className="p-6 mt-[50px]">
      <PageHeader
        title="Links"
        createButtonLabel="Add Link"
        onCreateClick={() => {
          setEditingLink(null)
          setSelectedImage(null)
          setIsDialogOpen(true)
        }}
      />

      <DataTable
        data={links}
        columns={columns}
        currentLanguage={currentLanguage}
        actions={(item) => (
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleEdit(item)
              }}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Pencil className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setDeletingLink(item)
              }}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </div>
        )}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <h2 className="text-lg font-semibold mb-4">
            {editingLink ? 'Edit Link' : 'Create Link'}
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Image</label>
            {editingLink && (
              <div className="mb-2">
                <img 
                  src={editingLink.img as string}
                  alt={editingLink.name}
                  className="h-20 w-20 object-cover rounded mb-2"
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
              className="w-full"
            />
          </div>
          <TranslatedForm2
            fields={fields}
            languages={['uz', 'ru', 'en', 'kk']}
            onSubmit={handleSubmit}
            initialData={editingLink?.translations }
            isLoading={isLoading}
            sharedFields={['url']}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex justify-center">
            <img 
              src={previewImage || ''} 
              alt="Preview" 
              className="max-h-[80vh] max-w-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingLink} onOpenChange={(open) => !open && setDeletingLink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the link
              "{deletingLink?.translations?.[currentLanguage]?.name || deletingLink?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingLink && handleDelete(deletingLink)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}