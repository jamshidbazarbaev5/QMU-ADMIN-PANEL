import { useState, useEffect } from 'react'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { useLanguage } from '../hooks/useLanguage'
import { Dialog, DialogContent } from '../components/ui/dialog'
import { getAuthHeader, fetchWithAuth } from '../api/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Label } from "../components/ui/label"
import { Pencil, Trash2 } from 'lucide-react'
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

interface MenuItem {
  id: number
  translations: Record<string, { name: string }>
}

interface Link {
  id: number
  url: string
  menu_id?: number
  is_outer?: boolean
  img?: string
  translations?: Record<string, { name: string }>
  menu?: number
  footer_menu?: number
}

export function LinksPage() {
  const [links, setLinks] = useState<Link[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mainMenuItems, setMainMenuItems] = useState<MenuItem[]>([])
  const [footerMenuItems, setFooterMenuItems] = useState<MenuItem[]>([])
  const [selectedMenuType, setSelectedMenuType] = useState<'main' | 'footer'>('main')
  const [selectedMenuItem, setSelectedMenuItem] = useState<number | null>(null)
  const [url, setUrl] = useState('')
  const [isOuter, setIsOuter] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [translations, setTranslations] = useState<Record<string, { name: string }>>({
    en: { name: '' },
    ru: { name: '' },
    uz: { name: '' },
    kk: { name: '' }
  })
  const currentLanguage = useLanguage()

  const fetchMenuItems = async () => {
    try {
      const [mainResponse, footerResponse] = await Promise.all([
        fetchWithAuth('https://karsu.uz/api/menus/main/', {
          headers: getAuthHeader()
        }),
        fetchWithAuth('https://karsu.uz/api/menus/footer/', {
          headers: getAuthHeader()
        })
      ])

      const mainData = await mainResponse.json()
      const footerData = await footerResponse.json()

      setMainMenuItems(mainData)
      setFooterMenuItems(footerData)
    } catch (error) {
      console.error('Error fetching menu items:', error)
    }
  }

  const fetchLinks = async () => {
    try {
      const response = await fetchWithAuth('https://karsu.uz/api/references/links/', {
        headers: getAuthHeader()
      })
      const data = await response.json()
      setLinks(data)
    } catch (error) {
      console.error('Error fetching links:', error)
    }
  }

  useEffect(() => {
    fetchLinks()
    fetchMenuItems()
  }, [])

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const response = await fetchWithAuth(
        `https://karsu.uz/api/references/links/${deleteId}/`,
        {
          method: 'DELETE',
          headers: getAuthHeader(),
        }
      )

      if (response.ok) {
        await fetchLinks()
        setDeleteId(null)
      }
    } catch (error) {
      console.error('Error deleting link:', error)
    }
  }

  const handleEdit = (link: Link) => {
    setEditingLink(link);
    setIsOuter(!!link.is_outer);
    setUrl(link.url);
    
    // Handle menu selection
    if (link.menu) {
      setSelectedMenuType('main');
      setSelectedMenuItem(link.menu);
    } else if (link.footer_menu) {
      setSelectedMenuType('footer');
      setSelectedMenuItem(link.footer_menu);
    }
    
    if (link.translations) {
      setTranslations(link.translations);
    } else {
      setTranslations({
        en: { name: '' },
        ru: { name: '' },
        uz: { name: '' },
        kk: { name: '' }
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (isOuter && !selectedMenuItem) {
      alert('Please select a menu item')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('url', url)
      
      if (isOuter && selectedMenuItem) {
        // Set the correct menu field based on menu type
        if (selectedMenuType === 'main') {
          formData.append('menu', selectedMenuItem.toString())
        } else {
          formData.append('footer_menu', selectedMenuItem.toString())
        }
        formData.append('is_outer', 'true')
      } else {
        if (selectedImage) {
          formData.append('img', selectedImage)
        }
        formData.append('translations', JSON.stringify(translations))
      }

      const response = await fetchWithAuth(
        editingLink 
          ? `https://karsu.uz/api/references/links/${editingLink.id}/`
          : 'https://karsu.uz/api/references/links/',
        {
          method: editingLink ? 'PUT' : 'POST',
          headers: getAuthHeader(),
          body: formData
        }
      )

      if (response.ok) {
        await fetchLinks()
        setIsDialogOpen(false)
        setUrl('')
        setSelectedMenuItem(null)
        setSelectedMenuType('main')
        setEditingLink(null)
        setSelectedImage(null)
        setTranslations({
          en: { name: '' },
          ru: { name: '' },
          uz: { name: '' },
          kk: { name: '' }
        })
      } else {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to save link')
      }
    } catch (error) {
      console.error('Error saving link:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 mt-[50px]">
      <PageHeader
        title="Links"
        createButtonLabel="Add Link"
        onCreateClick={() => {
          setEditingLink(null)
          setIsTypeDialogOpen(true)
        }}
      />

      <DataTable
        data={links}
        columns={[
          { header: 'URL', accessor: 'url' },
          { 
            header: 'Type', 
            accessor: 'is_outer',
            cell: (item: Link) => item.is_outer ? 'Outer Link' : 'Inner Link'
          },
          {
            header: 'Name',
            accessor: 'translations',
            cell: (item: Link) => {
              if (item.is_outer) return null;
              if (!item.translations) return null;
              return item.translations[currentLanguage]?.name || 
                Object.values(item.translations)[0]?.name || null;
            }
          },
          {
            header: 'Image',
            accessor: 'img',
            cell: (item: Link) => item.img ? (
              <img 
                src={item.img} 
                alt="Link"
                className="h-10 w-10 object-cover rounded"
              />
            ) : null
          },
          {
            header: 'Actions',
            accessor: 'actions',
            cell: (item: Link) => (
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteId(item.id)}
                  className="p-2 hover:bg-gray-100 rounded text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          }
        ]}
        currentLanguage={currentLanguage}
      />

      <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
        <DialogContent>
          <h2 className="text-lg font-semibold mb-4">Select Link Type</h2>
          <div className="space-y-4">
            <Button
              onClick={() => {
                setIsOuter(false)
                setIsTypeDialogOpen(false)
                setIsDialogOpen(true)
                // Reset all form fields
                setUrl('')
                setSelectedMenuItem(null)
                setSelectedMenuType('main')
                setSelectedImage(null)
                setTranslations({
                  en: { name: '' },
                  ru: { name: '' },
                  uz: { name: '' },
                  kk: { name: '' }
                })
              }}
              className="w-full"
              variant="secondary"
            >
              Inner Link
            </Button>
            <Button
              onClick={() => {
                setIsOuter(true)
                setIsTypeDialogOpen(false)
                setIsDialogOpen(true)
                // Reset all form fields
                setUrl('')
                setSelectedMenuItem(null)
                setSelectedMenuType('main')
                setSelectedImage(null)
                setTranslations({
                  en: { name: '' },
                  ru: { name: '' },
                  uz: { name: '' },
                  kk: { name: '' }
                })
              }}
              className="w-full"
            >
              Outer Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <h2 className="text-lg font-semibold mb-4">
            {editingLink ? 'Edit Link' : 'Create Link'}
          </h2>
          <div className="space-y-4">
            {!isOuter && (
              <>
                <div>
                  <Label>Image</Label>
                  {editingLink?.img && (
                    <div className="mb-2">
                      <img 
                        src={editingLink.img} 
                        alt="Link"
                        className="h-20 w-20 object-cover rounded"
                      />
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>English Name</Label>
                    <Input
                      value={translations.en.name}
                      onChange={(e) => setTranslations(prev => ({
                        ...prev,
                        en: { name: e.target.value }
                      }))}
                      placeholder="Enter English name..."
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label>Russian Name</Label>
                    <Input
                      value={translations.ru.name}
                      onChange={(e) => setTranslations(prev => ({
                        ...prev,
                        ru: { name: e.target.value }
                      }))}
                      placeholder="Enter Russian name..."
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label>Uzbek Name</Label>
                    <Input
                      value={translations.uz.name}
                      onChange={(e) => setTranslations(prev => ({
                        ...prev,
                        uz: { name: e.target.value }
                      }))}
                      placeholder="Enter Uzbek name..."
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label>Kazakh Name</Label>
                    <Input
                      value={translations.kk.name}
                      onChange={(e) => setTranslations(prev => ({
                        ...prev,
                        kk: { name: e.target.value }
                      }))}
                      placeholder="Enter Kazakh name..."
                      className="w-full"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <Label>URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL..."
                className="w-full"
              />
            </div>

            {isOuter && (
              <>
                <div>
                  <Label>Menu Type</Label>
                  <Select
                    value={selectedMenuType}
                    onValueChange={(value: 'main' | 'footer') => {
                      setSelectedMenuType(value)
                      setSelectedMenuItem(null)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select menu type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Main Menu</SelectItem>
                      <SelectItem value="footer">Footer Menu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Menu Item</Label>
                  <Select
                    value={selectedMenuItem?.toString() || ''}
                    onValueChange={(value) => setSelectedMenuItem(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select menu item" />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedMenuType === 'main' ? mainMenuItems : footerMenuItems).map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.translations[currentLanguage]?.name || Object.values(item.translations)[0]?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !url || (isOuter && !selectedMenuItem)}
              className="w-full"
            >
              {isLoading ? 'Saving...' : (editingLink ? 'Update' : 'Create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}