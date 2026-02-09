import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { dark, brand } from '@/constants/Colors';
import type { MealEntry } from '@/lib/storage';

const MACRO_COLORS = {
  protein: '#FF6B6B',
  carbs: '#4ECDC4',
  fat: '#FFE66D',
} as const;

export default function AnalysisScreen() {
  const router = useRouter();
  const { mealData } = useLocalSearchParams<{ mealData: string }>();

  let meal: MealEntry | null = null;
  try {
    if (mealData) meal = JSON.parse(mealData);
  } catch {}

  if (!meal) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Could not load meal data</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <FontAwesome name="times" size={20} color={dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analysis</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {meal.imageUri && (
          <Image source={{ uri: meal.imageUri }} style={styles.foodImage} />
        )}

        <LinearGradient
          colors={[brand.gradient1, brand.gradient2]}
          style={styles.totalCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.totalLabel}>Total Calories</Text>
          <Text style={styles.totalValue}>{meal.totalCalories}</Text>
          <Text style={styles.totalUnit}>kcal</Text>
        </LinearGradient>

        <View style={styles.macroRow}>
          {[
            { value: meal.totalProtein, label: 'Protein', color: MACRO_COLORS.protein },
            { value: meal.totalCarbs, label: 'Carbs', color: MACRO_COLORS.carbs },
            { value: meal.totalFat, label: 'Fat', color: MACRO_COLORS.fat },
          ].map(({ value, label, color }) => (
            <View key={label} style={[styles.macroPill, { borderColor: color }]}>
              <Text style={[styles.macroPillValue, { color }]}>{value}g</Text>
              <Text style={styles.macroPillLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.itemsTitle}>Detected Items</Text>
        {meal.foods.map((food, index) => (
          <View key={index} style={styles.foodCard}>
            <View style={styles.foodHeader}>
              <Text style={styles.foodName}>{food.name}</Text>
              <Text style={styles.foodCals}>{food.calories} kcal</Text>
            </View>
            <Text style={styles.foodPortion}>{food.portion}</Text>
            <View style={styles.foodMacros}>
              {[
                { label: 'P', value: food.protein, color: MACRO_COLORS.protein },
                { label: 'C', value: food.carbs, color: MACRO_COLORS.carbs },
                { label: 'F', value: food.fat, color: MACRO_COLORS.fat },
              ].map(({ label, value, color }) => (
                <Text key={label} style={[styles.foodMacro, { color }]}>
                  {label}: {value}g
                </Text>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.8}
        >
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dark.bg,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: dark.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  foodImage: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    marginBottom: 16,
  },
  totalCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 56,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -2,
    marginVertical: 4,
  },
  totalUnit: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  macroRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  macroPill: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: dark.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  macroPillValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  macroPillLabel: {
    fontSize: 12,
    color: dark.textSecondary,
    marginTop: 4,
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: dark.text,
    marginBottom: 12,
  },
  foodCard: {
    backgroundColor: dark.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: dark.cardBorder,
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodName: {
    fontSize: 16,
    fontWeight: '700',
    color: dark.text,
    flex: 1,
  },
  foodCals: {
    fontSize: 16,
    fontWeight: '700',
    color: brand.primary,
  },
  foodPortion: {
    fontSize: 13,
    color: dark.textSecondary,
    marginTop: 4,
  },
  foodMacros: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  foodMacro: {
    fontSize: 13,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: dark.surface,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: dark.cardBorder,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '700',
    color: dark.text,
  },
  errorText: {
    fontSize: 16,
    color: dark.textSecondary,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: dark.surface,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: dark.text,
  },
});
