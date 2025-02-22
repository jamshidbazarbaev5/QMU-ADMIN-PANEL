import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil } from 'lucide-react'

import { Input } from "../components/ui/input"

interface Announcement {
  id: number
  date_post: string
  translations: {
    [key: string]: {
      title: string
      description: string
      slug: string
    }
  }
}

// Create a custom hook to get the current language
const useLanguage = () => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en')

  useEffect(() => {
    // Listen for language changes from localStorage or another source
    const handleStorageChange = () => {
      const lang = localStorage.getItem('language') || 'en'
      setCurrentLanguage(lang)
    }

    window.addEventListener('storage', handleStorageChange)
    // Initial setup
    handleStorageChange()

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return currentLanguage
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const currentLanguage = useLanguage()
  const navigate = useNavigate()

  const fetchAnnouncements = async (lang: string, query?: string) => {
    try {
      const searchParams = new URLSearchParams()
      if (query) {
        searchParams.append('title', query)
      }
      
      const url = `https://debttracker.uz/${lang}/announcements/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        const filteredAnnouncements = data.filter((announcement: Announcement) => {
          const translation = announcement.translations[lang];
          return translation && translation.title && translation.description && translation.slug;
        });
        setAnnouncements(filteredAnnouncements);
      } else {
        console.error('Failed to fetch announcements:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    }
  }

  useEffect(() => {
    fetchAnnouncements(currentLanguage, searchQuery)
  }, [currentLanguage, searchQuery])

  const handleEdit = (announcement: Announcement) => {
    const slug = announcement.translations[currentLanguage]?.slug || ''
    navigate(`/edit-announcement/${slug}?id=${announcement.id}`)
  }

  return (
    <div className="container mx-auto p-6 mt-[50px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#6C5DD3]">Announcements</h1>
        <button
          onClick={() => navigate('/create-announcement')}
          className="flex items-center gap-2 px-4 py-2 bg-[#6C5DD3] text-white rounded-lg hover:bg-[#5b4eb8] transition-colors"
        >
          <Plus className="h-5 w-5" />
          Create Announcement
        </button>
      </div>

      {/* Add Search Component */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search announcements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6C5DD3] uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6C5DD3] uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6C5DD3] uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6C5DD3] uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6C5DD3] uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6C5DD3] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {announcements.map((announcement, index) => (
              <tr
                key={announcement.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleEdit(announcement)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(announcement.date_post), 'dd MMM yyyy')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-w-xs truncate">
                    {announcement.translations[currentLanguage]?.title || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-w-xs truncate">
                    {announcement.translations[currentLanguage]?.description || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-w-xs truncate">
                    {announcement.translations[currentLanguage]?.slug || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(announcement)
                    }}
                    className="flex items-center gap-2 px-3 py-1 text-[#6C5DD3] hover:bg-[#6C5DD3]/10 rounded-md transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}