import { nutritionAPI } from './nutritionAPI';

interface Food {
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  category: string;
}

interface FoodSwapSuggestion {
  food: string;
  quantity: number;
  calories: number;
  category: string;
}

class FoodSwapCalculator {
  private foods: Food[] = [];
  private lastSearchQuery: string = '';

  constructor() {
    // Foods will be loaded dynamically from API
  }

  /**
   * Find a food by name using API search
   */
  async findFood(name: string): Promise<Food | null> {
    try {
      const searchResults = await nutritionAPI.searchFoods(name);
      if (searchResults.length > 0) {
        // Return the best match (first result)
        return searchResults[0] as Food;
      }
      return null;
    } catch (error) {
      console.error('Error finding food:', error);
      return null;
    }
  }

  /**
   * Get foods by category
   */
  getFoodsByCategory(category: string): Food[] {
    return this.foods.filter(food => 
      food.category.toLowerCase() === category.toLowerCase()
    )
  }

  /**
   * Calculate equivalent quantity for same calories
   */
  calculateEquivalentQuantity(targetCalories: number, caloriesPer100g: number): number {
    return (targetCalories * 100) / caloriesPer100g;
  }

  /**
   * Suggest food swaps based on calorie equivalence
   */
  async suggestSwaps(originalFood: string, quantity: number): Promise<FoodSwapSuggestion[]> {
    try {
      const food = await this.findFood(originalFood);
      if (!food) {
        return [];
      }

      const targetCalories = this.calculateCalories(food, quantity);
      
      // Search for alternative foods from different categories
      const searchQueries = [
        'rice bread pasta potato', // Carbs
        'chicken beef fish egg bean', // Proteins  
        'broccoli spinach carrot tomato', // Vegetables
        'apple banana orange mango', // Fruits
        'avocado nuts oil seeds' // Fats
      ];

      const allAlternatives: Food[] = [];
      
      // Get alternatives from API
      for (const query of searchQueries) {
        try {
          const results = await nutritionAPI.searchFoods(query);
          allAlternatives.push(...results.filter(f => f.name !== food.name));
        } catch (error) {
          console.error(`Error searching for ${query}:`, error);
        }
      }

      const suggestions: FoodSwapSuggestion[] = [];

      // Calculate equivalent quantities
      for (const alternativeFood of allAlternatives) {
        const equivalentQuantity = this.calculateEquivalentQuantity(
          targetCalories,
          alternativeFood.calories_per_100g
        );

        if (equivalentQuantity > 0 && equivalentQuantity <= 500) { // Reasonable portion sizes
          suggestions.push({
            food: alternativeFood.name,
            quantity: Math.round(equivalentQuantity),
            calories: Math.round(targetCalories),
            category: alternativeFood.category
          });
        }
      }

      // Sort by calorie accuracy and return top 3
      return suggestions
        .sort((a, b) => Math.abs(a.calories - targetCalories) - Math.abs(b.calories - targetCalories))
        .slice(0, 3);
        
    } catch (error) {
      console.error('Error suggesting swaps:', error);
      return [];
    }
  }

  /**
   * Calculate calories for a food and quantity
   */
  calculateCalories(food: Food, quantity: number): number {
    return (food.calories_per_100g * quantity) / 100;
  }

  /**
   * Get all available food categories
   */
  getCategories(): string[] {
    return [...new Set(this.foods.map(food => food.category))]
  }

  /**
   * Get detailed nutrition information for a food
   */
  async getNutritionInfo(foodName: string): Promise<Food | null> {
    return await this.findFood(foodName);
  }
}

export const foodSwapCalculator = new FoodSwapCalculator()