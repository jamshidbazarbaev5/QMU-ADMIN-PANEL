// import { useState, useEffect } from 'react'
// import { useLanguage } from '../hooks/useLanguage'
// import { PageHeader } from '../helpers/PageHeader'
// import { DataTable } from '../helpers/DataTable'
// import { Dialog, DialogContent } from '../components/ui/dialog'
// import { TranslatedForm } from '../helpers/TranslatedForm'
// import { Pencil, Trash2 } from 'lucide-react'
// import { Button } from '../components/ui/button'
// import { fetchWithAuth, getAuthHeader } from '../api/api'

// interface Faculty {
//   id: number
//   email: string
//   logo: string
//   translations: {
//     [key: string]: {
//       name: string
//       slug: string
//       description: string
//       history_of_faculty: string
//     }
//   }
// }

// interface DepartmentTranslation {
//   name: string
//   slug?: string
//   description: string
// }

// interface Department {
//   id: number
//   faculty: number
//   translations: {
//     [key: string]: DepartmentTranslation
//   }
// }
// const translatedFields = [
//   { name: 'name', label: 'Name', type: 'text' as const, required: true },
//   { name: 'description', label: 'Description', type: 'richtext' as const, required: true },
// ]

// export function DepartmentPage() {
//   const [departments, setDepartments] = useState<Department[]>([])
//   const [isDialogOpen, setIsDialogOpen] = useState(false)
//   const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
//   const [isLoading, setIsLoading] = useState(false)
//   const [selectedFacultyId, setSelectedFacultyId] = useState<number | ''>('')
//   const [faculties, setFaculties] = useState<Faculty[]>([])

//   const fetchDepartments = async () => {
//     try {
//       const response = await fetch(`https://debttracker.uz/menus/department/`)
//       if (!response.ok) throw new Error('Failed to fetch departments')
//       const data = await response.json()
//       console.log('Fetched departments:', data)
//       setDepartments(data)
//     } catch (error) {
//       console.error('Error fetching departments:', error)
//     }
//   }

//   useEffect(() => {
//     fetchDepartments()
//   }, [currentLanguage])

//   useEffect(() => {
//     // Fetch faculties when component mounts
//     fetch('https://debttracker.uz/menus/faculty/')
//       .then(res => res.json())
//       .then(data => setFaculties(data))
//   }, [])

//   const handleSubmit = async (translationData: any) => {
//     if (!selectedFacultyId) {
//       alert('Please select a faculty');
//       return;
//     }

//     console.log('Submitting translations:', translationData)
//     setIsLoading(true)
//     try {
//       const submitData = {
//         faculty: selectedFacultyId,
//         translations: translationData
//       }

//       const url = editingDepartment 
//         ? `https://debttracker.uz/menus/department/${editingDepartment.translations[currentLanguage].slug}/`
//         : `https://debttracker.uz/${}/menus/department/`

//       const response = await fetchWithAuth(url, {
//         method: editingDepartment ? 'PUT' : 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           ...getAuthHeader()
//         },
//         body: JSON.stringify(submitData)
//       })

//       if (!response.ok) throw new Error('Failed to save department')
      
//       await fetchDepartments()
//       setIsDialogOpen(false)
//       setEditingDepartment(null)
//     } catch (error) {
//       console.error('Error saving department:', error)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handleDelete = async (department: Department) => {
//     if (!window.confirm('Are you sure you want to delete this department?')) return

//     try {
//       const response = await fetch(
//         `https://debttracker.uz/${currentLanguage}/menus/department/${department.translations[currentLanguage].slug}/`,
//         { method: 'DELETE', headers: getAuthHeader() }
//       )
      
//       if (!response.ok) throw new Error('Failed to delete department')
//       await fetchDepartments()
//     } catch (error) {
//       console.error('Error deleting department:', error)
//     }
//   }

//   const columns = [
//     { 
//       header: 'Name',
//       accessor: 'translations',
//       cell: (item: Department) => item.translations[currentLanguage]?.name
//     },
//     { 
//       header: 'Description',
//       accessor: 'translations',
//       cell: (item: Department) =>  <div 
//       className="max-w-md truncate"
//       dangerouslySetInnerHTML={{ 
//         __html: item.translations[currentLanguage]?.description || '-'
//       }}
//     />
//     },
//   ]

//   const handleEdit = (department: Department) => {
//     console.log('Editing department:', department)
//     setEditingDepartment(department)
//     setIsDialogOpen(true)
//   }

//   return (
//     <div className="container mx-auto py-6">
//       <PageHeader
//         title="Departments"
//         createButtonLabel="Add Department"
//         onCreateClick={() => {
//           setEditingDepartment(null)
//           setIsDialogOpen(true)
//         }}
//       />

//       <DataTable
//         data={departments}
//         columns={columns}
//         currentLanguage={currentLanguage}
//         actions={(item: Department) => (
//           <div className="flex gap-2">
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={(e) => {
//                 e.stopPropagation()
//                 handleEdit(item)
//               }}
//             >
//               <Pencil className="h-4 w-4" />
//             </Button>
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={(e) => {
//                 e.stopPropagation()
//                 handleDelete(item)
//               }}
//             >
//               <Trash2 className="h-4 w-4 text-red-500" />
//             </Button>
//           </div>
//         )}
//       />

//       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//         <DialogContent className="max-w-3xl w-[90vw]">
//           <h2 className="text-lg font-semibold mb-4">
//             {editingDepartment ? 'Edit Department' : 'Create Department'}
//           </h2>

//           <div className="mb-4">
//             <label className="block text-sm font-medium mb-1">Faculty</label>
//             <select 
//               className="w-full p-2 border rounded-md"
//               value={editingDepartment?.faculty || selectedFacultyId}
//               onChange={(e) => {
//                 const value = e.target.value ? Number(e.target.value) : '';
//                 if (editingDepartment) {
//                   setEditingDepartment({
//                     ...editingDepartment,
//                     faculty: value as number
//                   });
//                 }
//                 setSelectedFacultyId(value);
//               }}
//               required
//             >
//               <option value="">Select Faculty</option>
//               {faculties.map(faculty => (
//                 <option key={faculty.id} value={faculty.id}>
//                   {faculty.translations.en?.name || faculty.translations.ru?.name}
//                 </option>
//               ))}
//             </select>
//           </div>
          
//           <TranslatedForm
//             fields={translatedFields}
//             languages={['en', 'ru', 'uz', 'kk']}
//             onSubmit={handleSubmit}
//             initialData={editingDepartment?.translations}
//             isLoading={isLoading}
//           />
//         </DialogContent>
//       </Dialog>
//     </div>
//   )
// }