'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Utensils } from 'lucide-react'
import MealCard from './MealCard'
import SubstitutionCard from './SubstitutionCard'
import InstructionCard from './InstructionCard'
import RestrictionCard from './RestrictionCard'
import GeneralInfoCard from './GeneralInfoCard'

interface DietPlanDisplayProps {
  dietPlan: string
}

export default function DietPlanDisplay({ dietPlan }: DietPlanDisplayProps) {
  if (!dietPlan || dietPlan.trim() === '') {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-48 text-gray-500">
          <div className="text-center">
            <Utensils className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum plano alimentar carregado ainda</p>
            <p className="text-sm">Faça upload de um PDF ou digite manualmente acima</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Try to parse as structured JSON data first
  let structuredData
  try {
    structuredData = JSON.parse(dietPlan)
  } catch (error) {
    // Fallback to legacy text parsing if JSON parsing fails
    return renderLegacyTextFormat(dietPlan)
  }

  // Check if it's an error response
  if (structuredData.erro) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-48 text-gray-500">
          <div className="text-center">
            <Utensils className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>{structuredData.erro}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

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
            {structuredData.refeicoes.map((refeicao: any, index: number) => (
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
      {structuredData.instrucoes && structuredData.instrucoes.length > 0 && (
        <InstructionCard instrucoes={structuredData.instrucoes} />
      )}

      {/* Restrictions Section */}
      {structuredData.restricoes && structuredData.restricoes.length > 0 && (
        <RestrictionCard restricoes={structuredData.restricoes} />
      )}
    </div>
  )
}

// Fallback function for legacy text format
function renderLegacyTextFormat(dietPlan: string) {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="whitespace-pre-wrap text-sm text-gray-700">
          {dietPlan}
        </div>
      </CardContent>
    </Card>
  )
}