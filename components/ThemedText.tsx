import { useTheme } from '@/context/ThemeContext';
import { Text, TextProps } from 'react-native';

interface ThemedTextProps extends TextProps {
  children: React.ReactNode;
}

export function ThemedText({ style, children, ...props }: ThemedTextProps) {
  const { theme } = useTheme();
  
  return (
    <Text 
      style={[
        { color: theme === 'light' ? '#000000' : '#FFFFFF' },
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
}
