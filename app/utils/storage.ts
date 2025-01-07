import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Define the City interface
 */
export interface City {
  id: string; // Unique identifier (e.g., 'lat_lon')
  name: string;
  country: string;
  lat: number;
  lon: number;
}

const SAVED_LOCATIONS_KEY = '@saved_locations';

/**
 * Save a new location to AsyncStorage.
 * @param city The city object to save.
 */
export const saveLocation = async (city: City): Promise<void> => {
  try {
    const existing = await AsyncStorage.getItem(SAVED_LOCATIONS_KEY);
    const saved: City[] = existing ? JSON.parse(existing) : [];

    // Prevent duplicates
    const isDuplicate = saved.some((savedCity) => savedCity.id === city.id);

    if (!isDuplicate) {
      const updated = [...saved, city];
      await AsyncStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(updated));
      console.log(`Location saved: ${city.name}`);
    } else {
      console.log(`Location already saved: ${city.name}`);
    }
  } catch (error) {
    console.error('Error saving location:', error);
    throw error;
  }
};

/**
 * Retrieve all saved locations from AsyncStorage.
 * @returns An array of saved City objects.
 */
export const getSavedLocations = async (): Promise<City[]> => {
  try {
    const existing = await AsyncStorage.getItem(SAVED_LOCATIONS_KEY);
    const saved: City[] = existing ? JSON.parse(existing) : [];
    return saved;
  } catch (error) {
    console.error('Error retrieving saved locations:', error);
    return [];
  }
};

/**
 * Remove a location from AsyncStorage.
 * @param city The city object to remove.
 */
export const removeLocation = async (city: City): Promise<void> => {
  try {
    const existing = await AsyncStorage.getItem(SAVED_LOCATIONS_KEY);
    let saved: City[] = existing ? JSON.parse(existing) : [];

    saved = saved.filter((savedCity) => savedCity.id !== city.id);

    await AsyncStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(saved));
    console.log(`Location removed: ${city.name}`);
  } catch (error) {
    console.error('Error removing location:', error);
    throw error;
  }
};

/**
 * Update the order of saved locations
 * @param locations The reordered array of locations
 */
export const updateLocations = async (locations: City[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(locations));
    console.log('Locations order updated');
  } catch (error) {
    console.error('Error updating locations:', error);
    throw error;
  }
}; 