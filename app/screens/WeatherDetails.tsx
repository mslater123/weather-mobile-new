import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ActivityIndicator, 
  ScrollView, 
  Image 
} from 'react-native';
import { RouteProp } from '@react-navigation/native';

type RootStackParamList = {
  Index: undefined;
  Settings: undefined;
  WeatherDetails: { city: City };
};

type WeatherDetailsRouteProp = RouteProp<RootStackParamList, 'WeatherDetails'>;

type WeatherDetailsProps = {
  route: WeatherDetailsRouteProp;
};

interface City {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
}

interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  weather: {
    description: string;
    icon: string;
  }[];
  wind: {
    speed: number;
    deg: number;
  };
  name: string;
  sys: {
    country: string;
  };
}

const API_KEY = 'YOUR_OPENWEATHER_API_KEY'; // Replace with your actual API key

export default function WeatherDetails({ route }: WeatherDetailsProps) {
  const { city } = route.params;
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&units=metric&appid=${API_KEY}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      const data: WeatherData = await response.json();
      setWeather(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!weather) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No weather data available.</Text>
      </View>
    );
  }

  const weatherIcon = weather.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${weatherIcon}@4x.png`;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.cityName}>{weather.name}, {weather.sys.country}</Text>
      <Image 
        source={{ uri: iconUrl }} 
        style={styles.weatherIcon} 
      />
      <Text style={styles.description}>{weather.weather[0].description}</Text>
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Temperature: {weather.main.temp}°C</Text>
        <Text style={styles.infoText}>Feels Like: {weather.main.feels_like}°C</Text>
        <Text style={styles.infoText}>Min: {weather.main.temp_min}°C</Text>
        <Text style={styles.infoText}>Max: {weather.main.temp_max}°C</Text>
        <Text style={styles.infoText}>Humidity: {weather.main.humidity}%</Text>
        <Text style={styles.infoText}>Wind Speed: {weather.wind.speed} m/s</Text>
        <Text style={styles.infoText}>Wind Direction: {weather.wind.deg}°</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  weatherIcon: {
    width: 150,
    height: 150,
  },
  description: {
    fontSize: 20,
    fontStyle: 'italic',
    marginBottom: 20,
    color: '#666',
    textTransform: 'capitalize',
  },
  infoContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  infoText: {
    fontSize: 18,
    marginVertical: 2,
    color: '#333',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
}); 