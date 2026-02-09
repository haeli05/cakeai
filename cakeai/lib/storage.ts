import AsyncStorage from '@react-native-async-storage/async-storage';

export type MealEntry = {
  id: string;
  imageUri: string;
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  timestamp: number;
  date: string; // YYYY-MM-DD
};

export type FoodItem = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
};

export type DailyGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const MEALS_KEY = 'cakeai_meals';
const GOALS_KEY = 'cakeai_goals';
const API_KEY_KEY = 'cakeai_api_key';

const DEFAULT_GOALS: DailyGoals = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 65,
};

export async function getMeals(): Promise<MealEntry[]> {
  const raw = await AsyncStorage.getItem(MEALS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveMeal(meal: MealEntry): Promise<void> {
  const meals = await getMeals();
  await AsyncStorage.setItem(MEALS_KEY, JSON.stringify([meal, ...meals]));
}

export async function deleteMeal(id: string): Promise<void> {
  const meals = await getMeals();
  await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(meals.filter(m => m.id !== id)));
}

export async function getTodayMeals(): Promise<MealEntry[]> {
  const today = new Date().toISOString().split('T')[0];
  return (await getMeals()).filter(m => m.date === today);
}

export async function getGoals(): Promise<DailyGoals> {
  const raw = await AsyncStorage.getItem(GOALS_KEY);
  return raw ? JSON.parse(raw) : DEFAULT_GOALS;
}

export async function saveGoals(goals: DailyGoals): Promise<void> {
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

export async function getApiKey(): Promise<string | null> {
  return AsyncStorage.getItem(API_KEY_KEY);
}

export async function saveApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(API_KEY_KEY, key);
}
