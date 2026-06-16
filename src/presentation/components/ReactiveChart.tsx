import { View, StyleSheet, ScrollView } from 'react-native';
import { Observable } from 'rxjs';
import { useObservable } from '../hooks/useObservable';
import ArabicText from './ArabicText';

interface Point {
  x: string;
  y: number;
}

interface ReactiveChartProps {
  observable: Observable<any[]>;
  dataMapper: (data: any[]) => Point[];
  title: string;
  color?: string;
}

export function ReactiveChart({
  observable,
  dataMapper,
  title,
  color = '#10B981',
}: ReactiveChartProps) {
  const rawData = useObservable(observable) || [];
  const points = dataMapper(rawData);

  if (points.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ArabicText style={styles.emptyText}>لا توجد بيانات كافية لعرض الرسم البياني ({title})</ArabicText>
      </View>
    );
  }

  const values = points.map((p) => p.y);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const chartHeight = 120;
  const colWidth = 45;

  return (
    <View style={styles.container}>
      <ArabicText bold style={styles.title}>{title}</ArabicText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.chartArea, { height: chartHeight, width: points.length * colWidth }]}>
          {points.map((pt, i) => {
            const x = i * colWidth;
            const y = chartHeight - ((pt.y - minVal) / range) * (chartHeight - 40) - 20;
            return (
              <View key={i} style={[styles.column, { left: x, width: colWidth }]}>
                <ArabicText style={[styles.valText, { color }]}>{pt.y.toFixed(1)}</ArabicText>
                <View style={[styles.bar, { top: y, height: chartHeight - y - 24, backgroundColor: color + '22', borderColor: color }]} />
                <ArabicText style={styles.lblText} numberOfLines={1}>{pt.x}</ArabicText>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 8,
  },
  title: {
    fontSize: 14,
    color: '#F8FAFC',
    marginBottom: 12,
    textAlign: 'right',
  },
  scrollContent: {
    paddingVertical: 4,
  },
  chartArea: {
    position: 'relative',
  },
  column: {
    position: 'absolute',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  valText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  bar: {
    position: 'absolute',
    bottom: 24,
    width: 24,
    borderRadius: 4,
    borderWidth: 1,
  },
  lblText: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 4,
  },
  emptyContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
export default ReactiveChart;
