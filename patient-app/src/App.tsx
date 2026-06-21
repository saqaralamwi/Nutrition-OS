import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { View } from 'react-native';
import { Navigation } from './components/Navigation';
import { FoodLogPage } from './pages/FoodLogPage';
import { GlucoseLogPage } from './pages/GlucoseLogPage';
import { WeightLogPage } from './pages/WeightLogPage';
import { MedicationLogPage } from './pages/MedicationLogPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { EducationPage } from './pages/EducationPage';
import { ProfilePage } from './pages/ProfilePage';

export function App(): React.ReactElement {
  return (
    <View className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<FoodLogPage />} />
          <Route path="/food-log" element={<FoodLogPage />} />
          <Route path="/glucose-log" element={<GlucoseLogPage />} />
          <Route path="/weight-log" element={<WeightLogPage />} />
          <Route path="/medication-log" element={<MedicationLogPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/education" element={<EducationPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>
    </View>
  );
}
