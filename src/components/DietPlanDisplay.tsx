'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Coffee, 
  Sun, 
  Sunset, 
  Moon, 
  Utensils,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

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
            <p>No diet plan uploaded yet</p>
            <p className="text-sm">Upload a PDF or enter manually above</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Parse the content to identify different sections
  const parseContent = (text: string): {
     meals: Array<{ title: string; content: string; icon: React.ComponentType<{ className?: string }> }>;
     substitutions: string[];
     instructions: string[];
     restrictions: string[];
     other: string[];
   } => {
     const sections = {
       meals: [] as Array<{ title: string, content: string, icon: React.ComponentType<{ className?: string }> }>,
      substitutions: [] as string[],
      instructions: [] as string[],
      restrictions: [] as string[],
      other: [] as string[]
    }

    const lines = text.split('\n').filter(line => line.trim() !== '')
    let currentSection = 'other'
    let currentMeal = ''
    let currentContent: string[] = []

    const getMealIcon = (mealName: string) => {
      const name = mealName.toLowerCase()
      if (name.includes('breakfast') || name.includes('café') || name.includes('morning')) return Coffee
      if (name.includes('lunch') || name.includes('almoço') || name.includes('noon')) return Sun
      if (name.includes('dinner') || name.includes('jantar') || name.includes('evening')) return Moon
      if (name.includes('snack') || name.includes('lanche') || name.includes('afternoon')) return Sunset
      return Utensils
    }

    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Check for section headers
      if (trimmedLine.toLowerCase().includes('**meals**') || 
          trimmedLine.toLowerCase().includes('meals:')) {
        currentSection = 'meals'
        continue
      } else if (trimmedLine.toLowerCase().includes('**substitution') || 
                 trimmedLine.toLowerCase().includes('substitution')) {
        currentSection = 'substitutions'
        continue
      } else if (trimmedLine.toLowerCase().includes('**instruction') || 
                 trimmedLine.toLowerCase().includes('instruction')) {
        currentSection = 'instructions'
        continue
      } else if (trimmedLine.toLowerCase().includes('**restriction') || 
                 trimmedLine.toLowerCase().includes('restriction')) {
        currentSection = 'restrictions'
        continue
      }

      // Check for meal headers
      const mealMatch = trimmedLine.match(/\*\*(breakfast|lunch|dinner|snacks?)\*\*:?/i)
      if (mealMatch || 
          trimmedLine.toLowerCase().startsWith('breakfast') ||
          trimmedLine.toLowerCase().startsWith('lunch') ||
          trimmedLine.toLowerCase().startsWith('dinner') ||
          trimmedLine.toLowerCase().startsWith('snack')) {
        
        // Save previous meal if exists
        if (currentMeal && currentContent.length > 0) {
          const mealKey = currentMeal.toLowerCase() as keyof typeof mealIcons
          sections.meals.push({
            title: currentMeal,
            content: currentContent.join('\n'),
            icon: mealIcons[mealKey] || Utensils
          })
        }
        
        currentMeal = mealMatch ? mealMatch[1] : trimmedLine.split(':')[0]
        currentContent = []
        currentSection = 'meals'
        
        // Add content after the meal header if exists
        const afterColon = trimmedLine.split(':').slice(1).join(':').trim()
        if (afterColon) {
          currentContent.push(afterColon)
        }
        continue
      }

      // Add content to appropriate section
      if (currentSection === 'meals' && currentMeal) {
        if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•') || 
            trimmedLine.match(/^\d+\./) || trimmedLine.length > 0) {
          currentContent.push(trimmedLine)
        }
      } else if (currentSection === 'substitutions') {
        sections.substitutions.push(trimmedLine)
      } else if (currentSection === 'instructions') {
        sections.instructions.push(trimmedLine)
      } else if (currentSection === 'restrictions') {
        sections.restrictions.push(trimmedLine)
      } else {
        sections.other.push(trimmedLine)
      }
    }

    // Save last meal if exists
    if (currentMeal && currentContent.length > 0) {
      const mealKey = currentMeal.toLowerCase() as keyof typeof mealIcons
      sections.meals.push({
        title: currentMeal,
        content: currentContent.join('\n'),
        icon: mealIcons[mealKey] || Utensils
      })
    }

    return sections
  }

  const sections = parseContent(dietPlan)

  return (
    <div className="space-y-6">
      {/* Meals Section */}
      {sections.meals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-700 flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Daily Meals
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {sections.meals.map((meal, index) => {
              const IconComponent = meal.icon
              return (
                <Card key={index} className="border-l-4 border-l-green-500 bg-gray-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2 capitalize">
                      <IconComponent className="w-4 h-4 text-amber-600" />
                      <span className="capitalize">{meal.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-2">
                      {meal.content.split('\n').map((line, lineIndex) => (
                        <div key={lineIndex} className="flex items-start gap-2">
                          {line.trim().startsWith('-') || line.trim().startsWith('•') ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                              <span className="text-gray-700">{line.replace(/^[-•]\s*/, '')}</span>
                            </>
                          ) : (
                            <span className="ml-4 text-gray-700">{line}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Substitutions Section */}
      {sections.substitutions.length > 0 && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-blue-700">
              <RefreshCw className="h-4 w-4 text-blue-600" />
              Food Substitutions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sections.substitutions.map((sub, index) => (
                <div key={index} className="text-sm text-gray-700 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400 shadow-sm">
                  <div className="flex items-start gap-2">
                    <RefreshCw className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>{sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions Section */}
      {sections.instructions.length > 0 && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-orange-700">
              <Clock className="h-4 w-4" />
              Instructions & Timing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sections.instructions.map((instruction, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-orange-600 mt-1">•</span>
                  <span>{instruction}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Restrictions Section */}
      {sections.restrictions.length > 0 && (
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Dietary Restrictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {sections.restrictions.map((restriction, index) => (
                <Badge key={index} variant="destructive" className="text-xs px-3 py-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {restriction}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Content */}
      {sections.other.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              {sections.other.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}