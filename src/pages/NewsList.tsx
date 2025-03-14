import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { useLanguage } from '../hooks/useLanguage'
import { Input } from '../components/ui/input'
import debounce from 'lodash/debounce'
import {fetchWithAuth, getAuthHeader} from '../api/api'
import { Pagination } from '../components/ui/Pagination'

interface NewsPost {
  id: number
  category: number
  goals: number[]
  main_image: string
  views_count: number
  date_posted: string
  translations: {
    [key: string]: {
      title: string
      description: string
      slug: string
    }
  }
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: NewsPost[];
}

export default function NewsList() {
  const navigate = useNavigate()
  const currentLanguage = useLanguage()
  const [news, setNews] = useState<NewsPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [, setSearchTitle] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchNews = async (title?: string, page: number = 1) => {
    try {
      const queryParams = new URLSearchParams()
      if (title) queryParams.append('title', title)
      if (page > 1) queryParams.append('page', page.toString())
      
      const response = await fetchWithAuth(
        `https://karsu.uz/api/news/posts/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
        {
          headers: {
            ...getAuthHeader()
          }
        }
      )
      if (!response.ok) throw new Error('Failed to fetch news')
      const data: PaginatedResponse = await response.json()
      setNews(data.results)
      setTotalPages(Math.ceil(data.count / 10)) // Assuming 10 items per page
    } catch (error) {
      console.error('Error fetching news:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (slug: string) => {
    if (window.confirm('Are you sure you want to delete this news item?')) {
      try {
        const response = await fetchWithAuth(
          `https://karsu.uz/api/news/posts/${slug}/`,
          {
            method: 'DELETE',
            headers: {
              ...getAuthHeader()
            }
          }
        )
        if (!response.ok) throw new Error('Failed to delete news')
        // Refresh the news list after successful deletion
        fetchNews()
      } catch (error) {
        console.error('Error deleting news:', error)
        alert('Error: Could not delete this news item')
      }
    }
  }

  // Debounced search function
  const debouncedSearch = debounce((searchValue: string) => {
    setCurrentPage(1)
    fetchNews(searchValue, 1)
  }, 300)

  useEffect(() => {
    fetchNews(undefined, currentPage)
  }, [currentLanguage, currentPage])

  const columns = [
    {
      header: 'Image',
      accessor: 'main_image',
      cell: (item: NewsPost) => (
        <img 
          src={item.main_image} 
          alt={item.translations[currentLanguage]?.title || ''} 
          className="w-12 h-12 object-cover rounded"
        />
      )
    },
    {
      header: 'Title',
      accessor: 'title',
      cell: (item: NewsPost) => (
        <span>{item.translations[currentLanguage]?.title || item.translations.kk?.title || '-'}</span>
      )
    },
    {
      header: 'Views',
      accessor: 'views_count',
      cell: (item: NewsPost) => (
        <span>{item.views_count}</span>
      )
    },
    {
      header: 'Date Posted',
      accessor: 'date_posted',
      cell: (item: NewsPost) => (
        <span>{format(new Date(item.date_posted), 'dd MMM yyyy')}</span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (item: NewsPost) => {
        const slug = item.translations[currentLanguage]?.slug || 
                    item.translations.ru?.slug ||
                    item.translations.en?.slug ||
                    item.translations.uz?.slug ||
                    item.translations.kk?.slug

        return (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (slug) {
                  navigate(`/karsu-admin-panel/create-news?id=${slug}`)
                } else {
                  console.error('No slug found for news item:', item)
                  alert('Error: Could not edit this news item')
                }
              }}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(item.translations[currentLanguage]?.slug || item.translations.en?.slug || item.translations.ru?.slug || item.translations.uz?.slug || item.translations.kk?.slug)
              }}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        )
      }
    }
  ]

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C5DD3]"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 mt-[50px]">
      <PageHeader
        title="News"
        createButtonLabel="Create News"
        onCreateClick={() => navigate('/karsu-admin-panel/create-news')}
      />
      
      <div className="mb-4">
        <Input
          placeholder="Search by title..."
          onChange={(e) => {
            setSearchTitle(e.target.value)
            debouncedSearch(e.target.value)
          }}
          className="max-w-sm"
        />
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={news}
          columns={columns}
          onRowClick={(item) => navigate(`/karsu-admin-panel/news/${item.id}`)}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  )
}