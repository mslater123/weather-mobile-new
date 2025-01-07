import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ActivityIndicator,
  TextInput,
  Alert,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { 
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { getSavedLocations, removeLocation, saveLocation, updateLocations, City } from '../utils/storage';
import { useIsFocused } from '@react-navigation/native';

const API_KEY = '2a0633929ad3faadab8325851bdd1538';

export default function SettingsScreen() {
  const [savedLocations, setSavedLocations] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadSavedLocations();
    }
  }, [isFocused]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.length >= 3) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const loadSavedLocations = async () => {
    try {
      setLoading(true);
      const locations = await getSavedLocations();
      setSavedLocations(locations);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    try {
      const response = await fetch(
        `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`
      );
      const data = await response.json();
      
      const cities: City[] = data.map((item: any) => ({
        id: `${item.lat}_${item.lon}`,
        name: item.name,
        country: item.country,
        lat: item.lat,
        lon: item.lon
      }));

      setSearchResults(cities);
    } catch (error) {
      console.error('Error searching cities:', error);
      setSearchResults([]);
    }
  };

  const handleAddLocation = async (city: City) => {
    try {
      await saveLocation(city);
      loadSavedLocations();
      setSearchQuery('');
      setSearchResults([]);
      Alert.alert('Success', `${city.name} has been added to saved locations`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save location');
    }
  };

  const handleRemoveLocation = async (city: City) => {
    try {
      await removeLocation(city);
      loadSavedLocations();
    } catch (error) {
      Alert.alert('Error', 'Failed to remove location');
    }
  };

  const isLocationSaved = (city: City) => {
    return savedLocations.some(
      saved => saved.lat === city.lat && saved.lon === city.lon
    );
  };

  const renderSearchResult = ({ item }: { item: City }) => {
    const saved = isLocationSaved(item);
    return (
      <TouchableOpacity 
        style={styles.cityItem}
        onPress={() => !saved && handleAddLocation(item)}
        disabled={saved}
      >
        <Text style={styles.cityName}>{item.name}, {item.country}</Text>
        {saved ? (
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        ) : (
          <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
        )}
      </TouchableOpacity>
    );
  };

  const renderSavedLocation = ({ item, drag, isActive }: RenderItemParams<City>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          style={[
            styles.savedItem,
            { backgroundColor: isActive ? '#f0f0f0' : 'white' }
          ]}
          onLongPress={drag}
          disabled={isActive}
        >
          <View style={styles.locationInfo}>
            <Ionicons 
              name="menu" 
              size={24} 
              color="#666"
              style={styles.dragHandle} 
            />
            <Text style={styles.cityName}>{item.name}, {item.country}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => handleRemoveLocation(item)}
            style={styles.removeButton}
          >
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  const handleDragEnd = async ({ data }: { data: City[] }) => {
    try {
      await updateLocations(data);
      setSavedLocations(data);
    } catch (error) {
      console.error('Error updating location order:', error);
      Alert.alert('Error', 'Failed to update location order');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search cities..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={() => {
              setSearchQuery('');
              setSearchResults([]);
            }}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Results */}
      {searchQuery.length > 0 && (
        <View style={styles.searchResultsContainer}>
          <DraggableFlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              searchQuery.length >= 3 ? (
                <Text style={styles.noResultsText}>No cities found</Text>
              ) : (
                <Text style={styles.noResultsText}>Type at least 3 characters to search</Text>
              )
            }
          />
        </View>
      )}

      {/* Saved Locations */}
      <Text style={styles.subtitle}>Saved Locations</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <DraggableFlatList
          data={savedLocations}
          renderItem={renderSavedLocation}
          keyExtractor={(item) => item.id}
          onDragEnd={handleDragEnd}
          ListEmptyComponent={
            <Text style={styles.noLocationsText}>No saved locations</Text>
          }
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
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  searchResults: {
    maxHeight: 200,
    marginBottom: 16,
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  savedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cityName: {
    fontSize: 16,
    color: '#333',
  },
  removeButton: {
    padding: 8,
  },
  noLocationsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  loader: {
    marginTop: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dragHandle: {
    marginRight: 12,
    opacity: 0.5,
  },
  searchResultsContainer: {
    maxHeight: 200,
    marginBottom: 16,
  },
});
