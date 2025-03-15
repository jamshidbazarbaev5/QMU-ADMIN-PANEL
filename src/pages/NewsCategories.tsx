import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Pencil, Loader2, Trash2 } from "lucide-react"
import { Button } from "../components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"
import { fetchWithAuth, getAuthHeader } from "../api/api"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog"

interface Translation {
  name: string
  slug: string
}

interface Category {
  id: number
  translations: {
    en?: Translation
    ru?: Translation
    uz?: Translation
    kk?: Translation
  }
}

type LanguageKey = 'en' | 'ru' | 'uz' | 'kk'

export default function NewsCategories() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentLanguage, setCurrentLanguage] = useState<LanguageKey>(() => {
    return (localStorage.getItem('language') || 'ru') as LanguageKey
  })

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true)
        const response = await fetchWithAuth(`https://karsu.uz/api/news/category/`, {
          headers: getAuthHeader()
        })
        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }
        const data = await response.json()
        setCategories(data)
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [currentLanguage])

  // Listen for language changes
  useEffect(() => {
    const handleStorageChange = () => {
      const newLanguage = localStorage.getItem('language')
      if (newLanguage && newLanguage !== currentLanguage) {
        setCurrentLanguage(newLanguage as LanguageKey)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [currentLanguage])

  const handleDelete = async (slug: string) => {
    try {
      const response = await fetchWithAuth(`https://karsu.uz/api/news/category/${slug}/`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })

      if (!response.ok) {
        throw new Error('Failed to delete category')
      }

      // Refresh the categories list
      setCategories(categories.filter(category => 
        category.translations[currentLanguage]?.slug !== slug
      ))
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6  flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6C5DD3]" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 mt-[50px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#6C5DD3]">News Categories</h1>
        <Button
          onClick={() => navigate('/karsu-admin-panel/create-news-category')}
          className="flex items-center gap-2 px-4 py-2 bg-[#6C5DD3] text-white rounded-lg hover:bg-[#5b4eb8] transition-colors"
        >
          <Plus className="h-5 w-5" />
          Create Category
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name ({currentLanguage.toUpperCase()})</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category, index) => (
              <TableRow key={category.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  {category.translations[currentLanguage]?.name || '-'}
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const slug = category.translations[currentLanguage]?.slug
                      if (slug) {
                        navigate(`/karsu-admin-panel/create-news-category?slug=${slug}`)
                      }
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this category? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => {
                            const slug = category.translations[currentLanguage]?.slug
                            if (slug) {
                              handleDelete(slug)
                            }
                          }}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}