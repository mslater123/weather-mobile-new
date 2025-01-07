import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  saveLocation,
  getSavedLocations,
  City,
} from '../utils/storage';

// **Important:** Replace this with your actual OpenWeatherMap API key
const OPENWEATHER_API_KEY = 'YOUR_OPENWEATHER_API_KEY_HERE';

export default function HomeScreen() {
  const [cityList, setCityList] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [weather, setWeather] = useState<any>(null); // Define appropriate type
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State to manage temperature unit (true for Fahrenheit, false for Celsius)
  const [isFahrenheit, setIsFahrenheit] = useState(false);

  // Example: Predefined cities
  const INITIAL_CITY_LIST: City[] = [
    { id: 1, name: 'New York', country: 'US', lat: 40.7128, lon: -74.006 },
    { id: 2, name: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
    // Add more cities as needed
  ];

  useEffect(() => {
    setCityList(INITIAL_CITY_LIST);
    // Optionally, load additional cities from AsyncStorage if needed
  }, []);

  /**
   * Fetch weather data based on selected city's latitude and longitude and selected unit
   * @param city The city object for which to fetch weather
   * @param fahrenheit Whether to fetch data in Fahrenheit (true) or Celsius (false)
   */
  const fetchWeather = async (city: City, fahrenheit: boolean) => {
    setLoading(true);
    setError('');

    // Determine the unit based on the fahrenheit parameter
    const unit = fahrenheit ? 'imperial' : 'metric';

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&units=${unit}&appid=${OPENWEATHER_API_KEY}`
      );
      const data = await response.json();

      if (response.ok) {
        setWeather(data);
        setSelectedCity(city);
      } else {
        setError(data.message || 'Failed to fetch weather data.');
        Alert.alert('Error', data.message || 'Failed to fetch weather data.');
      }
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError('An error occurred while fetching weather data.');
      Alert.alert('Error', 'An error occurred while fetching weather data.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle saving a location to AsyncStorage
   * @param city The city to save
   */
  const handleSaveLocation = async (city: City) => {
    try {
      await saveLocation(city);
      Alert.alert('Success', `${city.name} has been saved to Settings.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save location.');
    }
  };

  /**
   * Check if a city is already saved
   * @param city The city to check
   * @returns Boolean indicating if the city is saved
   */
  const isCitySaved = async (city: City): Promise<boolean> => {
    try {
      const savedLocations = await getSavedLocations();
      return savedLocations.some(
        (item) => item.lat === city.lat && item.lon === city.lon
      );
    } catch (error) {
      console.error('Error checking saved locations:', error);
      return false;
    }
  };

  /**
   * Render each city item
   */
  const renderCity = ({ item }: { item: City }) => {
    const [saved, setSaved] = useState(false);

    useEffect(() => {
      const checkSaved = async () => {
        const isSaved = await isCitySaved(item);
        setSaved(isSaved);
      };
      checkSaved();
    }, []);

    return (
      <TouchableOpacity
        style={styles.cityItem}
        onPress={() => fetchWeather(item, isFahrenheit)}
      >
        <View>
          <Text style={styles.cityName}>
            {item.name}, {item.country}
          </Text>
          {/* You can display weather info here if available */}
        </View>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => handleSaveLocation(item)}
          disabled={saved}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={saved ? '#f5dd4b' : '#666'}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Implement your SearchBar and other UI components here */}

      <FlatList
        data={cityList}
        renderItem={renderCity}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
      />

      {/* Toggle for temperature unit */}
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>°C</Text>
        <Switch
          onValueChange={() => setIsFahrenheit(!isFahrenheit)}
          value={isFahrenheit}
        />
        <Text style={styles.toggleLabel}>°F</Text>
      </View>

      {/* Display Weather Information */}
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      {error !== '' && <Text style={styles.errorText}>{error}</Text>}
      {selectedCity && weather && (
        <View style={styles.weatherContainer}>
          <Text style={styles.weatherTitle}>
            {weather.name}, {weather.sys.country}
          </Text>
          <Text style={styles.temperature}>
            {Math.round(weather.main.temp)}°{isFahrenheit ? 'F' : 'C'}
          </Text>
          <Text style={styles.description}>{weather.weather[0].description}</Text>
          {/* Add more weather details as needed */}
        </View>
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
  list: {
    flex: 1,
    marginTop: 16,
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2, // For Android
    shadowColor: '#000', // For iOS
    shadowOffset: { width: 0, height: 1 }, // For iOS
    shadowOpacity: 0.2, // For iOS
  },
  cityName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  saveButton: {
    padding: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  toggleLabel: {
    fontSize: 16,
    marginHorizontal: 8,
    color: '#333',
  },
  weatherContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    marginTop: 16,
  },
  weatherTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 8,
  },
  description: {
    fontSize: 18,
    color: '#555',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 8,
  },
});
