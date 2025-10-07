import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { saveChatMessage, getChatMessages, getUserByUsername, getDietPlan } from '@/lib/database'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { username, message } = await request.json()

    if (!username || !message) {
      return NextResponse.json(
        { error: 'Username and message are required' },
        { status: 400 }
      )
    }

    const user = getUserByUsername(username)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Save user message
    saveChatMessage(user.id, 'user', message)

    // Get user's diet plan for context
    const dietPlan = getDietPlan(user.id)
    const dietContext = dietPlan?.content || 'No diet plan available'

    // Get recent chat history for context
    const recentMessages = getChatMessages(user.id, 10)
    const chatHistory = recentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')

    // Create the prompt with diet context
    const prompt = `You are a helpful diet assistant. You have access to the user's diet plan and should provide advice based on it.

User's Diet Plan:
${dietContext}

Recent conversation:
${chatHistory}

User's current question: ${message}

Please provide helpful advice about diet substitutions, meal planning, or nutritional guidance based on the user's diet plan. Keep responses concise and practical. If suggesting substitutions, try to maintain similar nutritional values.`

    // Generate response using Gemini
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' })
    const result = await model.generateContent(prompt)
    const response = result.response
    const aiMessage = response.text()

    // Save AI response
    saveChatMessage(user.id, 'assistant', aiMessage)

    return NextResponse.json({
      success: true,
      message: aiMessage
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    const user = getUserByUsername(username)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const messages = getChatMessages(user.id)

    return NextResponse.json({
      success: true,
      messages
    })
  } catch (error) {
    console.error('Chat history error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}