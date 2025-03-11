import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '../helpers/DataTable'
import { PageHeader } from '../helpers/PageHeader'
import { Edit, Trash2 } from 'lucide-react'

export function QuantityList() {
  const navigate = useNavigate()
  const [quantities, setQuantities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const token = localStorage.getItem('accessToken')

  useEffect(() => {
    fetchQuantities()
  }, [])

  const fetchQuantities = async () => {
    try {
      const response = await fetch('https://debttracker.uz/publications/quantities', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setQuantities(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return

    try {
      const response = await fetch(`https://debttracker.uz/publications/quantities/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
      if (!response.ok) throw new Error('Failed to delete')
      fetchQuantities()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const columns = [
    { header: 'Title', accessor: 'title', cell: (item: any) => item.translations['kk']?.title || '-' },
    { header: 'Quantity', accessor: 'quantity' },
  ]

  const renderActions = (item: any) => (
    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => navigate(`/quantities/${item.id}/edit`)}
        className="p-2 text-blue-600 hover:text-blue-800"
      >
        <Edit size={16} />
      </button>
      <button
        onClick={() => handleDelete(item.id)}
        className="p-2 text-red-600 hover:text-red-800"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <PageHeader
        title="Quantities"
        createButtonLabel="Create Quantity"
        onCreateClick={() => navigate('/quantities/new')}
      />
      <DataTable
        data={quantities}
        columns={columns}
        actions={renderActions}
        onRowClick={(item) => navigate(`/quantities/edit/${item.id}`)}
      />
    </div>
  )
}