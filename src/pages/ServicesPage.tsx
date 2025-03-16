import { useState, useEffect } from 'react'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { TranslatedForm2 } from '../helpers/TranslatedForm2'
import { useLanguage } from '../hooks/useLanguage'
import { Dialog, DialogContent } from '../components/ui/dialog'
import { Pencil, Trash2 } from 'lucide-react'
import { getAuthHeader, fetchWithAuth } from '../api/api'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '../components/ui/alert-dialog'

interface Service {
  id: number
  name: string
  url: string
  img: string | File
  translations?: Record<string, { name: string }>
}

const fields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: false },
  { name: 'url', label: 'URL', type: 'text' as const, required: true },
]

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
  const currentLanguage = useLanguage()

  const fetchServices = async () => {
    const response = await fetchWithAuth('https://karsu.uz/api/references/services/', {
      headers: getAuthHeader()
    });
    const data = await response.json();
    // Ensure each service has its translations property set
    const servicesWithTranslations = data.map((service: Service) => ({
      ...service,
      translations: service.translations || {}
    }));
    setServices(servicesWithTranslations);
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const handleSubmit = async (formData: any) => {
    setIsLoading(true)
    try {
      const url = editingService 
        ? `https://karsu.uz/api/references/services/${editingService.id}/`
        : 'https://karsu.uz/api/references/services/'
      
      const submitData = new FormData()
      
      // Create translations object with all names, even if empty
      const translations = {
        en: { name: formData.en?.name || '' },
        uz: { name: formData.uz?.name || '' },
        ru: { name: formData.ru?.name || '' },
        kk: { name: formData.kk?.name || '' }
      }
      submitData.append('translations', JSON.stringify(translations))
      
      // Get URL from shared fields
      const submittedUrl = formData.en?.url || formData.uz?.url || formData.ru?.url || formData.kk?.url || ''
      if (!submittedUrl && !editingService) {
        throw new Error('URL is required')
      }
      submitData.append('url', submittedUrl || editingService?.url || '')
      
      if (selectedImage) {
        submitData.append('img', selectedImage)
      } else if (!editingService) {
        throw new Error('Please select an image')
      }
      
      const headers = getAuthHeader()
      
      const response = await fetchWithAuth(url, {
        method: editingService ? 'PUT' : 'POST',
        body: submitData,
        headers: headers
      })

      console.log('Response status:', response)
      console.log('Response headers:', Object.fromEntries(response.headers))

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('text/html')) {
        const htmlText = await response.text()
        console.error('Server returned HTML:', htmlText)
        throw new Error('Server returned HTML instead of JSON. Please check server logs.')
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response body:', errorText)
        
        let errorMessage = 'Failed to save service'
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.detail || errorMessage
        } catch (e) {
          errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
      }

      await fetchServices()
      setIsDialogOpen(false)
      setEditingService(null)
      setSelectedImage(null)
    } catch (error) {
      console.error('Error saving service:', error)
      alert(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const columns = [
    { 
      header: 'Name', 
      accessor: 'name',
      cell: (item: Service) => {
        return item.translations?.[currentLanguage]?.name || item.name
      }
    },
    { header: 'URL', accessor: 'url' },
    { 
      header: 'Image', 
      accessor: 'img',
      cell: (item: Service) => (
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

  const handleEdit = async (service: Service) => {
    console.log('Editing service:', service);
    setEditingService(service);
    setSelectedImage(null);
    setIsDialogOpen(true);
    
    const response = await fetchWithAuth(`https://karsu.uz/api/references/services/${service.id}/`, {
      headers: getAuthHeader()
    });
    const serviceData = await response.json();
    console.log('Fetched service data:', serviceData);
    
    // Initialize translatedData with the URL and names for all languages
    const translatedData = {} as Record<string, any>;
    const allLanguages = ['uz', 'ru', 'en', 'kk'];
    
    allLanguages.forEach(lang => {
      translatedData[lang] = {
        name: serviceData.translations[lang]?.name || serviceData.name || '',  // Fallback to service.name if translation is empty
        url: serviceData.url  // Use the URL from the service data
      };
    });
    
    console.log('Final translated data:', translatedData);
    setEditingService({ ...serviceData, translations: translatedData });
  }

  const handleDelete = async (service: Service) => {
    try {
      const response = await fetchWithAuth(
        `https://karsu.uz/api/references/services/${service.id}/`,
        {
          method: 'DELETE',
          headers: getAuthHeader(),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete service')
      }

      await fetchServices()
      setServiceToDelete(null)
    } catch (error) {
      console.error('Error deleting service:', error)
      alert(error instanceof Error ? error.message : 'An unknown error occurred')
    }
  }

  return (
    <div className="p-6 mt-[50px]">
      <PageHeader
        title="Services"
        createButtonLabel="Add Service"
        onCreateClick={() => {
          setEditingService(null)
          setSelectedImage(null)
          setIsDialogOpen(true)
        }}
      />

      <DataTable
        data={services}
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
                setServiceToDelete(item)
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
            {editingService ? 'Edit Service' : 'Create Service'}
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Image</label>
            {editingService && editingService.img && (
              <div className="mb-2">
                <img 
                  src={editingService.img as string}
                  alt={editingService.name}
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
            initialData={editingService?.translations || undefined}
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

      <AlertDialog open={!!serviceToDelete} onOpenChange={() => setServiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the service.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => serviceToDelete && handleDelete(serviceToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}