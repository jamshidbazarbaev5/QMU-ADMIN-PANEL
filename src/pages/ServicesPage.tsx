import { useState, useEffect } from 'react'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { useLanguage } from '../hooks/useLanguage'
import { Dialog, DialogContent } from '../components/ui/dialog'
import { Pencil } from 'lucide-react'
import { getAuthHeader, fetchWithAuth } from '../api/api'

interface Service {
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

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const currentLanguage = useLanguage()

  const fetchServices = async () => {
    const response = await fetchWithAuth('https://debttracker.uz/ru/references/services/', {
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
        ? `https://debttracker.uz/ru/references/services/${editingService.id}/`
        : 'https://debttracker.uz/ru/references/services/'
      
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
        method: editingService ? 'PUT' : 'POST',
        body: submitData,
        headers: getAuthHeader()
      })

      if (response.ok) {
        await fetchServices()
        setIsDialogOpen(false)
        setEditingService(null)
        setSelectedImage(null)
      } else {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to save service')
      }
    } catch (error) {
      console.error('Error saving service:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const columns = [
    { 
      header: 'Name', 
      accessor: 'name',
      cell: (item: Service) => {
        // Display name from translations based on current language
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
    setEditingService(service)
    setSelectedImage(null)
    setIsDialogOpen(true)
    
    // Fetch translations for the service
    const response = await fetchWithAuth(`https://debttracker.uz/ru/references/services/${service.id}/`, {
      headers: getAuthHeader()
    });
    const serviceData = await response.json();
    
    // Prepare initial data with translations for all languages
    const translatedData = Object.keys(serviceData.translations || {}).reduce((acc, lang) => {
      acc[lang] = {
        name: serviceData.translations[lang]?.name || '',
        url: serviceData.url // URL is shared across all languages
      };
      return acc;
    }, {} as Record<string, any>);
    
    // Ensure all required languages have entries
    ['uz', 'ru', 'en', 'kk'].forEach(lang => {
      if (!translatedData[lang]) {
        translatedData[lang] = {
          name: '',
          url: serviceData.url // URL is shared across all languages
        };
      }
    });
    
    setEditingService({ ...service, translations: translatedData });
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
          <TranslatedForm
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
    </div>
  )
}