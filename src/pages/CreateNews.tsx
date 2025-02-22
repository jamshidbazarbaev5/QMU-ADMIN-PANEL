import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"
import { Button } from '../components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"

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

interface FormValues {
  category: string
  goals: string
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
}

const STEPS = ["images", "ru", "en", "uz", "kk", "review"] as const
type Step = typeof STEPS[number]

export default function CreateNews() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<Step>("images")
  const [currentLanguage] = useState<string>(() => {
    return localStorage.getItem('language') || 'ru'
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [uploadedImages, setUploadedImages] = useState<File[]>([])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`https://debttracker.uz/${currentLanguage}/news/category/`)
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
        const response = await fetch(`https://debttracker.uz/${currentLanguage}/news/goals/`)
        if (!response.ok) throw new Error('Failed to fetch goals')
        const data = await response.json()
        setGoals(data)
      } catch (error) {
        console.error('Error fetching goals:', error)
      }
    }
    fetchGoals()
  }, [currentLanguage])

  const form = useForm<FormValues>({
    defaultValues: {
      category: "",
      goals: "",
      title_ru: "",
      title_en: "",
      title_uz: "",
      title_kk: "",
      description_ru: "",
      description_en: "",
      description_uz: "",
      description_kk: "",
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
      
      const dataTransfer = new DataTransfer()
      const allFiles = [...uploadedImages, ...newFiles]
      allFiles.forEach(file => {
        dataTransfer.items.add(file)
      })
      
      form.setValue('uploaded_images', dataTransfer.files)
    }
  }

  async function onSubmit(values: FormValues) {
    if (currentStep !== "review") {
      nextStep()
      return
    }

    try {
      const formData = new FormData()
      
      console.log('Form Values:', values)
      console.log('Uploaded Images:', uploadedImages)

      formData.append('category', values.category)
      formData.append('goals', values.goals)
      
      if (values.main_image?.[0]) {
        formData.append('main_image', values.main_image[0])
        console.log('Main Image:', values.main_image[0])
      }

      if (values.uploaded_images) {
        Array.from(values.uploaded_images).forEach((file, index) => {
          formData.append(`uploaded_images`, file)
          console.log(`Adding uploaded image ${index}:`, file)
        })
      }

      const translations = {
        ru: {
          title: values.title_ru,
          description: values.description_ru,
        },
        en: {
          title: values.title_en,
          description: values.description_en,
        },
        uz: {
          title: values.title_uz,
          description: values.description_uz,
        },
        kk: {
          title: values.title_kk,
          description: values.description_kk,
        }
      }

      formData.append('translations', JSON.stringify(translations))

      for (let pair of formData.entries()) {
        console.log('FormData Entry:', pair[0], pair[1])
      }

      const response = await fetch(`https://debttracker.uz/${currentLanguage}/news/posts/`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Server Error Response:', errorData)
        throw new Error('Failed to create news post')
      }

      const responseData = await response.json()
      console.log('Success Response:', responseData)

      navigate('/news')
    } catch (error) {
      console.error('Error creating news post:', error)
      alert('Failed to create news post')
    }
  }

  const onTabChange = (value: string) => {
    if (STEPS.includes(value as Step)) {
      setCurrentStep(value as Step)
    }
  }

  return (
    <div className="container mx-auto p-6 mt-[50px]">
      <Card>
        <CardHeader>
          <CardTitle>Create News Post - Step {STEPS.indexOf(currentStep) + 1}</CardTitle>
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
                        <FormItem>
                          <FormLabel>Goals</FormLabel>
                          <FormControl>
                            <select
                              className="w-full rounded-md border border-input bg-background px-3 py-2"
                              {...field}
                            >
                              <option value="">Select a goal</option>
                              {goals.map((goal) => (
                                <option key={goal.id} value={goal.id}>
                                  {goal.translations[currentLanguage]?.name || 
                                   goal.translations.en?.name ||
                                   'Unnamed Goal'}
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
                      name="main_image"
                      render={({ field: { onChange, value, ...field } }) => (
                        <FormItem>
                          <FormLabel>Main Image</FormLabel>
                          <FormControl>
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
                              <div className="grid grid-cols-4 gap-4">
                                {uploadedImages.map((file, index) => (
                                  <div key={index} className="relative">
                                    <img 
                                      src={URL.createObjectURL(file)} 
                                      alt={`Preview ${index + 1}`}
                                      className="w-full h-24 object-cover rounded"
                                    />
                                    <button
                                      type="button"
                                      className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                                      onClick={() => {
                                        const updatedFiles = uploadedImages.filter((_, i) => i !== index)
                                        setUploadedImages(updatedFiles)
                                        
                                        const dataTransfer = new DataTransfer()
                                        updatedFiles.forEach(file => {
                                          dataTransfer.items.add(file)
                                        })
                                        form.setValue('uploaded_images', dataTransfer.files)
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
                            <Textarea {...field} />
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
                            <Textarea {...field} />
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
                            <Textarea {...field} />
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
                            <Textarea {...field} />
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
                  onClick={() => navigate('/news')}
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