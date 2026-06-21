import React from 'react';
import { View, Text } from 'react-native';

interface EducationContent {
  id: string;
  titleAr: string;
  titleEn: string;
  category: string;
  categoryAr: string;
  type: string;
  typeAr: string;
  summary: string;
  summaryAr: string;
  viewed: boolean;
}

const CONTENT: EducationContent[] = [
  { id: '1', titleAr: 'التغذية السليمة لمرضى السكري', titleEn: 'Healthy Nutrition for Diabetes', category: 'diabetes', categoryAr: 'السكري', type: 'article', typeAr: 'مقال', summary: 'نصائح غذائية مهمة لمرضى السكري من النوع الثاني', summaryAr: 'نصائح غذائية مهمة لمرضى السكري من النوع الثاني', viewed: false },
  { id: '2', titleAr: 'كيف تقرأ ملصقات الطعام', titleEn: 'How to Read Food Labels', category: 'nutrition', categoryAr: 'تغذية', type: 'article', typeAr: 'مقال', summary: 'دليل لقراءة الملصقات الغذائية وفهم المكونات', summaryAr: 'دليل لقراءة الملصقات الغذائية وفهم المكونات', viewed: false },
  { id: '3', titleAr: 'وصفات صحية منخفضة الصوديوم', titleEn: 'Low Sodium Healthy Recipes', category: 'recipes', categoryAr: 'وصفات', type: 'video', typeAr: 'فيديو', summary: 'وصفات لذيذة وصحية قليلة الملح', summaryAr: 'وصفات لذيذة وصحية قليلة الملح', viewed: false },
  { id: '4', titleAr: 'أهمية الفيتامينات في النظام الغذائي', titleEn: 'Vitamin Importance in Diet', category: 'nutrition', categoryAr: 'تغذية', type: 'article', typeAr: 'مقال', summary: 'دليل شامل عن الفيتامينات وأهميتها', summaryAr: 'دليل شامل عن الفيتامينات وأهميتها', viewed: true },
  { id: '5', titleAr: 'تمارين بسيطة لكبار السن', titleEn: 'Simple Exercises for Seniors', category: 'fitness', categoryAr: 'لياقة', type: 'video', typeAr: 'فيديو', summary: 'تمارين آمنة ومنزلية لكبار السن', summaryAr: 'تمارين آمنة ومنزلية لكبار السن', viewed: true },
];

const CATEGORIES = ['all', 'diabetes', 'nutrition', 'recipes', 'fitness'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  all: 'الكل',
  diabetes: 'السكري',
  nutrition: 'تغذية',
  recipes: 'وصفات',
  fitness: 'لياقة',
};

export function EducationPage(): React.ReactElement {
  const [category, setCategory] = React.useState('all');
  const [contents, setContents] = React.useState(CONTENT);

  const filtered = category === 'all'
    ? contents
    : contents.filter((c) => c.category === category);

  const toggleViewed = (id: string) => {
    setContents(contents.map((c) => c.id === id ? { ...c, viewed: !c.viewed } : c));
  };

  return (
    <View className="space-y-6">
      <View className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 arabic">المحتوى التعليمي</h2>
        <p className="text-gray-600 arabic mt-2">مواد تعليمية لتحسين صحتك وتغذيتك</p>
      </View>

      <View className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition arabic ${
              category === cat
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-primary-50'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </View>

      <View className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <View
            key={item.id}
            className={`bg-white border rounded-lg p-5 transition hover:shadow-lg cursor-pointer ${
              item.viewed ? 'border-gray-200' : 'border-primary-300 bg-primary-50/30'
            }`}
            onClick={() => toggleViewed(item.id)}
          >
            <View className="flex items-start justify-between mb-2">
              <View>
                <Text className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded arabic">
                  {item.categoryAr}
                </Text>
                <Text className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mr-2 arabic">
                  {item.typeAr}
                </Text>
              </View>
              {!item.viewed && (
                <Text className="w-2 h-2 bg-red-500 rounded-full" title="جديد" />
              )}
            </View>
            <h3 className="font-semibold text-gray-800 arabic text-lg mb-1">{item.titleAr}</h3>
            <p className="text-sm text-gray-600">{item.titleEn}</p>
            <p className="text-sm text-gray-500 arabic mt-2">{item.summaryAr}</p>
          </View>
        ))}
      </View>
    </View>
  );
}
