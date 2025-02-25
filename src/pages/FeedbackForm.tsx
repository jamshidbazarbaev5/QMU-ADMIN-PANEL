import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Button } from '../components/ui/button'
import { useForm } from 'react-hook-form'
import { getAuthHeader } from '../api/api'

interface FeedbackFormValues {
  full_name: string
  email: string
  message: string
}

export default function FeedbackForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentLanguage = useLanguage()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FeedbackFormValues>({
    defaultValues: {
      full_name: '',
      email: '',
      message: '',
    },
  })

  useEffect(() => {
    if (id) {
      fetchFeedback()
    }
  }, [id, currentLanguage])

  const fetchFeedback = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`https://debttracker.uz/${currentLanguage}/feedback/${id}/`, {
        headers: {
          ...getAuthHeader()
        }
      })
      if (!response.ok) throw new Error('Failed to fetch feedback')
      const data = await response.json()
      form.reset({
        full_name: data.full_name,
        email: data.email,
        message: data.message
      })
    } catch (error) {
      console.error('Error fetching feedback:', error)
      alert('Failed to fetch feedback')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (values: FeedbackFormValues) => {
    try {
      setIsLoading(true)
      const url = `https://debttracker.uz/${currentLanguage}/feedback/${id ? `${id}/` : ''}`
      const method = id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) throw new Error('Failed to save feedback')
      
      navigate('/feedback')
    } catch (error) {
      console.error('Error saving feedback:', error)
      alert('Failed to save feedback')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && id) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6C5DD3]" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{id ? 'Edit' : 'Create'} Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/feedback')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {id ? 'Update' : 'Create'} Feedback
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}