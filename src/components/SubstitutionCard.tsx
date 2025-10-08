'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { RefreshCw, Info } from 'lucide-react'

interface Substituicao {
  alimento_original: string
  substitutos: string[]
  descricao?: string
}

interface SubstitutionCardProps {
  substituicoes: Substituicao[]
}

export default function SubstitutionCard({ substituicoes }: SubstitutionCardProps) {
  if (!substituicoes || substituicoes.length === 0) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-800 border-blue-200">
            <RefreshCw className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg">Substituições</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {substituicoes.map((substituicao, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-2 mb-3">
                <div className="font-medium text-gray-900 flex-1">
                  {substituicao.alimento_original}
                </div>
                {substituicao.descricao && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-blue-500 cursor-help flex-shrink-0 mt-0.5" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">{substituicao.descricao}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              
              <div className="text-sm text-gray-600 mb-2">Pode ser substituído por:</div>
              
              <div className="flex flex-wrap gap-2">
                {substituicao.substitutos.map((substituto, subIndex) => (
                  <Badge 
                    key={subIndex} 
                    variant="secondary" 
                    className="text-xs bg-green-100 text-green-800 hover:bg-green-200"
                  >
                    {substituto}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}