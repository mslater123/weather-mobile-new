import { useTheme } from '@/context/ThemeContext';
import { View, ViewProps } from 'react-native';

interface ThemedViewProps extends ViewProps {
  children?: React.ReactNode;
}

export function ThemedView({ style, children, ...props }: ThemedViewProps) {
  const { theme } = useTheme();
  
  return (
    <View 
      style={[
        { backgroundColor: theme === 'light' ? '#FFFFFF' : '#000000' },
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
}
