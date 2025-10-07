'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { LogOut, Upload, MessageCircle, FileText } from 'lucide-react'
import PDFUpload from '@/components/PDFUpload'

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [tainaraDiet, setTainaraDiet] = useState('')
  const [raphaelDiet, setRaphaelDiet] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const loadDietPlans = async () => {
    try {
      const tainaraResponse = await fetch('/api/diet?username=tainara')
      const raphaelResponse = await fetch('/api/diet?username=raphael')
      
      if (tainaraResponse.ok) {
        const tainaraData = await tainaraResponse.json()
        if (tainaraData.success && tainaraData.dietPlan) {
          setTainaraDiet(tainaraData.dietPlan)
        }
      }
      
      if (raphaelResponse.ok) {
        const raphaelData = await raphaelResponse.json()
        if (raphaelData.success && raphaelData.dietPlan) {
          setRaphaelDiet(raphaelData.dietPlan)
        }
      }
    } catch (error) {
      console.error('Error loading diet plans:', error)
    }
  }

  const handlePDFExtracted = (text: string, username: string) => {
    if (username === 'tainara') {
      setTainaraDiet(text)
      localStorage.setItem('tainaraDiet', text)
    } else if (username === 'raphael') {
      setRaphaelDiet(text)
      localStorage.setItem('raphaelDiet', text)
    }
  }

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn')
    const user = localStorage.getItem('currentUser')
    
    if (!loggedIn || !user) {
      router.push('/')
      return
    }
    
    setIsLoggedIn(true)
    setCurrentUser(user)
    
    // Load saved diets from database and localStorage as fallback
    loadDietPlans()
    const savedTainaraDiet = localStorage.getItem('tainaraDiet')
    const savedRaphaelDiet = localStorage.getItem('raphaelDiet')
    if (savedTainaraDiet) setTainaraDiet(savedTainaraDiet)
    if (savedRaphaelDiet) setRaphaelDiet(savedRaphaelDiet)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('currentUser')
    router.push('/')
  }

  const handleDietSave = async (user: string, diet: string) => {
    try {
      const response = await fetch('/api/diet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user,
          content: diet
        })
      })

      if (response.ok) {
        localStorage.setItem(`${user}Diet`, diet)
        if (user === 'tainara') setTainaraDiet(diet)
    else setRaphaelDiet(diet)
        alert('Diet plan saved successfully!')
      } else {
        alert('Failed to save diet plan')
      }
    } catch (error) {
      console.error('Error saving diet:', error)
      alert('Error saving diet plan')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, user: string) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type === 'application/pdf') {
      // For now, we'll just show a placeholder for PDF content
      // In a real implementation, you'd use pdf-parse here
      const placeholderText = `PDF content for ${user} would be extracted here. 
      
This is where your nutritionist's diet plan would appear after PDF processing.

Example diet content:
- Breakfast: 2 slices whole grain bread, 1 egg, 1 cup coffee
- Snack: 1 apple or 3 crackers
- Lunch: 150g grilled chicken, 100g rice, salad
- Snack: 1 yogurt or handful of nuts
- Dinner: 120g fish, 150g vegetables, 80g pasta

Possible substitutions:
- 2 slices bread = 80g cooked rice
- 100g rice = 100g pasta
- 1 apple = 3 crackers`

      handleDietSave(user, placeholderText)
    } else {
      alert('Please upload a PDF file')
    }
  }

  const sendMessage = async () => {
    if (!currentMessage.trim()) return

    setIsLoading(true)
    const newMessage = { role: 'user', content: currentMessage }
    const updatedMessages = [...chatMessages, newMessage]
    setChatMessages(updatedMessages)
    setCurrentMessage('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: currentUser,
          message: currentMessage
        })
      })

      if (response.ok) {
        const data = await response.json()
        const aiResponse = {
          role: 'assistant',
          content: data.message
        }
        setChatMessages([...updatedMessages, aiResponse])
      } else {
        const errorResponse = {
          role: 'assistant',
          content: 'Sorry, I encountered an error while processing your request. Please try again.'
        }
        setChatMessages([...updatedMessages, errorResponse])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorResponse = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.'
      }
      setChatMessages([...updatedMessages, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLoggedIn) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-700">Diet Manager</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {currentUser}</span>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="tainara" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tainara">Tainara&apos;s Diet</TabsTrigger>
            <TabsTrigger value="raphael">Raphael&apos;s Diet</TabsTrigger>
          </TabsList>

          <TabsContent value="tainara" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Tainara&apos;s Diet Plan
                </CardTitle>
                <CardDescription>
                  Upload your PDF diet plan or enter it manually
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PDFUpload 
                  onPDFExtracted={(text) => handlePDFExtracted(text, 'tainara')} 
                  username="tainara" 
                />
                <Textarea
                  value={tainaraDiet}
                  onChange={(e) => setTainaraDiet(e.target.value)}
                  placeholder="Enter diet plan here or upload a PDF..."
                  className="min-h-[200px]"
                />
                <Button onClick={() => handleDietSave('tainara', tainaraDiet)}>
                  Save Diet Plan
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="raphael" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Raphael&apos;s Diet Plan
                </CardTitle>
                <CardDescription>
                  Upload your PDF diet plan or enter it manually
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PDFUpload 
                  onPDFExtracted={(text) => handlePDFExtracted(text, 'raphael')} 
                  username="raphael" 
                />
                <Textarea
                  value={raphaelDiet}
                  onChange={(e) => setRaphaelDiet(e.target.value)}
                  placeholder="Enter diet plan here or upload a PDF..."
                  className="min-h-[200px]"
                />
                <Button onClick={() => handleDietSave('raphael', raphaelDiet)}>
                  Save Diet Plan
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Chat Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Diet Assistant Chat
            </CardTitle>
            <CardDescription>
              Ask questions about diet substitutions and modifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-64 overflow-y-auto border rounded-md p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <p className="text-gray-500 text-center">
                  Start a conversation about your diet plan...
                </p>
              ) : (
                chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-100 ml-auto max-w-[80%]'
                        : 'bg-gray-100 mr-auto max-w-[80%]'
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">
                      {message.role === 'user' ? 'You' : 'Diet Assistant'}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="bg-gray-100 mr-auto max-w-[80%] p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Diet Assistant</p>
                  <p className="text-sm">Thinking...</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Ask about diet substitutions..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button onClick={sendMessage} disabled={isLoading}>
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}