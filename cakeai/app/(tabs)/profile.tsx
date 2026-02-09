import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/context/AuthContext';
import { dark, brand } from '@/constants/Colors';
import { getGoals, saveGoals, getApiKey, saveApiKey, getMeals, type DailyGoals } from '@/lib/storage';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [goals, setGoals] = useState<DailyGoals>({ calories: 2000, protein: 150, carbs: 250, fat: 65 });
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [editingGoals, setEditingGoals] = useState(false);
  const [totalMeals, setTotalMeals] = useState(0);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getGoals(), getApiKey(), getMeals()]).then(([userGoals, key, meals]) => {
        setGoals(userGoals);
        setApiKey(key || '');
        setTotalMeals(meals.length);
      });
    }, [])
  );

  const handleSaveGoals = async () => {
    await saveGoals(goals);
    setEditingGoals(false);
    Alert.alert('Saved', 'Daily goals updated!');
  };

  const handleSaveApiKey = async () => {
    await saveApiKey(apiKey);
    Alert.alert('Saved', 'API key updated!');
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const initial = user?.name?.[0]?.toUpperCase() || '?';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* User Card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={styles.statNumber}>{totalMeals}</Text>
          <Text style={styles.statLabel}>meals</Text>
        </View>
      </View>

      {/* API Key Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FontAwesome name="key" size={16} color={brand.primary} />
          <Text style={styles.sectionTitle}>Anthropic API Key</Text>
        </View>
        <Text style={styles.sectionDesc}>Required for AI food analysis</Text>
        <View style={styles.apiKeyRow}>
          <TextInput
            style={styles.apiKeyInput}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="sk-ant-..."
            placeholderTextColor={dark.textMuted}
            secureTextEntry={!showApiKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowApiKey(!showApiKey)}
          >
            <FontAwesome name={showApiKey ? 'eye-slash' : 'eye'} size={16} color={dark.textSecondary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveApiKey}>
          <Text style={styles.saveButtonText}>Save Key</Text>
        </TouchableOpacity>
      </View>

      {/* Daily Goals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FontAwesome name="bullseye" size={16} color={brand.secondary} />
          <Text style={styles.sectionTitle}>Daily Goals</Text>
          <TouchableOpacity onPress={() => editingGoals ? handleSaveGoals() : setEditingGoals(true)} style={styles.editButton}>
            <FontAwesome name={editingGoals ? 'check' : 'pencil'} size={14} color={brand.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.goalsGrid}>
          {[
            { key: 'calories', label: 'Calories', unit: 'kcal', color: brand.primary },
            { key: 'protein', label: 'Protein', unit: 'g', color: '#FF6B6B' },
            { key: 'carbs', label: 'Carbs', unit: 'g', color: '#4ECDC4' },
            { key: 'fat', label: 'Fat', unit: 'g', color: '#FFE66D' },
          ].map(({ key, label, unit, color }) => (
            <GoalInput
              key={key}
              label={label}
              value={goals[key as keyof DailyGoals]}
              unit={unit}
              editing={editingGoals}
              onChange={(v) => setGoals({ ...goals, [key]: v })}
              color={color}
            />
          ))}
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <FontAwesome name="sign-out" size={18} color="#FF4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Cake AI v1.0.0</Text>
    </ScrollView>
  );
}

type GoalInputProps = {
  label: string;
  value: number;
  unit: string;
  editing: boolean;
  onChange: (v: number) => void;
  color: string;
};

function GoalInput({ label, value, unit, editing, onChange, color }: GoalInputProps) {
  return (
    <View style={goalStyles.container}>
      <View style={[goalStyles.dot, { backgroundColor: color }]} />
      <Text style={goalStyles.label}>{label}</Text>
      {editing ? (
        <TextInput
          style={goalStyles.input}
          value={String(value)}
          onChangeText={(t) => onChange(parseInt(t) || 0)}
          keyboardType="number-pad"
        />
      ) : (
        <Text style={goalStyles.value}>
          {value} <Text style={goalStyles.unit}>{unit}</Text>
        </Text>
      )}
    </View>
  );
}

const goalStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: dark.surface, borderRadius: 12, padding: 14, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  label: { flex: 1, fontSize: 15, color: dark.textSecondary },
  value: { fontSize: 16, fontWeight: '700', color: dark.text },
  unit: { fontSize: 13, fontWeight: '400', color: dark.textMuted },
  input: {
    fontSize: 16,
    fontWeight: '700',
    color: dark.text,
    backgroundColor: dark.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 80,
    textAlign: 'right',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: dark.bg },
  scrollContent: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: dark.text, letterSpacing: -0.5 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: dark.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: dark.cardBorder,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '700', color: dark.text },
  userEmail: { fontSize: 13, color: dark.textSecondary, marginTop: 2 },
  statBadge: {
    alignItems: 'center',
    backgroundColor: dark.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: brand.primary,
  },
  statLabel: { fontSize: 11, color: dark.textMuted },
  section: {
    backgroundColor: dark.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: dark.cardBorder,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: dark.text,
  },
  sectionDesc: { fontSize: 13, color: dark.textMuted, marginBottom: 12 },
  editButton: { padding: 4 },
  apiKeyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  apiKeyInput: {
    flex: 1,
    backgroundColor: dark.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: dark.text,
    fontSize: 14,
    fontFamily: 'SpaceMono',
  },
  eyeButton: { padding: 10 },
  saveButton: {
    backgroundColor: brand.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  goalsGrid: { marginTop: 8 },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
    marginTop: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4444',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: dark.textMuted,
    marginTop: 8,
  },
});
