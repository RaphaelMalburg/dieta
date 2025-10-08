'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { LogOut, Upload, MessageCircle, FileText } from 'lucide-react'
import PDFUpload from '@/components/PDFUpload'
import DietPlanDisplay from '@/components/DietPlanDisplay'

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-700">Diet Manager</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-gray-600">Welcome, {currentUser}</span>
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload & Edit Diet Plan
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

              {/* Diet Display Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Tainara&apos;s Diet Plan
                  </CardTitle>
                  <CardDescription>
                    Your organized diet plan overview
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DietPlanDisplay dietPlan={tainaraDiet} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="raphael" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload & Edit Diet Plan
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

              {/* Diet Display Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Raphael&apos;s Diet Plan
                  </CardTitle>
                  <CardDescription>
                    Your organized diet plan overview
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DietPlanDisplay dietPlan={raphaelDiet} />
                </CardContent>
              </Card>
            </div>
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