import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"
import { Button } from '../components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import {fetchWithAuth, getAuthHeader} from "../api/api"
import { RichTextEditor } from '../components/ckeditor/RichTextEditor'

interface Translation {
  name: string
  slug: string
}

interface Category {
  id: number
  translations: {
    [key: string]: Translation
  }
}

interface Goal {
  id: number
  translations: {
    [key: string]: Translation
  }
  goals: number
  color: string
}

interface NewsImage {
  id: number
  image: string
}

interface FormValues {
  category: string
  goals: string[]
  main_image: FileList
  uploaded_images: FileList
  title_ru: string
  title_en: string
  title_uz: string
  title_kk: string
  description_ru: string
  description_en: string
  description_uz: string
  description_kk: string
  date_posted_date: string
  date_posted_time: string
  date_posted: string
}

const STEPS = ["images", "ru", "en", "uz", "kk", "review"] as const
type Step = typeof STEPS[number]

// Helper function to handle date conversion
const formatDateForInput = (dateString: string) => {
  const date = new Date(dateString)
  // Adjust for local timezone
  const tzOffset = date.getTimezoneOffset() * 60000 // offset in milliseconds
  const localDate = new Date(date.getTime() - tzOffset)
  return {
    date: localDate.toISOString().split('T')[0], // YYYY-MM-DD
    time: localDate.toISOString().split('T')[1].slice(0, 5) // HH:mm
  }
}

const formatDateForServer = (date: string, time: string) => {
  const combined = `${date}T${time}:00.000Z`
  return new Date(combined).toISOString()
}

export default function CreateNews() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const newsId = searchParams.get('id')
  const isEditing = !!newsId
  const [currentStep, setCurrentStep] = useState<Step>("images")
  const [currentLanguage] = useState<string>(() => {
    return localStorage.getItem('language') || 'kk'
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<NewsImage[]>([])
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(isEditing)
  const [isGoalsDropdownOpen, setIsGoalsDropdownOpen] = useState(false)
  const [, setError] = useState<Record<string, string[]> | string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetchWithAuth(`https://karsu.uz/api/news/category/`,{
          headers:getAuthHeader()
        })
        if (!response.ok) throw new Error('Failed to fetch categories')
        const data = await response.json()
        setCategories(data)
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    fetchCategories()
  }, [currentLanguage])

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await fetchWithAuth(`https://karsu.uz/api/news/goals/`,
            {
              headers:getAuthHeader(),
            }
            )
        if (!response.ok) throw new Error('Failed to fetch goals')
        const data = await response.json()
        setGoals(data)
      } catch (error) {
        console.error('Error fetching goals:', error)
      }
    }
    fetchGoals()
  }, [currentLanguage])

  useEffect(() => {
    const fetchNewsData = async () => {
      if (!newsId) return

      try {
        const response = await fetchWithAuth(`https://karsu.uz/api/news/posts/${newsId}/`, {
          headers: {
            ...getAuthHeader()
          }
        })
        
        if (!response.ok) throw new Error('Failed to fetch news data')
        
        const data = await response.json()
        
        const { date, time } = formatDateForInput(data.date_posted || new Date().toISOString())
        
        form.reset({
          category: data.category?.toString() || "",
          goals: data.display_goals?.map((g:any) => g.id.toString()) || [],
          title_ru: data.translations?.ru?.title || "",
          title_en: data.translations?.en?.title || "",
          title_uz: data.translations?.uz?.title || "",
          title_kk: data.translations?.kk?.title || "",
          description_ru: data.translations?.ru?.description || "",
          description_en: data.translations?.en?.description || "",
          description_uz: data.translations?.uz?.description || "",
          description_kk: data.translations?.kk?.description || "",
          date_posted_date: date,
          date_posted_time: time,
          date_posted: data.date_posted || new Date().toISOString(),
        })

        // Handle existing images
        if (data.images) {
          // Store existing images URLs
          setExistingImages([
            {
              id: -1, // Main image gets ID -1
              image: data.main_image
            },
            ...data.images.map((img:any, index:any) => ({
              id: index + 1,
              image: img.image
            }))
          ]);
        }

      } catch (error) {
        console.error('Error fetching news data:', error)
        alert('Failed to load news data')
      } finally {
        setIsLoadingInitialData(false)
      }
    }

    if (isEditing) {
      fetchNewsData()
    }
  }, [newsId, currentLanguage])

  const form = useForm<FormValues>({
    defaultValues: {
      category: "",
      goals: [],
      title_ru: "",
      title_en: "",
      title_uz: "",
      title_kk: "",
      description_ru: "",
      description_en: "",
      description_uz: "",
      description_kk: "",
      date_posted_date: new Date().toISOString().split('T')[0],
      date_posted_time: new Date().toISOString().split('T')[1].slice(0, 5),
      date_posted: new Date().toISOString(),
    },
  })

  const nextStep = () => {
    const currentIndex = STEPS.indexOf(currentStep)
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1])
    }
  }

  const previousStep = () => {
    const currentIndex = STEPS.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1])
    }
  }

  const handleAdditionalImages = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files)
      setUploadedImages(prev => [...prev, ...newFiles])
      
      // Add new images to existingImages with new IDs
      const lastId = Math.max(...existingImages.map(img => img.id), 0)
      const newImages = newFiles.map((file, index) => ({
        id: lastId + index + 1,
        image: URL.createObjectURL(file)
      }))
      setExistingImages(prev => [...prev, ...newImages])
    }
  }

 

  async function onSubmit(values: FormValues) {
    if (currentStep !== "review") {
      nextStep()
      return
    }

    try {
      const formData = new FormData()
      
      // Add basic fields
      if (values.category) {
        formData.append('category', values.category)
      }

      if (values.goals && Array.isArray(values.goals)) {
        values.goals
          .filter(goalId => goalId != null)
          .forEach(goalId => {
            formData.append('goals', goalId.toString())
          })
      }
      
      // Add main image if selected
      if (values.main_image?.[0]) {
        formData.append('main_image', values.main_image[0])
      }

      // Add only new uploaded images
      uploadedImages.forEach((file) => {
        formData.append('uploaded_images', file)
      })

      // Add existing image URLs if needed
      if (existingImages.length > 0) {
        formData.append('existing_images', JSON.stringify(
          existingImages.map(img => img.image)
        ))
      }

      formData.append('date_posted', values.date_posted)

      const translations: Record<string, { title: string; description: string }> = {}

      const hasContent = (title: string, description: string) => {
        return (title?.trim() || description?.trim()) ? true : false
      }

      if (hasContent(values.title_ru, values.description_ru)) {
        translations.ru = {
          title: values.title_ru || '',
          description: values.description_ru || '',
        }
      }

      if (hasContent(values.title_en, values.description_en)) {
        translations.en = {
          title: values.title_en || '',
          description: values.description_en || '',
        }
      }

      if (hasContent(values.title_uz, values.description_uz)) {
        translations.uz = {
          title: values.title_uz || '',
          description: values.description_uz || '',
        }
      }

      if (hasContent(values.title_kk, values.description_kk)) {
        translations.kk = {
          title: values.title_kk || '',
          description: values.description_kk || '',
        }
      }

      // Only append translations if there are any
      if (Object.keys(translations).length > 0) {
        formData.append('translations', JSON.stringify(translations))
      }

      const url = isEditing 
        ? `https://karsu.uz/api/news/posts/${newsId}/`
        : `https://karsu.uz/api/news/posts/`

      console.log('=== FormData contents ===')
      for (let [key, value] of formData.entries()) {
        console.log(key, ':', typeof value === 'string' ? value : 'File:', value instanceof File ? value.name : '')
      }

      const response = await fetchWithAuth(url, {
        method: isEditing ? 'PUT' : 'POST',
        body: formData,
        headers: {
          ...getAuthHeader()
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Server Error Response:', errorData)
        setError(errorData)
        return
      }

      navigate('/karsu-admin-panel/news')
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to submit form')
    }
  }

  const onTabChange = (value: string) => {
    if (STEPS.includes(value as Step)) {
      setCurrentStep(value as Step)
    }
  }

 

  if (isLoadingInitialData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C5DD3]"></div>
        </div>
      </div>
    )
  }
  console.log(existingImages)

  return (
    <div className="container mx-auto p-6 mt-[50px]">
     
      
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit News Post' : 'Create News Post'} - Step {STEPS.indexOf(currentStep) + 1}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Tabs value={currentStep} className="w-full" onValueChange={onTabChange}>
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="images">Images</TabsTrigger>
                  <TabsTrigger value="ru">Russian</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="uz">Uzbek</TabsTrigger>
                  <TabsTrigger value="kk">Karakalpak</TabsTrigger>
                  <TabsTrigger value="review">Review</TabsTrigger>
                </TabsList>

                {/* Images Step */}
                <TabsContent value="images">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="date_posted_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Publication Date</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e.target.value)
                                  const newDateTime = formatDateForServer(
                                    e.target.value,
                                    form.getValues('date_posted_time')
                                  )
                                  form.setValue('date_posted', newDateTime)
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="date_posted_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Publication Time</FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e.target.value)
                                  const newDateTime = formatDateForServer(
                                    form.getValues('date_posted_date'),
                                    e.target.value
                                  )
                                  form.setValue('date_posted', newDateTime)
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <FormControl>
                            <select
                              className="w-full rounded-md border border-input bg-background px-3 py-2"
                              {...field}
                            >
                              <option value="">Select a category</option>
                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.translations[currentLanguage]?.name || 
                                   category.translations.en?.name ||
                                   'Unnamed Category'}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="goals"
                      render={({ field }) => (
                        <FormItem className="relative">
                          <FormLabel>Goals</FormLabel>
                          <FormControl>
                            <div>
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-between"
                                onClick={() => setIsGoalsDropdownOpen(!isGoalsDropdownOpen)}
                              >
                                {field.value.length > 0 
                                  ? `${field.value.length} goals selected`
                                  : "Select goals"}
                                <span className="ml-2">▼</span>
                              </Button>
                              
                              {isGoalsDropdownOpen && (
                                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                                  {goals.map((goal) => (
                                    <div
                                      key={goal.id}
                                      className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                      onClick={() => {
                                        const goalId = goal.id.toString()
                                        const newValue = field.value.includes(goalId)
                                          ? field.value.filter(id => id !== goalId)
                                          : [...field.value, goalId]
                                        field.onChange(newValue)
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={field.value.includes(goal.id.toString())}
                                        onChange={() => {}}
                                        className="mr-2"
                                      />
                                      <span>
                                        {goal.translations[currentLanguage]?.name || 
                                         goal.translations.en?.name ||
                                         'Unnamed Goal'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="main_image"
                      render={({ field: { onChange, value, ...field } }) => (
                        <FormItem>
                          <FormLabel>Main Image</FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              <Input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => {
                                  const files = e.target.files
                                  if (files?.length) {
                                    onChange(files)
                                  }
                                }}
                                {...field}
                                value={undefined}
                              />
                              {/* Show existing main image if available */}
                              {isEditing && existingImages.length > 0 && existingImages[0].id === -1 && (
                                <div className="mt-2">
                                  <img 
                                    src={existingImages[0].image} 
                                    alt="Current main image"
                                    className="w-full max-w-md h-auto rounded"
                                  />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="uploaded_images"
                      render={({ field: { onChange, value, ...field } }) => (
                        <FormItem>
                          <FormLabel>Additional Images</FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              <Input 
                                type="file" 
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                  handleAdditionalImages(e.target.files)
                                }}
                                {...field}
                                value={undefined}
                              />
                              
                              {/* Display grid of images */}
                              <div className="grid grid-cols-4 gap-4">
                                {/* Display all images (existing + new) */}
                                {existingImages
                                  .filter(image => image.id !== -1) // Filter out main image
                                  .map((image) => (
                                  <div key={image.id} className="relative">
                                    <img 
                                      src={image.image} 
                                      alt="Image"
                                      className="w-full h-24 object-cover rounded"
                                    />
                                    <button
                                      type="button"
                                      className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                                      onClick={() => {
                                        // Remove from both states
                                        setExistingImages(prev => prev.filter(img => img.id !== image.id))
                                        setUploadedImages(prev => prev.filter((_, idx) => 
                                          idx !== existingImages.findIndex(img => img.id === image.id)
                                        ))
                                      }}
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Russian Content Step */}
                <TabsContent value="ru">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title_ru"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title (RU)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description_ru"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (RU)</FormLabel>
                          <FormControl>
                            <RichTextEditor
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* English Content Step */}
                <TabsContent value="en">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title_en"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title (EN)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description_en"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (EN)</FormLabel>
                          <FormControl>
                            <RichTextEditor
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Uzbek Content Step */}
                <TabsContent value="uz">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title_uz"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title (UZ)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description_uz"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (UZ)</FormLabel>
                          <FormControl>
                            <RichTextEditor
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Kazakh Content Step */}
                <TabsContent value="kk">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title_kk"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title (KK)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description_kk"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (KK)</FormLabel>
                          <FormControl>
                            <RichTextEditor
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Review Step */}
                <TabsContent value="review">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Review your submission</h3>
                    {/* Add a summary of all entered information */}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-between gap-4">
                {currentStep !== "images" && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={previousStep}
                  >
                    Previous
                  </Button>
                )}
                
                <div className="flex-1" />

                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate('/karsu-admin-panel/news')}
                >
                  Cancel
                </Button>

                <Button 
                  type="submit" 
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {currentStep === "review" ? "Create News Post" : "Next"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}