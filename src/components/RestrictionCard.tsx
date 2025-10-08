'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Shield, Heart } from 'lucide-react'

interface Restricao {
  tipo: string
  descricao: string
}

interface RestrictionCardProps {
  restricoes: Restricao[]
}

const getRestrictionIcon = (tipo: string) => {
  const tipoLower = tipo.toLowerCase()
  
  if (tipoLower.includes('alergia')) {
    return AlertTriangle
  } else if (tipoLower.includes('intolerancia')) {
    return Shield
  } else if (tipoLower.includes('preferencia')) {
    return Heart
  }
  
  return AlertTriangle
}

const getRestrictionColor = (tipo: string) => {
  const tipoLower = tipo.toLowerCase()
  
  if (tipoLower.includes('alergia')) return 'bg-red-100 text-red-800 border-red-200'
  if (tipoLower.includes('intolerancia')) return 'bg-orange-100 text-orange-800 border-orange-200'
  if (tipoLower.includes('preferencia')) return 'bg-purple-100 text-purple-800 border-purple-200'
  
  return 'bg-red-100 text-red-800 border-red-200'
}

export default function RestrictionCard({ restricoes }: RestrictionCardProps) {
  if (!restricoes || restricoes.length === 0) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100 text-red-800 border-red-200">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg">Restrições Dietéticas</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {restricoes.map((restricao, index) => {
            const Icon = getRestrictionIcon(restricao.tipo)
            const colorClass = getRestrictionColor(restricao.tipo)
            
            return (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`p-1.5 rounded-md ${colorClass} flex-shrink-0 mt-0.5`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex-1">
                  <Badge 
                    variant="outline" 
                    className={`text-xs mb-2 capitalize ${colorClass.replace('bg-', 'border-').replace('text-', 'text-')}`}
                  >
                    {restricao.tipo}
                  </Badge>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {restricao.descricao}
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