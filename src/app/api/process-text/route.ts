import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Text content is required' },
        { status: 400 }
      )
    }

    // Use Gemini to parse and structure the text content
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' })
    
    const prompt = `Você é um especialista em extração de planos alimentares. Por favor, analise este texto de plano alimentar e extraia todas as informações relacionadas à dieta em um formato JSON estruturado em português.

Texto do plano alimentar:
${text}

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
- Identifique TODAS as refeições mencionadas no texto (café da manhã, lanche da manhã, almoço, lanche da tarde, jantar, ceia, etc.)
- Para cada refeição, identifique se há múltiplas opções (Opção 1, Opção 2, etc.)
- Mantenha quantidades e porções exatas
- Se não houver informação para alguma seção, use array vazio []
- Retorne APENAS o JSON, sem texto adicional
- Se o texto não contém dieta, retorne: {"erro": "Texto não contém plano alimentar"}

Responda sempre em português brasileiro.`

    const result = await model.generateContent(prompt)
    const response = result.response
    const extractedText = response.text()

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'No content could be processed from the text' },
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
          { success: false, error: 'This text does not appear to contain a diet plan' },
          { status: 400 }
        )
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      // Fallback to original text format if JSON parsing fails
      return NextResponse.json(
        { success: false, error: 'Failed to structure the diet plan text' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      structuredData: structuredData,
      message: 'Text processed successfully with AI!'
    })
  } catch (error) {
    console.error('Text processing error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process text' },
      { status: 500 }
    )
  }
}