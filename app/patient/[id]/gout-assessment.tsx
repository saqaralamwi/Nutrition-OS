import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { watchRecord } from '../../../src/data/database/observe';
import { useObservable } from '../../../src/presentation/hooks/useObservable';
import { useAppTheme } from '../../../src/presentation/hooks/useAppTheme';
import { colors, spacing, fontFamilies, fontSizes } from '../../../src/presentation/theme';
import { useGoutAssessment } from '../../../src/presentation/hooks/useGoutAssessment';
import { GoutNutritionEngine } from '../../../src/domain/calculators/GoutNutritionEngine';
import type { GoutSeverity, GoutStage, UricAcidStatus } from '../../../src/domain/types/gout';

export default function GoutAssessmentScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter(); const { theme } = useAppTheme();
  const patient = useObservable(useMemo(() => watchRecord<any>('patients', patientId), [patientId]), null);
  const { assessment, isLoading, createAssessment } = useGoutAssessment(patientId);

  const [serumUricAcidText, setSerumUricAcidText] = useState('6.0');
  const [uricAcidUnit, setUricAcidUnit] = useState<'mg/dL' | 'µmol/L'>('mg/dL');
  const [severity, setSeverity] = useState<GoutSeverity>('none');
  const [stage, setStage] = useState<GoutStage>('hyperuricemia');
  const [flareFrequencyText, setFlareFrequencyText] = useState('0');
  const [lastFlareDate, setLastFlareDate] = useState('');
  const [avgFlareDurationText, setAvgFlareDurationText] = useState('0');
  const [hasChronicPain, setHasChronicPain] = useState(false);
  const [affectedJointsText, setAffectedJointsText] = useState('');
  const [hasTophi, setHasTophi] = useState(false);
  const [tophiLocationText, setTophiLocationText] = useState('');
  const [hasObesity, setHasObesity] = useState(false);
  const [hasMetabolicSyndrome, setHasMetabolicSyndrome] = useState(false);
  const [hasDiabetes, setHasDiabetes] = useState(false);
  const [hasCKD, setHasCKD] = useState(false);
  const [hasHTN, setHasHTN] = useState(false);
  const [hasDyslipidemia, setHasDyslipidemia] = useState(false);
  const [hasSmoking, setHasSmoking] = useState(false);
  const [hasAlcoholUse, setHasAlcoholUse] = useState(false);
  const [alcoholType, setAlcoholType] = useState<'beer'|'wine'|'liquor'|'mixed'>('beer');
  const [alcoholUnitsText, setAlcoholUnitsText] = useState('0');
  const [hasDiuretics, setHasDiuretics] = useState(false);
  const [hasAspirin, setHasAspirin] = useState(false);
  const [hasNiacin, setHasNiacin] = useState(false);
  const [hasCyclosporine, setHasCyclosporine] = useState(false);
  const [hasLevodopa, setHasLevodopa] = useState(false);
  const [dietaryPattern, setDietaryPattern] = useState<'regular'|'vegetarian'|'vegan'|'restricted'>('regular');
  const [avgPurineIntakeText, setAvgPurineIntakeText] = useState('200');
  const [meatConsumptionText, setMeatConsumptionText] = useState('3');
  const [seafoodConsumptionText, setSeafoodConsumptionText] = useState('1');
  const [dairyConsumptionText, setDairyConsumptionText] = useState('2');
  const [vegetableConsumptionText, setVegetableConsumptionText] = useState('3');
  const [fruitConsumptionText, setFruitConsumptionText] = useState('2');
  const [hasAcutePain, setHasAcutePain] = useState(false);
  const [painSeverity, setPainSeverity] = useState<'mild'|'moderate'|'severe'>('mild');
  const [hasSwelling, setHasSwelling] = useState(false);
  const [hasRedness, setHasRedness] = useState(false);
  const [hasWarmth, setHasWarmth] = useState(false);
  const [hasLimitedMobility, setHasLimitedMobility] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!assessment) return;
    setSerumUricAcidText(String(assessment.serumUricAcid));
    setUricAcidUnit(assessment.uricAcidUnit);
    setSeverity(assessment.severity); setStage(assessment.stage);
    setFlareFrequencyText(String(assessment.flareFrequency));
    setLastFlareDate(assessment.lastFlareDate);
    setAvgFlareDurationText(String(assessment.averageFlareDuration));
    setHasChronicPain(assessment.hasChronicPain);
    setAffectedJointsText(assessment.affectedJoints.join(', '));
    setHasTophi(assessment.hasTophi);
    setTophiLocationText(assessment.tophiLocation.join(', '));
    setHasObesity(assessment.hasObesity);
    setHasMetabolicSyndrome(assessment.hasMetabolicSyndrome);
    setHasDiabetes(assessment.hasDiabetes); setHasCKD(assessment.hasCKD);
    setHasHTN(assessment.hasHTN); setHasDyslipidemia(assessment.hasDyslipidemia);
    setHasSmoking(assessment.hasSmoking); setHasAlcoholUse(assessment.hasAlcoholUse);
    setAlcoholType(assessment.alcoholType as any);
    setAlcoholUnitsText(String(assessment.alcoholUnitsPerWeek));
    setHasDiuretics(assessment.hasDiuretics); setHasAspirin(assessment.hasAspirin);
    setHasNiacin(assessment.hasNiacin); setHasCyclosporine(assessment.hasCyclosporine);
    setHasLevodopa(assessment.hasLevodopa);
    setDietaryPattern(assessment.dietaryPattern);
    setAvgPurineIntakeText(String(assessment.avgPurineIntake));
    setMeatConsumptionText(String(assessment.meatConsumption));
    setSeafoodConsumptionText(String(assessment.seafoodConsumption));
    setDairyConsumptionText(String(assessment.dairyConsumption));
    setVegetableConsumptionText(String(assessment.vegetableConsumption));
    setFruitConsumptionText(String(assessment.fruitConsumption));
    setHasAcutePain(assessment.hasAcutePain);
    setPainSeverity(assessment.painSeverity as any);
    setHasSwelling(assessment.hasSwelling); setHasRedness(assessment.hasRedness);
    setHasWarmth(assessment.hasWarmth); setHasLimitedMobility(assessment.hasLimitedMobility);
  }, [assessment]);

  const liveUricAcidStatus = useMemo((): UricAcidStatus => GoutNutritionEngine.classifyUricAcidStatus(parseFloat(serumUricAcidText)||0, uricAcidUnit), [serumUricAcidText, uricAcidUnit]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await createAssessment({
        serumUricAcid: parseFloat(serumUricAcidText)||0, uricAcidUnit, uricAcidStatus: liveUricAcidStatus,
        urinaryUricAcid: 0, severity, stage, flareFrequency: parseInt(flareFrequencyText)||0,
        lastFlareDate, averageFlareDuration: parseFloat(avgFlareDurationText)||0, hasChronicPain,
        affectedJoints: affectedJointsText.split(',').map(s=>s.trim()).filter(Boolean), hasTophi,
        tophiLocation: tophiLocationText.split(',').map(s=>s.trim()).filter(Boolean),
        age: patient?.age||0, gender: patient?.gender||'male', weight: patient?.weight||0,
        height: patient?.height||0, bmi: patient?.bmi||0, hasObesity, hasMetabolicSyndrome,
        hasDiabetes, hasCKD, hasHTN, hasDyslipidemia, hasSmoking, hasAlcoholUse, alcoholType,
        alcoholUnitsPerWeek: parseFloat(alcoholUnitsText)||0, hasDiuretics, hasAspirin, hasNiacin,
        hasCyclosporine, hasLevodopa, dietaryPattern, avgPurineIntake: parseFloat(avgPurineIntakeText)||0,
        purineIntakeLevel: 'moderate', meatConsumption: parseFloat(meatConsumptionText)||0,
        seafoodConsumption: parseFloat(seafoodConsumptionText)||0,
        dairyConsumption: parseFloat(dairyConsumptionText)||0,
        vegetableConsumption: parseFloat(vegetableConsumptionText)||0,
        fruitConsumption: parseFloat(fruitConsumptionText)||0, hasHighPurineFoods: false,
        highPurineFoodsConsumed: [], hasAcutePain, painSeverity, hasSwelling, hasRedness,
        hasWarmth, hasLimitedMobility, hasKidneyStones: false, hasJointDamage: false,
      });
      Alert.alert('نجاح', 'تم حفظ تقييم النقرس بنجاح ✅'); router.back();
    } catch { Alert.alert('خطأ', 'فشل حفظ بيانات التقييم.'); } finally { setIsSaving(false); }
  };

  const sl: Record<string,string> = {none:'طبيعي',mild:'خفيف',moderate:'متوسط',severe:'شديد',chronic_tophaceous:'توفي مزمن'};
  const stl: Record<string,string> = {hyperuricemia:'فرط حمض يوريك الدم',acute_flare:'نوبة حادة',intercritical:'فترة بين النوبات',chronic_tophaceous:'توفي مزمن'};
  const usc: Record<string,string> = {normal:colors.success,elevated:colors.warning,high:colors.danger,very_high:'#8B0000'};
  const usl: Record<string,string> = {normal:'طبيعي',elevated:'مرتفع قليلاً',high:'مرتفع',very_high:'مرتفع جداً'};
  const atl: Record<string,string> = {beer:'بيرة',wine:'نبيذ',liquor:'مشروبات روحية',mixed:'متنوع'};
  const cls = ['0','1','2','3','4','5','6','7'];

  if (isLoading||!patient) return (<View style={[styles.centered,{backgroundColor:theme.background}]}><ActivityIndicator size="large" color={colors.accentRose}/></View>);

  return (
    <KeyboardAvoidingView style={[{flex:1}, {backgroundColor:theme.background}]} behavior={Platform.OS==='ios'?'padding':undefined}>
      <View style={[styles.header,{backgroundColor:colors.accentRose}]}>
        <TouchableOpacity style={styles.backButton} onPress={()=>router.back()}><Ionicons name="arrow-forward" size={24} color={colors.primaryContrast}/></TouchableOpacity>
        <Text style={styles.headerTitle}>تقييم النقرس</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={{padding:spacing.md,gap:spacing.md}} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>حمض اليوريك</Text>
          <View style={[styles.itemFull,{alignItems:'flex-end'}]}>
            <Text style={[styles.lbl,{color:theme.text}]}>حمض اليوريك في المصل:</Text>
            <View style={{flexDirection:'row-reverse',alignItems:'center',width:'100%',gap:spacing.sm}}>
              <TextInput style={[styles.inp,{color:theme.text,borderColor:theme.border,flex:1}]} value={serumUricAcidText} onChangeText={setSerumUricAcidText} keyboardType="numeric" placeholder="مثال: 7.2"/>
              <View style={{flexDirection:'row-reverse',borderWidth:1,borderColor:colors.border,borderRadius:8,overflow:'hidden'}}>
                {(['mg/dL','µmol/L'] as const).map(u=>(
                  <TouchableOpacity key={u} style={{paddingVertical:10,paddingHorizontal:16,backgroundColor:uricAcidUnit===u?colors.accentRose:'transparent'}} onPress={()=>setUricAcidUnit(u)}>
                    <Text style={{fontSize:12,fontFamily:fontFamilies.bold,color:uricAcidUnit===u?'#FFF':theme.text}}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          <View style={[styles.itemFull,{alignItems:'flex-end'}]}>
            <Text style={[styles.lbl,{color:theme.text}]}>التصنيف التلقائي:</Text>
            <View style={{flexDirection:'row-reverse',alignItems:'center',paddingVertical:8,paddingHorizontal:16,borderRadius:20,gap:spacing.sm,alignSelf:'flex-end',backgroundColor:(usc[liveUricAcidStatus]||theme.subtext)+'20'}}>
              <View style={{width:10,height:10,borderRadius:5,backgroundColor:usc[liveUricAcidStatus]||theme.subtext}}/>
              <Text style={{fontSize:12,fontFamily:fontFamilies.bold,color:usc[liveUricAcidStatus]||theme.subtext}}>{usl[liveUricAcidStatus]||liveUricAcidStatus}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>تصنيف النقرس</Text>
          <View style={[styles.itemFull,{alignItems:'flex-end'}]}>
            <Text style={[styles.lbl,{color:theme.text}]}>الشدة:</Text>
            <View style={{flexDirection:'row-reverse',flexWrap:'wrap',gap:4}}>
              {(['none','mild','moderate','severe','chronic_tophaceous'] as GoutSeverity[]).map(s=>(
                <TouchableOpacity key={s} style={{paddingVertical:8,paddingHorizontal:12,borderRadius:20,borderWidth:1,borderColor:theme.border,backgroundColor:severity===s?colors.accentRose:'transparent'}} onPress={()=>setSeverity(s)}>
                  <Text style={{fontSize:11,fontFamily:fontFamilies.bold,color:severity===s?'#FFF':theme.text}}>{sl[s]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={[styles.itemFull,{alignItems:'flex-end'}]}>
            <Text style={[styles.lbl,{color:theme.text}]}>المرحلة:</Text>
            <View style={{flexDirection:'row-reverse',flexWrap:'wrap',gap:4}}>
              {(['hyperuricemia','acute_flare','intercritical','chronic_tophaceous'] as GoutStage[]).map(st=>(
                <TouchableOpacity key={st} style={{paddingVertical:8,paddingHorizontal:12,borderRadius:20,borderWidth:1,borderColor:theme.border,backgroundColor:stage===st?colors.accentRose:'transparent'}} onPress={()=>setStage(st)}>
                  <Text style={{fontSize:11,fontFamily:fontFamilies.bold,color:stage===st?'#FFF':theme.text}}>{stl[st]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>تاريخ النوبات الحادة</Text>
          <View style={{flexDirection:'row-reverse',flexWrap:'wrap',gap:spacing.md}}>
            <View style={{width:'46%',alignItems:'flex-end'}}><Text style={[styles.lbl,{color:theme.text}]}>عدد النوبات/سنة:</Text><TextInput style={[styles.inp,{color:theme.text,borderColor:theme.border}]} value={flareFrequencyText} onChangeText={setFlareFrequencyText} keyboardType="numeric"/></View>
            <View style={{width:'46%',alignItems:'flex-end'}}><Text style={[styles.lbl,{color:theme.text}]}>تاريخ آخر نوبة:</Text><TextInput style={[styles.inp,{color:theme.text,borderColor:theme.border}]} value={lastFlareDate} onChangeText={setLastFlareDate} placeholder="YYYY-MM-DD"/></View>
            <View style={{width:'46%',alignItems:'flex-end'}}><Text style={[styles.lbl,{color:theme.text}]}>متوسط المدة (أيام):</Text><TextInput style={[styles.inp,{color:theme.text,borderColor:theme.border}]} value={avgFlareDurationText} onChangeText={setAvgFlareDurationText} keyboardType="numeric"/></View>
            <View style={{width:'46%',alignItems:'flex-end',flexDirection:'row-reverse',justifyContent:'space-between',paddingVertical:6}}>
              <Text style={{fontSize:12,fontFamily:fontFamilies.regular,color:theme.text}}>ألم مزمن:</Text>
              <Switch value={hasChronicPain} onValueChange={setHasChronicPain} trackColor={{true:colors.accentRose}}/>
            </View>
          </View>
        </View>

        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>المفاصل المصابة والتوفي</Text>
          <View style={[styles.itemFull,{alignItems:'flex-end'}]}>
            <Text style={[styles.lbl,{color:theme.text}]}>المفاصل المتأثرة (مفصولة بفواصل):</Text>
            <TextInput style={[styles.inp,{color:theme.text,borderColor:theme.border}]} value={affectedJointsText} onChangeText={setAffectedJointsText} placeholder="إبهام القدم الأيمن, الكاحل"/>
          </View>
          <View style={{flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center',paddingVertical:6,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:colors.border}}>
            <Text style={{fontSize:12,fontFamily:fontFamilies.regular,color:theme.text}}>وجود توفي (Tophi):</Text>
            <Switch value={hasTophi} onValueChange={setHasTophi} trackColor={{true:colors.accentRose}}/>
          </View>
          {hasTophi&&<View style={[styles.itemFull,{alignItems:'flex-end'}]}><Text style={[styles.lbl,{color:theme.text}]}>موقع التوفي:</Text><TextInput style={[styles.inp,{color:theme.text,borderColor:theme.border}]} value={tophiLocationText} onChangeText={setTophiLocationText} placeholder="مفصل الإبهام, الكوع"/></View>}
        </View>

        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>عوامل الخطورة</Text>
          {[{k:'السمنة',v:hasObesity,s:setHasObesity},{k:'متلازمة الأيض',v:hasMetabolicSyndrome,s:setHasMetabolicSyndrome},{k:'السكري',v:hasDiabetes,s:setHasDiabetes},{k:'أمراض الكلى (CKD)',v:hasCKD,s:setHasCKD},{k:'ارتفاع الضغط (HTN)',v:hasHTN,s:setHasHTN},{k:'اضطراب شحميات الدم',v:hasDyslipidemia,s:setHasDyslipidemia},{k:'التدخين',v:hasSmoking,s:setHasSmoking},{k:'استهلاك الكحول',v:hasAlcoholUse,s:setHasAlcoholUse}].map(({k,v,s})=>(
            <View key={k} style={{flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center',paddingVertical:6,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:colors.border}}>
              <Text style={{fontSize:12,fontFamily:fontFamilies.regular,color:theme.text}}>{k}</Text>
              <Switch value={v} onValueChange={s} trackColor={{true:colors.accentRose}}/>
            </View>
          ))}
          {hasAlcoholUse&&<>
            <View style={[styles.itemFull,{alignItems:'flex-end'}]}><Text style={[styles.lbl,{color:theme.text}]}>نوع الكحول:</Text>
              <View style={{flexDirection:'row-reverse',flexWrap:'wrap',gap:4}}>
                {(['beer','wine','liquor','mixed'] as const).map(at=>(<TouchableOpacity key={at} style={{paddingVertical:8,paddingHorizontal:12,borderRadius:20,borderWidth:1,borderColor:theme.border,backgroundColor:alcoholType===at?colors.accentRose:'transparent'}} onPress={()=>setAlcoholType(at)}><Text style={{fontSize:11,fontFamily:fontFamilies.bold,color:alcoholType===at?'#FFF':theme.text}}>{atl[at]}</Text></TouchableOpacity>))}
              </View></View>
            <View style={{width:'46%',alignItems:'flex-end'}}><Text style={[styles.lbl,{color:theme.text}]}>الوحدات/أسبوع:</Text><TextInput style={[styles.inp,{color:theme.text,borderColor:theme.border}]} value={alcoholUnitsText} onChangeText={setAlcoholUnitsText} keyboardType="numeric"/></View>
          </>}
        </View>

        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>الأدوية المسببة</Text>
          {[{k:'مدرات البول',v:hasDiuretics,s:setHasDiuretics},{k:'الأسبرين',v:hasAspirin,s:setHasAspirin},{k:'النياسين',v:hasNiacin,s:setHasNiacin},{k:'السيكلوسبورين',v:hasCyclosporine,s:setHasCyclosporine},{k:'ليفودوبا',v:hasLevodopa,s:setHasLevodopa}].map(({k,v,s})=>(
            <View key={k} style={{flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center',paddingVertical:6,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:colors.border}}>
              <Text style={{fontSize:12,fontFamily:fontFamilies.regular,color:theme.text}}>{k}</Text>
              <Switch value={v} onValueChange={s} trackColor={{true:colors.accentRose}}/>
            </View>
          ))}
        </View>

        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>النمط الغذائي واستهلاك البيورين</Text>
          <View style={[styles.itemFull,{alignItems:'flex-end'}]}><Text style={[styles.lbl,{color:theme.text}]}>النمط:</Text>
            <View style={{flexDirection:'row-reverse',flexWrap:'wrap',gap:4}}>
              {(['regular','vegetarian','vegan','restricted'] as const).map(dp=>(<TouchableOpacity key={dp} style={{paddingVertical:8,paddingHorizontal:12,borderRadius:20,borderWidth:1,borderColor:theme.border,backgroundColor:dietaryPattern===dp?colors.accentRose:'transparent'}} onPress={()=>setDietaryPattern(dp)}><Text style={{fontSize:11,fontFamily:fontFamilies.bold,color:dietaryPattern===dp?'#FFF':theme.text}}>{dp==='regular'?'عادي':dp==='vegetarian'?'نباتي':dp==='vegan'?'نباتي صرف':'مقيد'}</Text></TouchableOpacity>))}
            </View></View>
          <View style={{width:'46%',alignItems:'flex-end'}}><Text style={[styles.lbl,{color:theme.text}]}>البيورين اليومي (ملغ):</Text><TextInput style={[styles.inp,{color:theme.text,borderColor:theme.border}]} value={avgPurineIntakeText} onChangeText={setAvgPurineIntakeText} keyboardType="numeric"/></View>
          {[{l:'اللحوم',v:meatConsumptionText,s:setMeatConsumptionText},{l:'المأكولات البحرية',v:seafoodConsumptionText,s:setSeafoodConsumptionText},{l:'منتجات الألبان',v:dairyConsumptionText,s:setDairyConsumptionText},{l:'الخضروات',v:vegetableConsumptionText,s:setVegetableConsumptionText},{l:'الفواكه',v:fruitConsumptionText,s:setFruitConsumptionText}].map(({l,v,s})=>(
            <View key={l} style={[styles.itemFull,{alignItems:'flex-end'}]}>
              <Text style={[styles.lbl,{color:theme.text}]}>مستوى استهلاك {l}:</Text>
              <View style={{flexDirection:'row-reverse',borderRadius:8,overflow:'hidden',borderWidth:1,borderColor:colors.border}}>
                {cls.map(c=>(
                  <TouchableOpacity key={c} style={{flex:1,paddingVertical:10,alignItems:'center',backgroundColor:v===c?colors.accentRose:'transparent',borderRightWidth:StyleSheet.hairlineWidth,borderRightColor:colors.border}} onPress={()=>s(c)}>
                    <Text style={{fontSize:11,fontFamily:fontFamilies.bold,color:v===c?'#FFF':theme.text}}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>الأعراض الحالية</Text>
          <View style={{flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center',paddingVertical:6,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:colors.border}}>
            <Text style={{fontSize:12,fontFamily:fontFamilies.regular,color:theme.text}}>ألم حاد</Text>
            <Switch value={hasAcutePain} onValueChange={setHasAcutePain} trackColor={{true:colors.accentRose}}/>
          </View>
          {hasAcutePain&&<View style={[styles.itemFull,{alignItems:'flex-end'}]}>
            <Text style={[styles.lbl,{color:theme.text}]}>شدة الألم:</Text>
            <View style={{flexDirection:'row-reverse',flexWrap:'wrap',gap:4}}>
              {(['mild','moderate','severe'] as const).map(ps=>(<TouchableOpacity key={ps} style={{paddingVertical:8,paddingHorizontal:12,borderRadius:20,borderWidth:1,borderColor:theme.border,backgroundColor:painSeverity===ps?colors.accentRose:'transparent'}} onPress={()=>setPainSeverity(ps)}><Text style={{fontSize:11,fontFamily:fontFamilies.bold,color:painSeverity===ps?'#FFF':theme.text}}>{ps==='mild'?'خفيف':ps==='moderate'?'متوسط':'شديد'}</Text></TouchableOpacity>))}
            </View></View>}
          {[{k:'تورّم',v:hasSwelling,s:setHasSwelling},{k:'احمرار',v:hasRedness,s:setHasRedness},{k:'سخونة موضعية',v:hasWarmth,s:setHasWarmth},{k:'محدودية الحركة',v:hasLimitedMobility,s:setHasLimitedMobility}].map(({k,v,s})=>(
            <View key={k} style={{flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center',paddingVertical:6,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:colors.border}}>
              <Text style={{fontSize:12,fontFamily:fontFamilies.regular,color:theme.text}}>{k}</Text>
              <Switch value={v} onValueChange={s} trackColor={{true:colors.accentRose}}/>
            </View>
          ))}
        </View>

        <View style={{borderRadius:12,borderWidth:1.5,padding:spacing.md,backgroundColor:colors.accentRose+'10',borderColor:colors.accentRose}}>
          <Text style={{fontSize:12,fontFamily:fontFamilies.bold,marginBottom:4,textAlign:'right',color:colors.accentRose}}><Ionicons name="medical-outline" size={16}/> الدعم السريري التلقائي (CDSS)</Text>
          <View style={{gap:4,alignItems:'flex-end'}}>
            <Text style={{fontSize:12,fontFamily:fontFamilies.regular,color:theme.text}}>حالة حمض اليوريك: <Text style={{fontWeight:'bold'}}>{usl[liveUricAcidStatus]}</Text></Text>
            <Text style={{fontSize:12,fontFamily:fontFamilies.regular,color:theme.text}}>شدة النقرس: <Text style={{fontWeight:'bold'}}>{sl[severity]}</Text></Text>
            <Text style={{fontSize:12,fontFamily:fontFamilies.regular,color:theme.text}}>المرحلة السريرية: <Text style={{fontWeight:'bold'}}>{stl[stage]}</Text></Text>
          </View>
        </View>

        <TouchableOpacity style={{height:52,borderRadius:12,alignItems:'center',justifyContent:'center',marginTop:spacing.md,marginBottom:spacing.lg,backgroundColor:colors.accentRose}} onPress={handleSave} disabled={isSaving}>
          {isSaving?<ActivityIndicator size="small" color="#FFF"/>:<Text style={{color:'#FFF',fontSize:14,fontFamily:fontFamilies.bold}}>حفظ واعتماد تقييم النقرس</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container:{flex:1}, header:{height:70,flexDirection:'row-reverse',alignItems:'center',justifyContent:'center',position:'relative',paddingTop:Platform.OS==='ios'?10:0},
  backButton:{position:'absolute',right:16,padding:8}, headerTitle:{color:'#FFF',fontSize:fontSizes.lg,fontFamily:fontFamilies.bold},
  body:{flex:1}, card:{borderRadius:16,borderWidth:1,padding:spacing.md}, cardTitle:{fontSize:fontSizes.md,fontFamily:fontFamilies.bold,marginBottom:spacing.md,textAlign:'right'},
  itemFull:{width:'100%',gap:4}, lbl:{fontSize:12,fontFamily:fontFamilies.regular}, inp:{height:48,borderWidth:1,borderRadius:8,paddingHorizontal:12,fontSize:14,textAlign:'right',width:'100%'},
  centered:{flex:1,alignItems:'center',justifyContent:'center'},
});
