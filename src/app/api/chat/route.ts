import { NextRequest, NextResponse } from 'next/server'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { prisma } from '@/lib/prisma'
import { foodSwapCalculator } from '@/lib/foodSwapUtils'

const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  apiKey: process.env.GEMINI_API_KEY!,
  temperature: 0.3, // Lower temperature for more consistent, objective responses
})

const outputParser = new StringOutputParser()

// System prompt template for food swap recommendations
const systemPrompt = SystemMessagePromptTemplate.fromTemplate(`
Você é um assistente especializado em substituições alimentares baseadas em calorias. Suas respostas devem ser:

1. **OBJETIVAS**: Forneça informações factuais sobre calorias e nutrição
2. **BASEADAS EM DADOS**: Use apenas informações nutricionais verificáveis
3. **SEGURAS**: Nunca dê conselhos médicos específicos ou recomendações para condições de saúde
4. **FOCADAS EM CALORIAS**: Priorize equivalências calóricas nas substituições

**REGRAS IMPORTANTES:**
- Sempre mencione que as informações são apenas educativas
- Sugira consultar um nutricionista para orientações personalizadas
- Forneça quantidades específicas em gramas
- Inclua informações sobre proteínas, carboidratos e gorduras quando relevante
- Mantenha respostas concisas (máximo 200 palavras)

**FORMATO DE RESPOSTA PARA SUBSTITUIÇÕES:**
- Alimento original: [nome] ([quantidade]g = [calorias] kcal)
- Substituição sugerida: [nome] ([quantidade]g = [calorias] kcal)
- Diferença nutricional: [proteínas/carboidratos/gorduras]

Plano alimentar do usuário:
{dietPlan}

Histórico da conversa:
{chatHistory}
`)

const humanPrompt = HumanMessagePromptTemplate.fromTemplate(`{message}`)

const chatPrompt = ChatPromptTemplate.fromMessages([
  systemPrompt,
  humanPrompt
])

const chain = chatPrompt.pipe(model).pipe(outputParser)

// Function to detect if message is asking for food swaps
function isFoodSwapQuery(message: string): boolean {
  const swapKeywords = [
    'substituir', 'trocar', 'substituição', 'troca', 'equivalente',
    'similar', 'parecido', 'mesmo valor', 'mesma caloria', 'swap',
    'alternativa', 'opção', 'pode comer', 'no lugar de'
  ]
  
  const messageWords = message.toLowerCase()
  return swapKeywords.some(keyword => messageWords.includes(keyword))
}

// Function to extract food names and quantities from message
function extractFoodInfo(message: string): { food: string; quantity?: number } | null {
  // Simple regex to find food mentions with quantities
  const patterns = [
    /(\d+)\s*g?\s+de\s+([a-záàâãéêíóôõúç\s]+)/gi,
    /([a-záàâãéêíóôõúç\s]+)\s+(\d+)\s*g/gi,
    /(\d+)\s*gramas?\s+de\s+([a-záàâãéêíóôõúç\s]+)/gi
  ]
  
  for (const pattern of patterns) {
    const match = pattern.exec(message)
    if (match) {
      const quantity = parseInt(match[1])
      const food = match[2].trim()
      return { food, quantity }
    }
  }
  
  // If no quantity found, try to extract just food name
  const foodPattern = /(?:substituir|trocar|no lugar de)\s+([a-záàâãéêíóôõúç\s]+)/gi
  const foodMatch = foodPattern.exec(message)
  if (foodMatch) {
    return { food: foodMatch[1].trim() }
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { username, message } = await request.json()

    if (!username || !message) {
      return NextResponse.json(
        { error: 'Username and message are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { dietPlan: true }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        userId: user.id,
        role: 'user',
        content: message
      }
    })

    // Get user's diet plan for context
    const dietContext = user.dietPlan?.content || 'Nenhum plano alimentar disponível'

    // Get recent chat history for context
    const recentMessages = await prisma.chatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 6 // Reduced for more focused context
    })
    const chatHistory = recentMessages.reverse()
      .map(msg => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`)
      .join('\n')

    let aiMessage = ''

    // Check if this is a food swap query
    if (isFoodSwapQuery(message)) {
      const foodInfo = extractFoodInfo(message)
      
      if (foodInfo) {
        const { food, quantity = 100 } = foodInfo
        
        try {
          // Try to find food swaps using our calculator
          const swaps = await foodSwapCalculator.suggestSwaps(food, quantity)
          
          if (swaps.length > 0) {
            const originalFood = await foodSwapCalculator.getNutritionInfo(food)
            const originalCalories = originalFood ? Math.round((originalFood.calories_per_100g * quantity) / 100) : 'N/A'
            
            let swapResponse = `**Substituições para ${food} (${quantity}g = ${originalCalories} kcal):**\n\n`
            
            swaps.forEach((swap, index) => {
              swapResponse += `${index + 1}. **${swap.food}** - ${swap.quantity}g (${swap.category})\n`
              swapResponse += `   • Calorias: ${swap.calories} kcal\n\n`
            })
            
            swapResponse += `*Informações apenas educativas. Consulte um nutricionista para orientações personalizadas.*`
            aiMessage = swapResponse
          }
        } catch (error) {
          console.error('Error getting food swaps:', error)
          // Fall through to general AI response
        }
      }
    }

    // If no specific food swap was found, use LangChain for general response
    if (!aiMessage) {
      aiMessage = await chain.invoke({
        dietPlan: dietContext,
        chatHistory: chatHistory,
        message: message
      })
    }

    // Save AI response
    await prisma.chatMessage.create({
      data: {
        userId: user.id,
        role: 'assistant',
        content: aiMessage
      }
    })

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

    const user = await prisma.user.findUnique({
      where: { username }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const messages = await prisma.chatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' }
    })

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