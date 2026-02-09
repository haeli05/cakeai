import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { dark, brand } from '@/constants/Colors';
import { analyzeFood } from '@/lib/ai';
import { saveMeal, type MealEntry } from '@/lib/storage';

const IMAGE_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.8,
  allowsEditing: true,
  aspect: [4, 3],
};

export default function CameraScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  async function requestImagePicker(
    launcher: typeof ImagePicker.launchCameraAsync | typeof ImagePicker.launchImageLibraryAsync,
    permissionRequest: () => Promise<ImagePicker.CameraPermissionResponse | ImagePicker.MediaLibraryPermissionResponse>,
    errorMsg: string
  ) {
    const { status } = await permissionRequest();
    if (status !== 'granted') {
      Alert.alert('Permission needed', errorMsg);
      return;
    }

    const result = await launcher(IMAGE_OPTIONS);
    if (!result.canceled) setImage(result.assets[0].uri);
  }

  const takePhoto = () => requestImagePicker(
    ImagePicker.launchCameraAsync,
    ImagePicker.requestCameraPermissionsAsync,
    'Camera access is required to scan food.'
  );

  const pickImage = () => requestImagePicker(
    ImagePicker.launchImageLibraryAsync,
    ImagePicker.requestMediaLibraryPermissionsAsync,
    'Photo library access is required.'
  );

  async function handleAnalyze() {
    if (!image) return;

    setAnalyzing(true);
    try {
      const result = await analyzeFood(image);

      if (!result.foods.length) {
        Alert.alert('No food detected', 'Could not identify any food in this image. Try a clearer photo.');
        return;
      }

      const now = new Date();
      const meal: MealEntry = {
        id: `meal_${Date.now()}`,
        imageUri: image,
        ...result,
        timestamp: now.getTime(),
        date: now.toISOString().split('T')[0],
      };

      await saveMeal(meal);
      router.push({ pathname: '/analysis', params: { mealData: JSON.stringify(meal) } });
      setImage(null);
    } catch (e: any) {
      Alert.alert('Analysis Error', e.message || 'Something went wrong. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Food</Text>
        <Text style={styles.subtitle}>Take a photo or choose from gallery</Text>
      </View>

      <View style={styles.previewContainer}>
        {image ? (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: image }} style={styles.preview} />
            <TouchableOpacity style={styles.clearButton} onPress={() => setImage(null)}>
              <FontAwesome name="times" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.placeholderIcon}>
              <FontAwesome name="cutlery" size={40} color={dark.textMuted} />
            </View>
            <Text style={styles.placeholderText}>Your food photo will appear here</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {!image ? (
          <>
            <TouchableOpacity style={styles.captureButton} onPress={takePhoto} activeOpacity={0.7}>
              <LinearGradient
                colors={[brand.gradient1, brand.gradient2]}
                style={styles.captureGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <FontAwesome name="camera" size={24} color="#fff" />
                <Text style={styles.captureText}>Take Photo</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.galleryButton} onPress={pickImage} activeOpacity={0.7}>
              <FontAwesome name="image" size={20} color={dark.textSecondary} />
              <Text style={styles.galleryText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.analyzeButton}
            onPress={handleAnalyze}
            disabled={analyzing}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={analyzing ? [dark.surface, dark.surface] : [brand.gradient1, brand.gradient2]}
              style={styles.analyzeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {analyzing ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.analyzeText}>Analyzing with AI...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.analyzeEmoji}>🍰</Text>
                  <Text style={styles.analyzeText}>Analyze Calories</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dark.bg,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
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
  previewContainer: {
    flex: 1,
    marginBottom: 20,
  },
  imageWrapper: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  preview: {
    flex: 1,
    borderRadius: 20,
  },
  clearButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: dark.card,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: dark.cardBorder,
    borderStyle: 'dashed',
  },
  placeholderIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 15,
    color: dark.textMuted,
  },
  actions: {
    gap: 12,
    paddingBottom: 20,
  },
  captureButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  captureGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  captureText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: dark.card,
    borderWidth: 1,
    borderColor: dark.cardBorder,
    gap: 10,
  },
  galleryText: {
    fontSize: 16,
    fontWeight: '600',
    color: dark.textSecondary,
  },
  analyzeButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  analyzeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  analyzeEmoji: {
    fontSize: 22,
  },
  analyzeText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
});
