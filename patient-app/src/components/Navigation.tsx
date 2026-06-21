import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { View, Text } from 'react-native';

interface NavItem {
  path: string;
  labelEn: string;
  labelAr: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/food-log', labelEn: 'Food Log', labelAr: '\u0633\u062C\u0644 \u0627\u0644\u0637\u0639\u0627\u0645', icon: '\uD83C\uDF4E' },
  { path: '/glucose-log', labelEn: 'Glucose', labelAr: '\u0633\u0643\u0631 \u0627\u0644\u062F\u0645', icon: '\uD83E\uDE78' },
  { path: '/weight-log', labelEn: 'Weight', labelAr: '\u0627\u0644\u0648\u0632\u0646', icon: '\u2696\uFE0F' },
  { path: '/medication-log', labelEn: 'Medications', labelAr: '\u0627\u0644\u0623\u062F\u0648\u064A\u0629', icon: '\uD83D\uDC8A' },
  { path: '/appointments', labelEn: 'Appointments', labelAr: '\u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F', icon: '\uD83D\uDCC5' },
  { path: '/education', labelEn: 'Education', labelAr: '\u0627\u0644\u062A\u0639\u0644\u064A\u0645', icon: '\uD83D\uDCDA' },
  { path: '/profile', labelEn: 'Profile', labelAr: '\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A', icon: '\uD83D\uDC64' },
];

export function Navigation(): React.ReactElement {
  const location = useLocation();
  const [language, setLanguage] = React.useState<'en' | 'ar'>('ar');

  return (
    <nav className="bg-primary-600 text-white shadow-lg">
      <View className="container mx-auto px-4">
        <View className="flex items-center justify-between h-16">
          <View className="flex items-center">
            <h1 className="text-xl font-bold">ADCN Nutrition</h1>
          </View>
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="px-3 py-1 bg-primary-700 rounded-lg hover:bg-primary-800 transition"
          >
            {language === 'en' ? '\u0627\u0644\u0639\u0631\u0628\u064A\u0629' : 'English'}
          </button>
        </View>
        <View className="flex items-center space-x-2 overflow-x-auto py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const label = language === 'en' ? item.labelEn : item.labelAr;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${
                  isActive
                    ? 'bg-primary-700 text-white'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                } ${language === 'ar' ? 'arabic' : ''}`}
              >
                <Text className="text-lg">{item.icon}</Text>
                <Text className="font-medium">{label}</Text>
              </Link>
            );
          })}
        </View>
      </View>
    </nav>
  );
}
