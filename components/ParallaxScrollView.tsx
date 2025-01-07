import React from 'react';
import { ScrollView, View, Image, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const PARALLAX_HEADER_HEIGHT = 200;

export default function ParallaxScrollView({ children }) {
  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.parallaxHeader}>
        <Image 
          source={{ uri: 'https://via.placeholder.com/400x200' }}
          style={styles.parallaxImage}
        />
      </View>
      <View style={styles.content}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  parallaxHeader: {
    height: PARALLAX_HEADER_HEIGHT,
  },
  parallaxImage: {
    width: width,
    height: PARALLAX_HEADER_HEIGHT,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
});
