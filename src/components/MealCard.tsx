'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { 
  Coffee, 
  Sun, 
  Sunset, 
  Moon, 
  Utensils,
  ChevronDown,
  ChevronUp,
  Clock
} from 'lucide-react'

interface Alimento {
  item: string
  quantidade: string
  observacoes?: string
}

interface OpcaoRefeicao {
  numero: number
  alimentos: Alimento[]
}

interface Refeicao {
  nome: string
  horario?: string
  opcoes: OpcaoRefeicao[]
}

interface MealCardProps {
  refeicao: Refeicao
}

const getMealIcon = (mealName: string) => {
  const name = mealName.toLowerCase()
  
  if (name.includes('café da manhã') || name.includes('breakfast')) {
    return Coffee
  } else if (name.includes('lanche da manhã') || name.includes('morning snack')) {
    return Sun
  } else if (name.includes('almoço') || name.includes('lunch')) {
    return Utensils
  } else if (name.includes('lanche da tarde') || name.includes('afternoon snack') || 
             name.includes('lanche') || name.includes('merenda')) {
    return Sunset
  } else if (name.includes('jantar') || name.includes('dinner')) {
    return Moon
  } else if (name.includes('ceia') || name.includes('colação')) {
    return Moon
  }
  
  return Utensils
}

const getMealColor = (mealName: string) => {
  const name = mealName.toLowerCase()
  
  if (name.includes('café da manhã')) return 'bg-orange-100 text-orange-800 border-orange-200'
  if (name.includes('lanche da manhã')) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  if (name.includes('almoço')) return 'bg-green-100 text-green-800 border-green-200'
  if (name.includes('lanche da tarde') || name.includes('lanche') || name.includes('merenda')) {
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }
  if (name.includes('jantar')) return 'bg-purple-100 text-purple-800 border-purple-200'
  if (name.includes('ceia') || name.includes('colação')) return 'bg-indigo-100 text-indigo-800 border-indigo-200'
  
  return 'bg-gray-100 text-gray-800 border-gray-200'
}

export default function MealCard({ refeicao }: MealCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOption, setSelectedOption] = useState(0)
  
  const Icon = getMealIcon(refeicao.nome)
  const colorClass = getMealColor(refeicao.nome)
  
  return (
    <Card className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{refeicao.nome}</CardTitle>
                  {refeicao.horario && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <Clock className="h-3 w-3" />
                      {refeicao.horario}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {refeicao.opcoes.length > 1 && (
                  <Badge variant="secondary" className="text-xs">
                    {refeicao.opcoes.length} opções
                  </Badge>
                )}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            {refeicao.opcoes.length > 1 && (
              <div className="flex gap-2 mb-4">
                {refeicao.opcoes.map((opcao, index) => (
                  <Button
                    key={index}
                    variant={selectedOption === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedOption(index)}
                    className="text-xs"
                  >
                    Opção {opcao.numero}
                  </Button>
                ))}
              </div>
            )}
            
            <div className="space-y-3">
              {refeicao.opcoes[selectedOption]?.alimentos.map((alimento, index) => (
                <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{alimento.item}</div>
                    <div className="text-sm text-gray-600 mt-1">{alimento.quantidade}</div>
                    {alimento.observacoes && (
                      <div className="text-xs text-blue-600 mt-1 italic">
                        {alimento.observacoes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}