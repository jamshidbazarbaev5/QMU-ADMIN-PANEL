import { useState, useEffect } from 'react'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { useLanguage } from '../hooks/useLanguage'
import { Dialog, DialogContent } from '../components/ui/dialog'
import { Pencil } from 'lucide-react'

interface Link {
  id: number
  name: string
  url: string
  img: string | File
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

  const fetchLinks = async () => {
    const response = await fetch('https://debttracker.uz/ru/references/links/')
    const data = await response.json()
    setLinks(data)
  }

  useEffect(() => {
    fetchLinks()
  }, [])

  const handleSubmit = async (formData: any) => {
    setIsLoading(true)
    try {
      const url = editingLink 
        ? `https://debttracker.uz/ru/references/links/${editingLink.id}/`
        : 'https://debttracker.uz/ru/references/links/'
      
      const submitData = new FormData()
      submitData.append('name', formData[currentLanguage].name)
      submitData.append('url', formData[currentLanguage].url)
      
      if (selectedImage) {
        submitData.append('img', selectedImage)
      }
      
      const response = await fetch(url, {
        method: editingLink ? 'PUT' : 'POST',
        body: submitData
      })

      if (response.ok) {
        await fetchLinks()
        setIsDialogOpen(false)
        setEditingLink(null)
        setSelectedImage(null)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const columns = [
    { header: 'Name', accessor: 'name' },
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

  const handleEdit = (link: Link) => {
    setEditingLink(link)
    setSelectedImage(null)
    setIsDialogOpen(true)
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
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleEdit(item)
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Pencil className="h-4 w-4 text-gray-500" />
          </button>
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
          <TranslatedForm
            fields={fields}
            languages={[currentLanguage]}
            onSubmit={handleSubmit}
            initialData={editingLink ? { [currentLanguage]: editingLink } : undefined}
            isLoading={isLoading}
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
    </div>
  )
}