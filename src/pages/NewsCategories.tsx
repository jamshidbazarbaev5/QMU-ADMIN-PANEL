import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Pencil, Loader2 } from "lucide-react"
import { Button } from "../components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"

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

export default function NewsCategories() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    return localStorage.getItem('language') || 'ru'
  })

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`https://debttracker.uz/news/category/`)
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
        setCurrentLanguage(newLanguage)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [currentLanguage])

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
          onClick={() => navigate('/create-news-category')}
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
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.id}</TableCell>
                <TableCell>
                  {category.translations[currentLanguage as keyof typeof category.translations]?.name || '-'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/edit-news-category/${category.id}`)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}