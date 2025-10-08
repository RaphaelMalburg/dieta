import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const username = formData.get('username') as string

    if (!file || !username) {
      return NextResponse.json(
        { success: false, error: 'File and username are required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'Please upload a PDF file' },
        { status: 400 }
      )
    }

    // Convert file to base64 for Gemini
    const arrayBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString('base64')

    // Use Gemini to parse and structure the PDF content
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' })
    
    const prompt = `You are a diet plan extraction specialist. Please analyze this PDF document and extract all diet-related information in a clear, structured format.

Please organize the extracted content as follows:
1. **Meals**: Breakfast, Lunch, Dinner, Snacks (if mentioned)
2. **Food Items**: List all foods with quantities/portions
3. **Substitutions**: Any alternative foods mentioned
4. **Instructions**: Special preparation notes or timing
5. **Restrictions**: Any dietary restrictions or notes

Format the output in a clean, readable way that a person can easily follow as their diet plan. If the PDF contains non-diet content, focus only on the nutritional and meal planning information.

If the PDF appears to be corrupted or contains no diet-related content, please indicate that clearly.`

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data
        }
      },
      prompt
    ])

    const response = result.response
    const extractedText = response.text()

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'No content could be extracted from the PDF' },
        { status: 400 }
      )
    }

    // Check if the AI detected that this isn't a diet plan
    if (extractedText.toLowerCase().includes('no diet-related content') || 
        extractedText.toLowerCase().includes('corrupted')) {
      return NextResponse.json(
        { success: false, error: 'This PDF does not appear to contain a diet plan' },
        { status: 400 }
      )
    }

    // Find the user and save the diet plan to database
    try {
      const user = await prisma.user.findUnique({
        where: { username }
      })

      if (user) {
        await prisma.dietPlan.upsert({
          where: { userId: user.id },
          update: { content: extractedText },
          create: { userId: user.id, content: extractedText }
        })
      }
    } catch (dbError) {
      console.error('Database error:', dbError)
      // Continue even if database save fails, return the extracted text
    }

    return NextResponse.json({
      success: true,
      text: extractedText,
      message: 'PDF processed successfully with AI!'
    })
  } catch (error) {
    console.error('PDF upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process PDF' },
      { status: 500 }
    )
  }
}