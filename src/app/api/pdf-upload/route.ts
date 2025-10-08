import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const username = formData.get('username') as string

    // Debug logging
    console.log('API Debug - Received data:', {
      file: file ? { name: file.name, type: file.type, size: file.size } : null,
      username: username,
      usernameType: typeof username,
      usernameValue: JSON.stringify(username),
      formDataKeys: Array.from(formData.keys()),
      allFormData: Object.fromEntries(formData.entries())
    })

    if (!file || !username) {
      console.log('Validation failed:', { 
        fileExists: !!file, 
        usernameExists: !!username,
        usernameEmpty: username === '',
        usernameNull: username === null,
        usernameUndefined: username === undefined
      })
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
    
    const prompt = `Você é um especialista em extração de planos alimentares. Por favor, analise este documento PDF e extraia todas as informações relacionadas à dieta em um formato claro e estruturado em português.

Por favor, organize o conteúdo extraído da seguinte forma:

**Refeições:**
- **Café da Manhã**: [liste todos os alimentos e quantidades]
- **Lanche da Manhã**: [se mencionado, liste todos os alimentos e quantidades]
- **Almoço**: [liste todos os alimentos e quantidades]
- **Lanche da Tarde**: [se mencionado, liste todos os alimentos e quantidades]
- **Jantar**: [liste todos os alimentos e quantidades]
- **Ceia**: [se mencionado, liste todos os alimentos e quantidades]

**Substituições:**
[Liste todas as substituições alimentares mencionadas]

**Instruções:**
[Notas especiais de preparo, horários ou orientações]

**Restrições:**
[Qualquer restrição alimentar ou observação importante]

IMPORTANTE: 
- Identifique TODAS as refeições mencionadas no PDF, mesmo que tenham nomes diferentes (ex: "lanche", "merenda", "colação", etc.)
- Mantenha as quantidades e porções exatas como descritas
- Use formatação clara com marcadores para facilitar a leitura
- Se o PDF contém conteúdo não relacionado à dieta, foque apenas nas informações nutricionais e de planejamento alimentar
- Responda sempre em português brasileiro

Se o PDF parecer corrompido ou não contiver conteúdo relacionado à dieta, indique isso claramente em português.`

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