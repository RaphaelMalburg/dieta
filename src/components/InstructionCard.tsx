'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, ChefHat, AlertCircle } from 'lucide-react'

interface Instrucao {
  tipo: string
  descricao: string
}

interface InstructionCardProps {
  instrucoes: Instrucao[]
}

const getInstructionIcon = (tipo: string) => {
  const tipoLower = tipo.toLowerCase()
  
  if (tipoLower.includes('horario') || tipoLower.includes('tempo')) {
    return Clock
  } else if (tipoLower.includes('preparo') || tipoLower.includes('cozinha')) {
    return ChefHat
  }
  
  return AlertCircle
}

const getInstructionColor = (tipo: string) => {
  const tipoLower = tipo.toLowerCase()
  
  if (tipoLower.includes('horario')) return 'bg-blue-100 text-blue-800 border-blue-200'
  if (tipoLower.includes('preparo')) return 'bg-green-100 text-green-800 border-green-200'
  
  return 'bg-yellow-100 text-yellow-800 border-yellow-200'
}

export default function InstructionCard({ instrucoes }: InstructionCardProps) {
  if (!instrucoes || instrucoes.length === 0) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100 text-green-800 border-green-200">
            <ChefHat className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg">Instruções e Horários</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {instrucoes.map((instrucao, index) => {
            const Icon = getInstructionIcon(instrucao.tipo)
            const colorClass = getInstructionColor(instrucao.tipo)
            
            return (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`p-1.5 rounded-md ${colorClass} flex-shrink-0 mt-0.5`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex-1">
                  <Badge variant="outline" className="text-xs mb-2 capitalize">
                    {instrucao.tipo}
                  </Badge>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {instrucao.descricao}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}