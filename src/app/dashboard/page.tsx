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
      // Load Tainara's diet plan
      const tainaraResponse = await fetch('/api/diet?username=tainara')
      if (tainaraResponse.ok) {
        const tainaraData = await tainaraResponse.json()
        if (tainaraData.success && tainaraData.dietPlan) {
          setTainaraDiet(tainaraData.dietPlan)
        }
      }
      
      // Load Raphael's diet plan
      const raphaelResponse = await fetch('/api/diet?username=raphael')
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

  const handlePDFExtracted = async (text: string, username: string) => {
    console.log('=== Dashboard handlePDFExtracted Debug ===')
    console.log('Received text:', text)
    console.log('Text type:', typeof text)
    console.log('Text length:', text.length)
    console.log('Username:', username)
    
    try {
      // Save directly to database
      const response = await fetch('/api/diet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          content: text
        })
      })

      if (response.ok) {
        console.log('Database save successful, updating local state...')
        // Update local state
        if (username === 'tainara') {
          setTainaraDiet(text)
          console.log('Updated tainaraDiet state with:', text.substring(0, 100) + '...')
        } else if (username === 'raphael') {
          setRaphaelDiet(text)
          console.log('Updated raphaelDiet state with:', text.substring(0, 100) + '...')
        }
        alert('PDF uploaded and saved successfully!')
      } else {
        console.error('Database save failed:', response.status)
        alert('Failed to save PDF data')
      }
    } catch (error) {
      console.error('Error saving PDF data:', error)
      alert('Error saving PDF data')
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
    if (!diet.trim()) {
      alert('Please enter some diet plan content')
      return
    }

    try {
      let contentToSave = diet.trim()

      // Check if it's already JSON (from PDF upload)
      let isJSON = false
      try {
        JSON.parse(contentToSave)
        isJSON = true
      } catch {
        // Not JSON, process with AI
      }

      // If it's plain text, process it with AI
      if (!isJSON) {
        try {
          const processResponse = await fetch('/api/process-text', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: contentToSave })
          })

          if (processResponse.ok) {
            const processData = await processResponse.json()
            if (processData.success && processData.structuredData) {
              contentToSave = JSON.stringify(processData.structuredData)
            }
          }
        } catch (processError) {
          console.error('AI processing failed:', processError)
        }
      }

      // Save to database
      const response = await fetch('/api/diet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user,
          content: contentToSave
        })
      })

      if (response.ok) {
        // Update local state
        if (user === 'tainara') setTainaraDiet(contentToSave)
        else setRaphaelDiet(contentToSave)
        
        alert('Diet plan saved successfully!')
      } else {
        alert('Failed to save diet plan')
      }
    } catch (error) {
      console.error('Error saving diet plan:', error)
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
              Food Swap Assistant
            </CardTitle>
            <CardDescription>
              Get objective calorie-based food substitutions. Information is educational only - consult a nutritionist for personalized advice.
            </CardDescription>
            <div className="mt-2 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800 font-medium mb-1">💡 Try asking:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• &quot;Posso substituir 100g de arroz branco por algo?&quot;</li>
                <li>• &quot;O que posso comer no lugar de 150g de batata?&quot;</li>
                <li>• &quot;Alternativas para 200g de peito de frango&quot;</li>
              </ul>
            </div>
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
                      {message.role === 'user' ? 'Você' : 'Food Swap Assistant'}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="bg-gray-100 mr-auto max-w-[80%] p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Food Swap Assistant</p>
                  <p className="text-sm">Calculando substituições...</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Ex: Posso substituir 100g de arroz por algo?"
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