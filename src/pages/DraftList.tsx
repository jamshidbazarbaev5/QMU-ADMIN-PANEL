import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '../helpers/DataTable'
import { PageHeader } from '../helpers/PageHeader'
import { useLanguage } from '../hooks/useLanguage'
import api2 from '../api/api2'

export function DraftList() {
  const navigate = useNavigate()
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const currentLanguage = useLanguage()
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [selectedLinks, setSelectedLinks] = useState<Record<string, string>>({});

  const fetchDrafts = async () => {
    try {
      setLoading(true)
      const url = searchQuery
        ? `/publications/drafts/?title=${encodeURIComponent(searchQuery)}&page=${currentPage}`
        : `/publications/drafts/?page=${currentPage}`

      const response = await api2.get(url)
      setDrafts(response.data.results || [])
      setTotalCount(response.data.count || 0)
    } catch (error) {
      console.error('Error fetching drafts:', error)
      setDrafts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrafts()
  }, [searchQuery, currentLanguage, currentPage])

  const columns = [
    {
      header: 'Title',
      accessor: `translations.${currentLanguage}.title`,
      cell: (item: any) => {
        const title = item.translations[currentLanguage]?.title ||
          item.translations.en?.title ||
          item.translations.ru?.title ||
          item.translations.uz?.title ||
          item.translations.kk?.title
        return title || '-'
      }
    },
    {
      header: 'Links',
      accessor: 'translation_links',
      cell: (item: any) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLinks(item.translation_links || {});
            setShowLinksModal(true);
          }}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md"
        >
          View Links
        </button>
      )
    }
  ]

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return

    try {
      await api2.delete(`/publications/drafts/${slug}/`)
      fetchDrafts()
    } catch (error) {
      console.error('Error deleting draft:', error)
    }
  }
  const getPostSlug = (item: any) => {
    // Try to get any available slug from translations
    if (!item.translations) {
      console.error('No translations found for post:', item);
      return '';
    }

    // First try the current language
    if (item.translations[currentLanguage]?.slug) {
      return item.translations[currentLanguage].slug;
    }

    // Then try other languages in order
    const languages = ['en', 'ru', 'uz', 'kk'];
    for (const lang of languages) {
      if (item.translations[lang]?.slug) {
        return item.translations[lang].slug;
      }
    }

    console.error('No slug found in any language for post:', item);
    return '';
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-6 mt-[50px]">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6 mt-[50px]">
      <PageHeader
        title="Drafts"
        createButtonLabel="Create Draft"
        onCreateClick={() => navigate('/karsu-admin-panel/drafts/new')}
      />

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search drafts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300"
        />
      </div>
      

      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={drafts}
          columns={columns}
          onRowClick={(item) => navigate(`/karsu-admin-new-panel/drafts/${getPostSlug(item)}/edit`)}
          actions={(item) => (
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/karsu-new-admin-panel/drafts/${getPostSlug(item)}/edit`)
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(getPostSlug(item))
                }}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          )}
        />

        <div className="flex justify-between items-center p-4 border-t">
          <div className="text-sm text-gray-600">
            Total items: {totalCount}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded ${
                currentPage === 1 
                  ? 'bg-gray-100 text-gray-400' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage * 10 >= totalCount}
              className={`px-4 py-2 rounded ${
                currentPage * 10 >= totalCount
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {showLinksModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Translation Links</h2>
            {Object.entries(selectedLinks).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(selectedLinks).map(([lang, url]) => (
                  <div key={lang} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded">
                    <span className="font-medium uppercase">{lang}:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm truncate">{url}</span>
                      <button
                        onClick={() => copyToClipboard(url)}
                        className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No translation links available</p>
            )}
            <button
              onClick={() => setShowLinksModal(false)}
              className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}