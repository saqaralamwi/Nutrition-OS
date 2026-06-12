import { Text, TextProps, StyleSheet } from 'react-native';
import { fontFamilies } from '../theme';

interface ArabicTextProps extends TextProps {
  bold?: boolean;
}

export default function ArabicText({ style, bold, ...props }: ArabicTextProps) {
  return (
    <Text
      style={[
        styles.base,
        bold ? styles.bold : styles.regular,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  regular: {
    fontFamily: fontFamilies.regular,
  },
  bold: {
    fontFamily: fontFamilies.bold,
  },
});
