// USDA FoodData Central API Service
// Free government nutrition database with 300k+ foods

interface USDAFood {
  fdcId: number;
  description: string;
  foodNutrients: Array<{
    nutrientId: number;
    nutrientName: string;
    nutrientNumber: string;
    unitName: string;
    value: number;
  }>;
  dataType: string;
  brandOwner?: string;
}

interface USDASearchResponse {
  foods: USDAFood[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}

interface NutritionData {
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  category: string;
}

class NutritionAPI {
  private readonly baseURL = 'https://api.nal.usda.gov/fdc/v1';
  private readonly apiKey = 'DEMO_KEY'; // Free demo key, can be upgraded
  private cache = new Map<string, NutritionData[]>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Search for foods by name using USDA API
   */
  async searchFoods(query: string): Promise<NutritionData[]> {
    const cacheKey = query.toLowerCase().trim();
    
    // Check cache first
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const searchURL = `${this.baseURL}/foods/search`;
      const params = new URLSearchParams({
        api_key: this.apiKey,
        query: query,
        pageSize: '10',
        dataType: 'Foundation,SR Legacy', // Most reliable data types
        sortBy: 'dataType.keyword',
        sortOrder: 'asc'
      });

      const response = await fetch(`${searchURL}?${params}`);
      
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`);
      }

      const data: USDASearchResponse = await response.json();
      const nutritionData = this.parseUSDAResponse(data.foods);
      
      // Cache the results
      this.cache.set(cacheKey, nutritionData);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);
      
      return nutritionData;
    } catch (error) {
      console.error('Error fetching from USDA API:', error);
      return this.getFallbackData(query);
    }
  }

  /**
   * Get detailed nutrition info for a specific food
   */
  async getFoodDetails(fdcId: number): Promise<NutritionData | null> {
    try {
      const detailURL = `${this.baseURL}/food/${fdcId}`;
      const params = new URLSearchParams({
        api_key: this.apiKey
      });

      const response = await fetch(`${detailURL}?${params}`);
      
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`);
      }

      const food: USDAFood = await response.json();
      return this.parseUSDAFood(food);
    } catch (error) {
      console.error('Error fetching food details:', error);
      return null;
    }
  }

  /**
   * Parse USDA API response into our nutrition format
   */
  private parseUSDAResponse(foods: USDAFood[]): NutritionData[] {
    return foods.map(food => this.parseUSDAFood(food)).filter(Boolean) as NutritionData[];
  }

  /**
   * Parse individual USDA food item
   */
  private parseUSDAFood(food: USDAFood): NutritionData | null {
    try {
      const nutrients = food.foodNutrients;
      
      // Extract key nutrients (per 100g)
      const calories = this.findNutrient(nutrients, ['208']) || 0; // Energy
      const protein = this.findNutrient(nutrients, ['203']) || 0; // Protein
      const carbs = this.findNutrient(nutrients, ['205']) || 0; // Carbohydrates
      const fat = this.findNutrient(nutrients, ['204']) || 0; // Total fat
      const fiber = this.findNutrient(nutrients, ['291']) || 0; // Fiber

      return {
        name: this.cleanFoodName(food.description),
        calories_per_100g: calories,
        protein_per_100g: protein,
        carbs_per_100g: carbs,
        fat_per_100g: fat,
        fiber_per_100g: fiber,
        category: this.categorizeFood(food.description)
      };
    } catch (error) {
      console.error('Error parsing USDA food:', error);
      return null;
    }
  }

  /**
   * Find nutrient value by nutrient number
   */
  private findNutrient(nutrients: USDAFood['foodNutrients'], nutrientNumbers: string[]): number {
    for (const nutrientNumber of nutrientNumbers) {
      const nutrient = nutrients.find(n => n.nutrientNumber === nutrientNumber);
      if (nutrient && nutrient.value) {
        return nutrient.value;
      }
    }
    return 0;
  }

  /**
   * Clean and normalize food names
   */
  private cleanFoodName(description: string): string {
    return description
      .toLowerCase()
      .replace(/,.*$/, '') // Remove everything after first comma
      .replace(/\b(raw|cooked|boiled|grilled|baked)\b/g, '') // Remove cooking methods
      .trim()
      .replace(/\s+/g, ' '); // Normalize spaces
  }

  /**
   * Categorize food based on description
   */
  private categorizeFood(description: string): string {
    const desc = description.toLowerCase();
    
    if (desc.includes('rice') || desc.includes('bread') || desc.includes('pasta') || 
        desc.includes('potato') || desc.includes('oat')) {
      return 'Carboidratos';
    }
    
    if (desc.includes('chicken') || desc.includes('beef') || desc.includes('fish') || 
        desc.includes('egg') || desc.includes('bean')) {
      return 'Proteínas';
    }
    
    if (desc.includes('broccoli') || desc.includes('spinach') || desc.includes('lettuce') || 
        desc.includes('tomato') || desc.includes('carrot')) {
      return 'Vegetais';
    }
    
    if (desc.includes('apple') || desc.includes('banana') || desc.includes('orange') || 
        desc.includes('mango') || desc.includes('berry')) {
      return 'Frutas';
    }
    
    if (desc.includes('oil') || desc.includes('avocado') || desc.includes('nut') || 
        desc.includes('seed')) {
      return 'Gorduras';
    }
    
    return 'Outros';
  }

  /**
   * Check if cached data is still valid
   */
  private isValidCache(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  /**
   * Fallback data when API fails (basic Brazilian foods)
   */
  private getFallbackData(query: string): NutritionData[] {
    const fallbackFoods: NutritionData[] = [
      {
        name: "arroz branco",
        calories_per_100g: 130,
        protein_per_100g: 2.7,
        carbs_per_100g: 28,
        fat_per_100g: 0.3,
        fiber_per_100g: 0.4,
        category: "Carboidratos"
      },
      {
        name: "feijão carioca",
        calories_per_100g: 76,
        protein_per_100g: 4.8,
        carbs_per_100g: 13.6,
        fat_per_100g: 0.5,
        fiber_per_100g: 8.5,
        category: "Proteínas"
      },
      {
        name: "frango grelhado",
        calories_per_100g: 165,
        protein_per_100g: 31,
        carbs_per_100g: 0,
        fat_per_100g: 3.6,
        fiber_per_100g: 0,
        category: "Proteínas"
      }
    ];

    const queryLower = query.toLowerCase();
    return fallbackFoods.filter(food => 
      food.name.includes(queryLower) || queryLower.includes(food.name)
    );
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

// Export singleton instance
export const nutritionAPI = new NutritionAPI();
export type { NutritionData };