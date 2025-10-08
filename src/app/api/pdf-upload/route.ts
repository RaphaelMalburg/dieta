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
    
    const prompt = `Você é um especialista em extração de planos alimentares. Por favor, analise este documento PDF e extraia todas as informações relacionadas à dieta em um formato JSON estruturado em português.

Retorne APENAS um JSON válido no seguinte formato:

{
  "informacoes_gerais": {
    "calorias_diarias": "valor se mencionado",
    "macronutrientes": "distribuição se mencionada",
    "suplementacao": "informações se mencionadas"
  },
  "refeicoes": [
    {
      "nome": "Café da Manhã",
      "horario": "horário se mencionado",
      "opcoes": [
        {
          "numero": 1,
          "alimentos": [
            {
              "item": "nome do alimento",
              "quantidade": "quantidade específica",
              "observacoes": "observações especiais se houver"
            }
          ]
        }
      ]
    }
  ],
  "substituicoes": [
    {
      "alimento_original": "nome do alimento",
      "substitutos": ["lista de substitutos"],
      "descricao": "explicação sobre a substituição"
    }
  ],
  "instrucoes": [
    {
      "tipo": "preparo/horario/geral",
      "descricao": "instrução específica"
    }
  ],
  "restricoes": [
    {
      "tipo": "alergia/intolerancia/preferencia",
      "descricao": "descrição da restrição"
    }
  ]
}

IMPORTANTE: 
- Identifique TODAS as refeições mencionadas no PDF (café da manhã, lanche da manhã, almoço, lanche da tarde, jantar, ceia, etc.)
- Para cada refeição, identifique se há múltiplas opções (Opção 1, Opção 2, etc.)
- Mantenha quantidades e porções exatas
- Se não houver informação para alguma seção, use array vazio []
- Retorne APENAS o JSON, sem texto adicional
- Se o PDF não contém dieta, retorne: {"erro": "Documento não contém plano alimentar"}

Responda sempre em português brasileiro.`

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

    // Try to parse JSON response
    let structuredData
    try {
      // Clean the response to extract only JSON
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        structuredData = JSON.parse(jsonMatch[0])
      } else {
        structuredData = JSON.parse(extractedText)
      }
      
      // Check if the AI detected that this isn't a diet plan
      if (structuredData.erro) {
        return NextResponse.json(
          { success: false, error: 'This PDF does not appear to contain a diet plan' },
          { status: 400 }
        )
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      // Fallback to original text format if JSON parsing fails
      structuredData = { content: extractedText }
    }

    // Find the user and save the diet plan to database
    try {
      const user = await prisma.user.findUnique({
        where: { username }
      })

      if (user) {
        await prisma.dietPlan.upsert({
          where: { userId: user.id },
          update: { content: JSON.stringify(structuredData) },
          create: { userId: user.id, content: JSON.stringify(structuredData) }
        })
      }
    } catch (dbError) {
      console.error('Database error:', dbError)
      // Continue even if database save fails, return the extracted text
    }

    return NextResponse.json({
      success: true,
      text: extractedText,
      structuredData: structuredData,
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