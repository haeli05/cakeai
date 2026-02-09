import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Alert, Image } from 'react-native';
import { useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { dark, brand } from '@/constants/Colors';
import { getMeals, deleteMeal, type MealEntry } from '@/lib/storage';

type Section = {
  title: string;
  totalCalories: number;
  data: MealEntry[];
};

export default function HistoryScreen() {
  const [sections, setSections] = useState<Section[]>([]);

  const loadMeals = useCallback(async () => {
    const meals = await getMeals();
    const grouped: Record<string, MealEntry[]> = {};

    meals.forEach(meal => {
      (grouped[meal.date] ||= []).push(meal);
    });

    setSections(
      Object.entries(grouped).map(([date, dateMeals]) => ({
        title: formatDate(date),
        totalCalories: dateMeals.reduce((sum, m) => sum + m.totalCalories, 0),
        data: dateMeals,
      }))
    );
  }, []);

  useFocusEffect(useCallback(() => { loadMeals(); }, [loadMeals]));

  const handleDelete = (meal: MealEntry) => {
    Alert.alert('Delete Meal', 'Are you sure you want to remove this meal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMeal(meal.id);
          loadMeals();
        },
      },
    ]);
  };

  if (!sections.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>Your meal log</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyText}>No meals logged yet</Text>
          <Text style={styles.emptySubtext}>Start scanning to build your history</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Your meal log</Text>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionDate}>{section.title}</Text>
            <Text style={styles.sectionCals}>{section.totalCalories} kcal</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.mealCard}
            onLongPress={() => handleDelete(item)}
            activeOpacity={0.7}
          >
            {item.imageUri ? (
              <Image source={{ uri: item.imageUri }} style={styles.mealImage} />
            ) : (
              <View style={[styles.mealImage, styles.mealImagePlaceholder]}>
                <FontAwesome name="cutlery" size={16} color={dark.textMuted} />
              </View>
            )}
            <View style={styles.mealInfo}>
              <Text style={styles.mealFoods} numberOfLines={1}>
                {item.foods.map((f) => f.name).join(', ')}
              </Text>
              <Text style={styles.mealMacros}>
                P: {item.totalProtein}g  C: {item.totalCarbs}g  F: {item.totalFat}g
              </Text>
            </View>
            <View style={styles.mealRight}>
              <Text style={styles.mealCalories}>{item.totalCalories}</Text>
              <Text style={styles.mealCalUnit}>kcal</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function formatDate(dateStr: string) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dark.bg,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: dark.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: dark.textSecondary,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: dark.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    color: dark.textMuted,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingTop: 20,
  },
  sectionDate: {
    fontSize: 16,
    fontWeight: '700',
    color: dark.text,
  },
  sectionCals: {
    fontSize: 14,
    fontWeight: '600',
    color: brand.primary,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: dark.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: dark.cardBorder,
  },
  mealImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 12,
  },
  mealImagePlaceholder: {
    backgroundColor: dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealInfo: {
    flex: 1,
  },
  mealFoods: {
    fontSize: 15,
    fontWeight: '600',
    color: dark.text,
  },
  mealMacros: {
    fontSize: 12,
    color: dark.textSecondary,
    marginTop: 3,
  },
  mealRight: {
    alignItems: 'flex-end',
  },
  mealCalories: {
    fontSize: 18,
    fontWeight: '700',
    color: brand.primary,
  },
  mealCalUnit: {
    fontSize: 11,
    color: dark.textMuted,
  },
});
