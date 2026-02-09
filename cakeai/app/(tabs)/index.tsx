import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/context/AuthContext';
import { dark, brand } from '@/constants/Colors';
import { getTodayMeals, getGoals, type MealEntry, type DailyGoals } from '@/lib/storage';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [goals, setGoals] = useState<DailyGoals>({ calories: 2000, protein: 150, carbs: 250, fat: 65 });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [todayMeals, userGoals] = await Promise.all([getTodayMeals(), getGoals()]);
    setMeals(todayMeals);
    setGoals(userGoals);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.totalCalories,
      protein: acc.protein + m.totalProtein,
      carbs: acc.carbs + m.totalCarbs,
      fat: acc.fat + m.totalFat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey {firstName} 👋</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>
      </View>

      {/* Calorie Ring Card */}
      <LinearGradient colors={[dark.surface, dark.card]} style={styles.calorieCard}>
        <View style={styles.calorieRingContainer}>
          <View style={styles.calorieRing}>
            <View style={styles.ringInner}>
              <Text style={styles.calorieCount}>{totals.calories}</Text>
              <Text style={styles.calorieLabel}>of {goals.calories} kcal</Text>
            </View>
          </View>
          <View style={styles.remainingBadge}>
            <Text style={styles.remainingText}>
              {Math.max(goals.calories - totals.calories, 0)} remaining
            </Text>
          </View>
        </View>

        <View style={styles.macroRow}>
          <MacroChip label="Protein" value={totals.protein} goal={goals.protein} color="#FF6B6B" unit="g" />
          <MacroChip label="Carbs" value={totals.carbs} goal={goals.carbs} color="#4ECDC4" unit="g" />
          <MacroChip label="Fat" value={totals.fat} goal={goals.fat} color="#FFE66D" unit="g" />
        </View>
      </LinearGradient>

      {/* Quick Scan Button */}
      <TouchableOpacity style={styles.scanButton} onPress={() => router.push('/(tabs)/camera')}>
        <LinearGradient colors={[brand.gradient1, brand.gradient2]} style={styles.scanGradient}>
          <FontAwesome name="camera" size={20} color="#fff" />
          <Text style={styles.scanText}>Scan Your Meal</Text>
          <FontAwesome name="arrow-right" size={16} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Today's Meals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Meals</Text>
        {meals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyText}>No meals logged yet today</Text>
            <Text style={styles.emptySubtext}>Scan your first meal to get started!</Text>
          </View>
        ) : (
          meals.map((meal) => (
            <View key={meal.id} style={styles.mealCard}>
              <View style={styles.mealInfo}>
                <Text style={styles.mealFoods} numberOfLines={1}>
                  {meal.foods.map((f) => f.name).join(', ')}
                </Text>
                <Text style={styles.mealTime}>
                  {new Date(meal.timestamp).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Text style={styles.mealCalories}>{meal.totalCalories} kcal</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function MacroChip({ label, value, goal, color, unit }: {
  label: string;
  value: number;
  goal: number;
  color: string;
  unit: string;
}) {
  const percent = Math.min((value / goal) * 100, 100);
  return (
    <View style={styles.macroChip}>
      <View style={styles.macroBarBg}>
        <View style={[styles.macroBarFill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.macroValue}>{Math.round(value)}{unit}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dark.bg,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: dark.text,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 15,
    color: dark.textSecondary,
    marginTop: 4,
  },
  calorieCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: dark.cardBorder,
    marginBottom: 16,
  },
  calorieRingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  calorieRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    borderColor: dark.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    alignItems: 'center',
  },
  calorieCount: {
    fontSize: 40,
    fontWeight: '800',
    color: dark.text,
    letterSpacing: -1,
  },
  calorieLabel: {
    fontSize: 14,
    color: dark.textSecondary,
    marginTop: 2,
  },
  remainingBadge: {
    marginTop: 12,
    backgroundColor: dark.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  remainingText: {
    fontSize: 13,
    color: dark.textSecondary,
    fontWeight: '600',
  },
  macroRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroChip: {
    flex: 1,
    backgroundColor: dark.surfaceLight,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  macroBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '700',
    color: dark.text,
  },
  macroLabel: {
    fontSize: 11,
    color: dark.textSecondary,
    marginTop: 2,
  },
  scanButton: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  scanGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  scanText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: dark.text,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: dark.cardBorder,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: dark.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    color: dark.textMuted,
    marginTop: 4,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: dark.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: dark.cardBorder,
  },
  mealInfo: {
    flex: 1,
  },
  mealFoods: {
    fontSize: 15,
    fontWeight: '600',
    color: dark.text,
  },
  mealTime: {
    fontSize: 13,
    color: dark.textSecondary,
    marginTop: 2,
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: '700',
    color: brand.primary,
  },
});
