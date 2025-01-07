import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ActivityIndicator,
  FlatList,
  Alert,
  Image,
  ImageBackground,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSavedLocations, City } from '../utils/storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { API_KEYS } from '../config/api';

type RootStackParamList = {
  Index: undefined;
  Settings: undefined;
  WeatherDetails: { city: City };
};

type WeatherDetailsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'WeatherDetails'
>;

interface WeatherData {
  main: {
    temp: number;
    humidity: number;
  };
  weather: {
    description: string;
    icon: string;
  }[];
}

interface LocationImage {
  url: string;
}

// Add this helper function at the top
const getLocalTime = (timezone: number) => {
  // Get current UTC time in milliseconds
  const utcTime = new Date().getTime();
  
  // Convert timezone offset from seconds to milliseconds
  const timezoneOffset = timezone * 1000;
  
  // Create date object with the correct local time
  const localTime = new Date(utcTime + timezoneOffset);
  
  // Format time to local string
  return localTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC'  // This is crucial for correct conversion
  });
};

export default function IndexScreen() {
  const [savedLocations, setSavedLocations] = useState<City[]>([]);
  const [weatherData, setWeatherData] = useState<{ [key: string]: WeatherData }>({});
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [useFahrenheit, setUseFahrenheit] = useState(false);
  const [locationImages, setLocationImages] = useState<{ [key: string]: LocationImage }>({});
  const isFocused = useIsFocused();
  const navigation = useNavigation<WeatherDetailsNavigationProp>();

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
      
      // Fetch weather and images for each location
      locations.forEach(location => {
        fetchWeatherData(location);
        fetchLocationImage(location.name);
      });
    } catch (error) {
      console.error('Error loading locations:', error);
      Alert.alert('Error', 'Failed to load saved locations');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherData = async (city: City) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&units=metric&appid=${API_KEYS.OPENWEATHER_API_KEY}`
      );
      const data = await response.json();
      setWeatherData(prev => ({
        ...prev,
        [city.id]: data
      }));
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  };

  const fetchLocationImage = async (cityName: string) => {
    if (locationImages[cityName]) return; // Skip if we already have the image

    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${cityName}+city+landmark&per_page=1`,
        {
          headers: {
            'Authorization': `Client-ID ${API_KEYS.UNSPLASH_API_KEY}`
          }
        }
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setLocationImages(prev => ({
          ...prev,
          [cityName]: { url: data.results[0].urls.regular }
        }));
      }
    } catch (error) {
      console.error('Error fetching location image:', error);
    }
  };

  const convertTemp = (celsius: number) => {
    return useFahrenheit ? (celsius * 9/5) + 32 : celsius;
  };

  // Add this temperature color function
  const getTemperatureColor = (temp: number, isFahrenheit: boolean) => {
    const celsius = isFahrenheit ? (temp - 32) * 5/9 : temp;
    
    if (celsius <= 0) return '#00FFFF';      // Cyan for freezing
    if (celsius <= 10) return '#87CEEB';     // Light blue for cold
    if (celsius <= 20) return '#FFFFFF';     // White for mild
    if (celsius <= 25) return '#FFE4B5';     // Light orange for warm
    if (celsius <= 30) return '#FFA500';     // Orange for hot
    return '#FF4500';                        // Red-orange for very hot
  };

  /**
   * Render each saved location item
   */
  const renderLocation = ({ item }: { item: City }) => {
    const weather = weatherData[item.id];
    const isSelected = selectedLocation === item.id;
    const locationImage = locationImages[item.name]?.url;
    const temp = weather ? Math.round(convertTemp(weather.main.temp)) : 0;
    const bgColor = weather ? getTemperatureColor(temp, useFahrenheit) : '#FFFFFF';
    const localTime = getLocalTime(weather?.timezone || 0);

    return (
      <TouchableOpacity 
        style={[styles.locationItem, isSelected && styles.selectedItem]}
        onPress={() => setSelectedLocation(isSelected ? null : item.id)}
      >
        <ImageBackground 
          source={{ uri: locationImage || 'https://default-image-url.jpg' }}
          style={styles.locationBackground}
          imageStyle={styles.backgroundImage}
        >
          <View style={styles.locationContent}>
            <View style={styles.contentRow}>
              <View style={[styles.boxContainer, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
                <Text style={styles.locationName} numberOfLines={1}>
                  {item.name}, {item.country}
                </Text>
                <Text style={styles.timeText}>{localTime}</Text>
              </View>
              {weather && (
                <View style={[styles.boxContainer, { backgroundColor: bgColor }]}>
                  <View style={styles.listTempContainer}>
                    <Text style={styles.listTemp}>{temp}</Text>
                    <Text style={styles.listTempUnit}>°{useFahrenheit ? 'F' : 'C'}</Text>
                  </View>
                </View>
              )}
              {weather && (
                <View style={styles.iconContainer}>
                  <Image 
                    source={{ uri: `https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png` }}
                    style={styles.weatherIcon}
                  />
                </View>
              )}
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  const renderWeatherDetails = () => {
    if (!selectedLocation || !weatherData[selectedLocation]) return null;

    const weather = weatherData[selectedLocation];
    const location = savedLocations.find(loc => loc.id === selectedLocation);
    const locationImage = locationImages[location?.name || '']?.url;
    const temp = Math.round(convertTemp(weather.main.temp));
    const bgColor = getTemperatureColor(temp, useFahrenheit);

    const handleTempClick = () => {
      setUseFahrenheit(!useFahrenheit);
    };

    return (
      <View style={styles.detailsContainer}>
        <ImageBackground
          source={{ uri: locationImage || 'https://default-image-url.jpg' }}
          style={styles.detailsBackground}
          imageStyle={styles.detailsBackgroundImage}
        >
          <View style={styles.detailsContent}>
            <View style={[styles.headerBox, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
              <Text style={styles.locationName} numberOfLines={1}>
                {location?.name}, {location?.country}
              </Text>
            </View>

            <View style={[styles.tempContainer, { backgroundColor: bgColor }]}>
              <Pressable onPress={handleTempClick}>
                <View style={styles.mainTempContainer}>
                  <Text style={styles.mainTemp}>{temp}</Text>
                  <Text style={styles.mainTempUnit}>°{useFahrenheit ? 'F' : 'C'}</Text>
                </View>
              </Pressable>
              <View style={styles.iconContainer}>
                <Image 
                  source={{ uri: `https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png` }}
                  style={styles.weatherIcon}
                />
              </View>
            </View>

            <View style={[styles.detailsBox, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
              <View style={styles.detailsGrid}>
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>Feels like</Text>
                  <Text style={styles.detailValue}>
                    {Math.round(convertTemp(weather.main.feels_like))}°
                  </Text>
                </View>
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>Min/Max</Text>
                  <Text style={styles.detailValue}>
                    {Math.round(convertTemp(weather.main.temp_min))}° / {Math.round(convertTemp(weather.main.temp_max))}°
                  </Text>
                </View>
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>Humidity</Text>
                  <Text style={styles.detailValue}>{weather.main.humidity}%</Text>
                </View>
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>Wind</Text>
                  <Text style={styles.detailValue}>{weather.wind.speed}m/s</Text>
                </View>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {savedLocations.length > 0 ? (
        <>
          <FlatList
            data={savedLocations}
            renderItem={renderLocation}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
          />
          {renderWeatherDetails()}
        </>
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.noLocationsText}>No saved locations</Text>
          <Text style={styles.subText}>Add locations in Settings</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  listContainer: {
    padding: 16,
  },
  locationItem: {
    height: 80,
    marginBottom: 12,
    overflow: 'hidden',
    borderRadius: 15,
  },
  locationBackground: {
    flex: 1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  locationContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  textBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  locationName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  tempContainer: {
    width: '40%',
    padding: 8,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 10,
  },
  mainTemp: {
    fontSize: 120,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  weatherIcon: {
    width: '100%',
    height: '100%',
  },
  selectedItem: {
    backgroundColor: '#e0e0e0',
  },
  noLocationsText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
  },
  subText: {
    fontSize: 16,
    color: '#666',
  },
  weatherInfo: {
    marginTop: 8,
  },
  temperature: {
    fontSize: 52,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  weatherDescription: {
    fontSize: 16,
    color: '#666',
    textTransform: 'capitalize',
  },
  humidity: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  selectedItem: {
    backgroundColor: '#e0e0e0',
  },
  detailsContainer: {
    height: 500,
    margin: 16,
    borderRadius: 25,
    overflow: 'hidden',
  },
  detailsBackground: {
    flex: 1,
  },
  detailsBackgroundImage: {
    borderRadius: 25,
  },
  detailsContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  detailsBox: {
    padding: 25,
    borderRadius: 25,
    width: '100%',
    minHeight: 200,
  },
  detailsGrid: {
    gap: 25,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailBox: {
    width: '45%',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 24,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  mainBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderRadius: 20,
    gap: 16,
  },
  centerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  mainTemp: {
    fontSize: 90,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  iconContainer: {
    width: 70,
    height: 70,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  detailsGrid: {
    gap: 25,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailBox: {
    width: '45%',
    alignItems: 'flex-start',
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxContainer: {
    width: 160,
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  temperature: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  detailsLocationName: {
    fontSize: 42,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  headerBox: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  temperature: {
    fontWeight: '600',
    fontSize: 50,
    color: '#000000',
    textAlign: 'center',
  },
  temperatureNumber: {
    fontSize: 96,
    fontWeight: '600',
    color: '#000000',
  },
  temperatureUnit: {
    fontSize: 42,
    fontWeight: '600',
    color: '#000000',
  },
  listTemp: {
    fontSize: 60,
    fontWeight: '500',
    color: '#000000',
  },
  unitText: {
    fontSize: 30,
  },
  mainTemp: {
    fontSize: 90,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  detailsUnitText: {
    fontSize: 45,
  },
  timeText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 2,
  },
  mainTempContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainTemp: {
    fontSize: 90,
    fontWeight: '700',
    color: '#000000',
  },
  mainTempUnit: {
    fontSize: 45,
    fontWeight: '700',
    color: '#000000',
    marginTop: 12,
  },
  listTempContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listTemp: {
    fontSize: 72,
    fontWeight: '600',
    color: '#000000',
  },
  listTempUnit: {
    fontSize: 36,
    fontWeight: '600',
    color: '#000000',
    marginTop: 10,
  },
});


