import { File } from 'expo-file-system';
import { getApiKey } from './storage';
import type { FoodItem } from './storage';

export type AnalysisResult = {
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
};

export async function analyzeFood(imageUri: string): Promise<AnalysisResult> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('API key not set. Go to Profile > Settings to add your Anthropic API key.');
  }

  const base64 = await new File(imageUri).base64();
  const mediaType = imageUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: `Analyze this food image. Identify each food item and estimate the nutritional information.

Respond ONLY with valid JSON in this exact format, no other text:
{
  "foods": [
    {
      "name": "Food name",
      "calories": 250,
      "protein": 15,
      "carbs": 30,
      "fat": 8,
      "portion": "1 cup / 200g"
    }
  ]
}

Be specific with portion sizes. Estimate as accurately as possible based on visual size. If you can't identify food, return an empty foods array.`,
          },
        ],
      }],
    }),
  });

  if (!response.ok) {
    throw new Error(`API error (${response.status}): ${await response.text()}`);
  }

  const { content } = await response.json();
  const jsonMatch = content[0].text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse AI response');

  const foods: FoodItem[] = JSON.parse(jsonMatch[0]).foods || [];
  const sumNutrient = (key: keyof FoodItem) =>
    foods.reduce((sum, f) => sum + (f[key] as number), 0);

  return {
    foods,
    totalCalories: sumNutrient('calories'),
    totalProtein: sumNutrient('protein'),
    totalCarbs: sumNutrient('carbs'),
    totalFat: sumNutrient('fat'),
  };
}
