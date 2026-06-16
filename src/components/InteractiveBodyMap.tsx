import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import { colors, spacing, fontFamilies } from '../presentation/theme';

type RegionId =
  | 'HEAD_ANT' | 'CHEST_ANT' | 'ABDOMEN_ANT'
  | 'ARM_L_ANT' | 'ARM_R_ANT'
  | 'LEG_L_ANT' | 'LEG_R_ANT'
  | 'PERINEUM'
  | 'HEAD_POST' | 'UPPER_BACK' | 'LOWER_BACK'
  | 'ARM_L_POST' | 'ARM_R_POST'
  | 'LEG_L_POST' | 'LEG_R_POST';

interface BodyRegionDef {
  id: RegionId;
  labelAr: string;
  percent: number;
  path: string;
}

type ViewMode = 'FRONT' | 'BACK';

const FRONT_REGIONS: BodyRegionDef[] = [
  { id: 'HEAD_ANT', labelAr: 'الرأس', percent: 4.5, path: 'M73,22 C73,6 127,6 127,22 L128,50 C128,63 72,63 72,50 Z' },
  { id: 'CHEST_ANT', labelAr: 'الصدر', percent: 9.0, path: 'M58,58 L142,58 L142,170 C142,180 135,186 128,186 L72,186 C65,186 58,180 58,170 Z' },
  { id: 'ABDOMEN_ANT', labelAr: 'البطن', percent: 9.0, path: 'M63,186 L137,186 L137,286 C137,296 130,302 122,302 L78,302 C70,302 63,296 63,286 Z' },
  { id: 'ARM_L_ANT', labelAr: 'الذراع الأيسر', percent: 4.5, path: 'M8,62 L54,62 L54,172 C54,182 48,188 38,188 L18,188 C10,188 8,180 8,172 Z' },
  { id: 'ARM_R_ANT', labelAr: 'الذراع الأيمن', percent: 4.5, path: 'M146,62 L192,62 L192,172 C192,182 190,188 182,188 L162,188 C152,188 146,182 146,172 Z' },
  { id: 'LEG_L_ANT', labelAr: 'الساق اليسرى', percent: 9.0, path: 'M65,308 L98,308 L98,470 C98,482 90,490 82,490 L65,490 L65,308 Z' },
  { id: 'LEG_R_ANT', labelAr: 'الساق اليمنى', percent: 9.0, path: 'M102,308 L135,308 L135,490 L118,490 C110,490 102,482 102,470 Z' },
  { id: 'PERINEUM', labelAr: 'العجان', percent: 1.0, path: 'M82,302 L118,302 L114,314 L86,314 Z' },
];

const BACK_REGIONS: BodyRegionDef[] = [
  { id: 'HEAD_POST', labelAr: 'الرأس (خلف)', percent: 4.5, path: 'M73,22 C73,6 127,6 127,22 L128,50 C128,63 72,63 72,50 Z' },
  { id: 'UPPER_BACK', labelAr: 'الظهر العلوي', percent: 9.0, path: 'M58,58 L142,58 L142,170 C142,180 135,186 128,186 L72,186 C65,186 58,180 58,170 Z' },
  { id: 'LOWER_BACK', labelAr: 'الظهر السفلي', percent: 9.0, path: 'M63,186 L137,186 L137,286 C137,296 130,302 122,302 L78,302 C70,302 63,296 63,286 Z' },
  { id: 'ARM_L_POST', labelAr: 'الذراع الأيسر (خلف)', percent: 4.5, path: 'M8,62 L54,62 L54,172 C54,182 48,188 38,188 L18,188 C10,188 8,180 8,172 Z' },
  { id: 'ARM_R_POST', labelAr: 'الذراع الأيمن (خلف)', percent: 4.5, path: 'M146,62 L192,62 L192,172 C192,182 190,188 182,188 L162,188 C152,188 146,182 146,172 Z' },
  { id: 'LEG_L_POST', labelAr: 'الساق اليسرى (خلف)', percent: 9.0, path: 'M65,308 L98,308 L98,470 C98,482 90,490 82,490 L65,490 L65,308 Z' },
  { id: 'LEG_R_POST', labelAr: 'الساق اليمنى (خلف)', percent: 9.0, path: 'M102,308 L135,308 L135,490 L118,490 C110,490 102,482 102,470 Z' },
];

const ACTIVE_FILL = '#EF4444';
const ACTIVE_OPACITY = 0.55;
const INACTIVE_FILL = '#1E293B';
const INACTIVE_STROKE = '#475569';
const HOVER_FILL = '#3B82F6';

export interface InteractiveBodyMapProps {
  onTBSAChange: (calculatedTBSA: number) => void;
  initialTBSA?: number;
}

export default function InteractiveBodyMap({ onTBSAChange, initialTBSA }: InteractiveBodyMapProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [viewMode, setViewMode] = useState<ViewMode>('FRONT');
  const [selectedRegions, setSelectedRegions] = useState<Set<RegionId>>(new Set());
  const [hoveredRegion, setHoveredRegion] = useState<RegionId | null>(null);

  const regions = viewMode === 'FRONT' ? FRONT_REGIONS : BACK_REGIONS;

  const totalTBSA = useMemo(() => {
    let sum = 0;
    for (const r of regions) {
      if (selectedRegions.has(r.id)) sum += r.percent;
    }
    return parseFloat(sum.toFixed(1));
  }, [selectedRegions, regions]);

  useEffect(() => {
    onTBSAChange(totalTBSA || (initialTBSA ?? 0));
  }, [totalTBSA, initialTBSA, onTBSAChange]);

  const toggleRegion = useCallback((id: RegionId) => {
    setSelectedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const resetSelections = useCallback(() => {
    setSelectedRegions(new Set());
  }, []);

  const clearAll = useCallback(() => {
    setSelectedRegions(new Set());
  }, []);

  const svgSize = Math.min(screenWidth - spacing.md * 2, 320);
  const scale = svgSize / 200;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>خريطة الجسم التفاعلية</Text>
        <Text style={styles.subtitle}>المساحة الكلية المحروقة (TBSA)</Text>
      </View>

      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'FRONT' && styles.toggleBtnActive]}
          onPress={() => { setViewMode('FRONT'); setHoveredRegion(null); }}
          activeOpacity={0.7}
        >
          <Text style={[styles.toggleBtnText, viewMode === 'FRONT' && styles.toggleBtnTextActive]}>
            أمامي
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'BACK' && styles.toggleBtnActive]}
          onPress={() => { setViewMode('BACK'); setHoveredRegion(null); }}
          activeOpacity={0.7}
        >
          <Text style={[styles.toggleBtnText, viewMode === 'BACK' && styles.toggleBtnTextActive]}>
            خلفي
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.svgContainer, { width: svgSize, height: svgSize * 2.5 }]}>
        <Svg
          width={svgSize}
          height={svgSize * 2.5}
          viewBox="0 0 200 500"
        >
          <G>
            {regions.map((region) => {
              const isSelected = selectedRegions.has(region.id);
              const isHovered = hoveredRegion === region.id;
              let fill = isSelected ? ACTIVE_FILL : INACTIVE_FILL;
              let opacity = isSelected ? ACTIVE_OPACITY : 0.7;
              if (isHovered && !isSelected) {
                fill = HOVER_FILL;
                opacity = 0.3;
              }
              return (
                <Path
                  key={region.id}
                  d={region.path}
                  fill={fill}
                  opacity={opacity}
                  stroke={isSelected ? '#EF4444' : INACTIVE_STROKE}
                  strokeWidth={1.5}
                  onPress={() => toggleRegion(region.id)}
                  onPressIn={() => setHoveredRegion(region.id)}
                  onPressOut={() => setHoveredRegion(null)}
                />
              );
            })}

            {hoveredRegion && regions.find((r) => r.id === hoveredRegion) && (
              <G>
                <SvgText
                  x={100}
                  y={250}
                  textAnchor="middle"
                  fontSize={14}
                  fontWeight="bold"
                  fill="#F8FAFC"
                >
                  {regions.find((r) => r.id === hoveredRegion)?.labelAr}
                </SvgText>
                <SvgText
                  x={100}
                  y={268}
                  textAnchor="middle"
                  fontSize={12}
                  fill="#94A3B8"
                >
                  {regions.find((r) => r.id === hoveredRegion)?.percent}%
                </SvgText>
              </G>
            )}
          </G>
        </Svg>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ACTIVE_FILL, opacity: ACTIVE_OPACITY }]} />
          <Text style={styles.legendText}>محدد</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: INACTIVE_FILL, borderColor: INACTIVE_STROKE, borderWidth: 1 }]} />
          <Text style={styles.legendText}>غير محدد</Text>
        </View>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>إجمالي TBSA:</Text>
        <Text style={styles.summaryValue}>{totalTBSA}%</Text>
        {!!initialTBSA && initialTBSA !== totalTBSA && (
          <Text style={styles.summaryInitial}>القيمة السابقة: {initialTBSA}%</Text>
        )}
      </View>

      {selectedRegions.size > 0 && (
        <View style={styles.selectedList}>
          {regions
            .filter((r) => selectedRegions.has(r.id))
            .map((r) => (
              <TouchableOpacity
                key={r.id}
                style={styles.selectedChip}
                onPress={() => toggleRegion(r.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.selectedChipText}>
                  {r.labelAr} — {r.percent}%
                </Text>
              </TouchableOpacity>
            ))}
        </View>
      )}

      <TouchableOpacity style={styles.resetBtn} onPress={clearAll} activeOpacity={0.7}>
        <Text style={styles.resetBtnText}>إعادة تعيين التحديد</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 2,
    marginBottom: spacing.sm,
    gap: 2,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 80,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  toggleBtnText: {
    fontSize: 13,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
  },
  toggleBtnTextActive: {
    color: colors.primaryContrast,
    fontFamily: fontFamilies.bold,
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: 15,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 22,
    fontFamily: fontFamilies.bold,
    color: colors.danger,
  },
  summaryInitial: {
    fontSize: 12,
    fontFamily: fontFamilies.regular,
    color: colors.textDisabled,
  },
  selectedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    justifyContent: 'center',
  },
  selectedChip: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderColor: colors.danger,
    borderWidth: 1,
  },
  selectedChipText: {
    fontSize: 12,
    fontFamily: fontFamilies.regular,
    color: colors.danger,
  },
  resetBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 13,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
