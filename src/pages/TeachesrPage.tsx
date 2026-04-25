import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit, Trash2 } from 'lucide-react'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { Button } from '../components/ui/button'
import { ErrorModal } from '../components/ui/errorModal'
import { fetchTeachers, deleteTeacher } from '../api/teachers'
import { Pagination } from '../components/ui/Pagination'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import api2 from '../api/api2'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog"

export function TeachersPage() {
  const [teachers, setTeachers] = useState([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const navigate = useNavigate()

  const loadTeachers = async () => {
    try {
      setLoading(true)
      const filters = {
        page: currentPage,
        ...(searchTerm && { full_name: searchTerm }),
        ...(selectedDepartment && selectedDepartment !== 'all' && { faculty_department: selectedDepartment })
      }
      const data = await fetchTeachers(filters)
      setTeachers(data.results || [])
      const total = Math.ceil((data.count || 0) / 10)
      setTotalPages(total > 0 ? total : 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teachers')
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await api2.get('/menus/department/')
      setDepartments(response.data)
    } catch (error) {
      console.error('Error fetching departments:', error)
      setError('Failed to load departments')
    }
  }

  useEffect(() => {
    loadTeachers()
    fetchDepartments()
  }, [currentPage, searchTerm, selectedDepartment])

  const handleCreateClick = () => {
    navigate('/karsu-new-admin-panel/teachers/create')
  }


  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeleteId(id)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    
    try {
      await deleteTeacher(deleteId)
      await loadTeachers()
      setIsDeleteModalOpen(false)
      setDeleteId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete teacher')
    }
  }

  const getDepartmentName = (departmentId: number) => {
    const department = departments.find(dept => dept.id === departmentId)
    if (!department) return '-'

    if (department.translations?.kk?.name) {
      return department.translations.kk.name
    }
    if (department.translations?.ru?.name) {
      return department.translations.ru.name
    }
    return '-'
  }

  const columns = [
    {
      header: 'Full Name',
      accessor: 'translations.en.full_name',
      cell: (item: any) => item.translations?.en?.full_name || item.translations?.ru?.full_name || '-'
    },
    {
      header: 'Position',
      accessor: 'translations.en.position',
      cell: (item: any) => item.translations?.en?.position || item.translations?.ru?.position || '-'
    },
    {
      header: 'Email',
      accessor: 'email'
    },
    {
      header: 'Phone',
      accessor: 'phone_number'
    },
    {
      header: 'Department',
      accessor: 'faculty_department',
      cell: (item: any) => getDepartmentName(item.faculty_department)
    }
  ]

  const renderActions = (item: any) => (
    <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="outline"
        size="sm"
        onClick={(_e:any) => handleEditClick(item)}
        className="text-blue-600 border-blue-600 hover:bg-blue-50"
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => handleDeleteClick(e, item.id)}
        className="text-red-600 border-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )

  const handleEditClick = (item: any) => {
    navigate(`/karsu-new-admin-panel/teachers/${item.id}/edit`)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadTeachers()
  }

  if (loading && !teachers.length) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="Teachers" 
        createButtonLabel="Add Teacher" 
        onCreateClick={handleCreateClick} 
      />
      
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="max-w-sm">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem 
                key={dept.id} 
                value={dept.translations?.kk?.name || dept.translations?.ru?.name || `dept-${dept.id}`}
              >
                {dept.translations?.kk?.name || dept.translations?.ru?.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <DataTable
        data={teachers}
        columns={columns}
        onRowClick={handleEditClick}
        actions={renderActions}
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the teacher.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ErrorModal
        isOpen={!!error}
        onClose={() => setError(null)}
        message={error || ''}
      />
    </div>
  )
}