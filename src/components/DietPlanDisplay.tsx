'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import GeneralInfoCard from './GeneralInfoCard'
import MealCard from './MealCard'
import RestrictionCard from './RestrictionCard'
import SubstitutionCard from './SubstitutionCard'
import InstructionCard from './InstructionCard'

interface DietPlanDisplayProps {
  dietPlan: string
}

interface StructuredDietData {
  informacoes_gerais?: {
    calorias_diarias?: string
    macronutrientes?: string
    suplementacao?: string
  }
  refeicoes?: Array<{
    nome: string
    horario?: string
    opcoes: Array<{
      numero: number
      alimentos: Array<{
        item: string
        quantidade: string
        observacoes?: string
      }>
    }>
  }>
  restricoes?: Array<{
    tipo: string
    descricao: string
  }>
  substituicoes?: Array<{
    alimento_original: string
    substitutos: string[]
  }>
  instrucoes_gerais?: Array<{
    categoria: string
    instrucoes: string[]
  }>
  erro?: string
}

export default function DietPlanDisplay({ dietPlan }: DietPlanDisplayProps) {
  console.log('=== DietPlanDisplay Debug ===')
  console.log('dietPlan received:', dietPlan)
  console.log('dietPlan type:', typeof dietPlan)
  console.log('dietPlan length:', dietPlan?.length)
  console.log('dietPlan first 100 chars:', dietPlan?.substring(0, 100))

  // Handle empty or null diet plan
  if (!dietPlan || dietPlan.trim().length === 0) {
    console.log('No diet plan provided, showing empty state')
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <p className="text-gray-500">No diet plan available</p>
        </CardContent>
      </Card>
    )
  }

  let structuredData: StructuredDietData

  try {
    console.log('Attempting to parse as JSON...')
    // Clean and parse the JSON data
    const cleanedData = dietPlan.trim()
    structuredData = JSON.parse(cleanedData)
    console.log('JSON parsing successful!')
    console.log('Parsed data:', structuredData)
    console.log('Parsed data type:', typeof structuredData)
    
    // Validate that we have the expected structure
    if (!structuredData || typeof structuredData !== 'object') {
      throw new Error('Invalid data structure')
    }
    
  } catch (error) {
    console.log('JSON parsing failed:', error)
    console.log('Falling back to raw text display')
    // If JSON parsing fails, display as raw text
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Diet Plan</CardTitle>
          <CardDescription>Raw content (JSON parsing failed)</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
            {dietPlan}
          </pre>
        </CardContent>
      </Card>
    )
  }

  // Check for error in the data
  if (structuredData.erro) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <p className="text-red-500">Error: {structuredData.erro}</p>
        </CardContent>
      </Card>
    )
  }

  console.log('Data has expected structure, rendering structured components')
  console.log('Has informacoes_gerais:', !!structuredData.informacoes_gerais)
  console.log('Has refeicoes:', !!structuredData.refeicoes)
  console.log('Refeicoes is array:', Array.isArray(structuredData.refeicoes))

  // Render structured diet plan with beautiful components
  return (
    <div className="w-full overflow-hidden space-y-6">
      {/* General Information */}
      {structuredData.informacoes_gerais && (
        <GeneralInfoCard informacoes={structuredData.informacoes_gerais} />
      )}

      {/* Meals Section */}
      {structuredData.refeicoes && structuredData.refeicoes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Refeições Diárias</h2>
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {structuredData.refeicoes.map((refeicao, index) => (
              <MealCard key={index} refeicao={refeicao} />
            ))}
          </div>
        </div>
      )}

      {/* Substitutions Section */}
      {structuredData.substituicoes && structuredData.substituicoes.length > 0 && (
        <SubstitutionCard substituicoes={structuredData.substituicoes} />
      )}

      {/* Instructions Section */}
      {structuredData.instrucoes_gerais && structuredData.instrucoes_gerais.length > 0 && (
        <InstructionCard instrucoes={
          structuredData.instrucoes_gerais.flatMap(item => 
            item.instrucoes.map(instrucao => ({
              tipo: item.categoria,
              descricao: instrucao
            }))
          )
        } />
      )}

      {/* Restrictions Section */}
      {structuredData.restricoes && structuredData.restricoes.length > 0 && (
        <RestrictionCard restricoes={structuredData.restricoes} />
      )}
    </div>
  )
}