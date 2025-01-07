import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSavedLocations, removeLocation, City } from '../utils/storage';
import { useIsFocused } from '@react-navigation/native';

export default function SettingsScreen() {
  const [savedLocations, setSavedLocations] = useState<City[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const isFocused = useIsFocused(); // To refresh when screen is focused

  useEffect(() => {
    if (isFocused) {
      loadSavedLocations();
    }
  }, [isFocused]);

  const loadSavedLocations = async () => {
    try {
      setLoading(true);
      const locations = await getSavedLocations();
      setSavedLocations(locations);
      console.log('Loaded saved locations:', locations);
    } catch (error) {
      console.error('Error loading saved locations:', error);
      Alert.alert('Error', 'Failed to load saved locations.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLocation = (city: City) => {
    Alert.alert(
      'Remove Location',
      `Are you sure you want to remove ${city.name} from saved locations?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeLocation(city);
              loadSavedLocations();
              Alert.alert('Removed', `${city.name} has been removed.`);
            } catch (error) {
              console.error('Error removing location:', error);
              Alert.alert('Error', 'Failed to remove location.');
            }
          },
        },
      ]
    );
  };

  const renderSavedLocation = ({ item }: { item: City }) => (
    <View style={styles.locationItem}>
      <View>
        <Text style={styles.locationName}>
          {item.name}, {item.country}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleRemoveLocation(item)}
        style={styles.removeButton}
      >
        <Ionicons name="trash-outline" size={24} color="#ff3b30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Locations</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : savedLocations.length === 0 ? (
        <Text style={styles.noSavedText}>No saved locations.</Text>
      ) : (
        <FlatList
          data={savedLocations}
          renderItem={renderSavedLocation}
          keyExtractor={(item) => item.id?.toString() || `${item.lat}_${item.lon}`}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#eef2f3',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2, // For Android
    shadowColor: '#000', // For iOS
    shadowOffset: { width: 0, height: 1 }, // For iOS
    shadowOpacity: 0.1, // For iOS
    shadowRadius: 2, // For iOS
  },
  locationName: {
    fontSize: 18,
    color: '#333',
  },
  removeButton: {
    padding: 8,
  },
  noSavedText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  loader: {
    marginTop: 20,
  },
}); 