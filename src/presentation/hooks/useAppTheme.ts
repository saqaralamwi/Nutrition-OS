import { useEffect } from 'react';
import {
  withTiming,
  Easing,
  useAnimatedStyle,
  interpolateColor,
  makeMutable,
} from 'react-native-reanimated';
import { useSettingsStore } from '../stores/settingsStore';
import { themeConfig } from '../theme/themeConfig';

// Global shared value to synchronize animations globally across all screens and components.
// 0 = MORNING (light), 1 = NIGHT (dark)
export const globalThemeProgress = makeMutable(1);

export function useAppTheme() {
  const themeMode = useSettingsStore((s) => s.themeMode);

  useEffect(() => {
    const targetValue = themeMode === 'night' ? 1 : 0;
    if (globalThemeProgress.value !== targetValue) {
      globalThemeProgress.value = withTiming(targetValue, {
        duration: 450,
        easing: Easing.inOut(Easing.quad),
      });
    }
  }, [themeMode]);

  const theme = themeMode === 'night' ? themeConfig.NIGHT : themeConfig.MORNING;

  const animatedContainer = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        globalThemeProgress.value,
        [0, 1],
        [themeConfig.MORNING.background, themeConfig.NIGHT.background]
      ),
    };
  });

  const animatedCard = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        globalThemeProgress.value,
        [0, 1],
        [themeConfig.MORNING.card, themeConfig.NIGHT.card]
      ),
      borderColor: interpolateColor(
        globalThemeProgress.value,
        [0, 1],
        [themeConfig.MORNING.border, themeConfig.NIGHT.border]
      ),
    };
  });

  const animatedText = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        globalThemeProgress.value,
        [0, 1],
        [themeConfig.MORNING.text, themeConfig.NIGHT.text]
      ),
    };
  });

  const animatedSubtext = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        globalThemeProgress.value,
        [0, 1],
        [themeConfig.MORNING.subtext, themeConfig.NIGHT.subtext]
      ),
    };
  });

  return {
    themeMode,
    theme,
    animatedContainer,
    animatedCard,
    animatedText,
    animatedSubtext,
  };
}
