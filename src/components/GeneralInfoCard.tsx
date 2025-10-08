'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Target, Pill } from 'lucide-react'

interface InformacoesGerais {
  calorias_diarias?: string
  macronutrientes?: string
  suplementacao?: string
}

interface GeneralInfoCardProps {
  informacoes: InformacoesGerais
}

export default function GeneralInfoCard({ informacoes }: GeneralInfoCardProps) {
  const hasInfo = informacoes.calorias_diarias || informacoes.macronutrientes || informacoes.suplementacao
  
  if (!hasInfo) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-800 border-indigo-200">
            <Activity className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg">Informações Gerais</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {informacoes.calorias_diarias && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-1.5 rounded-md bg-green-100 text-green-800 border-green-200 flex-shrink-0 mt-0.5">
                <Target className="h-3 w-3" />
              </div>
              <div className="flex-1">
                <Badge variant="outline" className="text-xs mb-2">
                  Calorias Diárias
                </Badge>
                <p className="text-sm text-gray-700 font-medium">
                  {informacoes.calorias_diarias}
                </p>
              </div>
            </div>
          )}

          {informacoes.macronutrientes && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-1.5 rounded-md bg-blue-100 text-blue-800 border-blue-200 flex-shrink-0 mt-0.5">
                <Activity className="h-3 w-3" />
              </div>
              <div className="flex-1">
                <Badge variant="outline" className="text-xs mb-2">
                  Macronutrientes
                </Badge>
                <p className="text-sm text-gray-700">
                  {informacoes.macronutrientes}
                </p>
              </div>
            </div>
          )}

          {informacoes.suplementacao && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-1.5 rounded-md bg-purple-100 text-purple-800 border-purple-200 flex-shrink-0 mt-0.5">
                <Pill className="h-3 w-3" />
              </div>
              <div className="flex-1">
                <Badge variant="outline" className="text-xs mb-2">
                  Suplementação
                </Badge>
                <p className="text-sm text-gray-700">
                  {informacoes.suplementacao}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}