import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { watchRecord } from '../../../src/data/database/observe';
import { useObservable } from '../../../src/presentation/hooks/useObservable';
import { useAppTheme } from '../../../src/presentation/hooks/useAppTheme';
import { colors, spacing, fontFamilies, fontSizes } from '../../../src/presentation/theme';
import { useGoutAssessment } from '../../../src/presentation/hooks/useGoutAssessment';
import { useGoutNutritionPlan } from '../../../src/presentation/hooks/useGoutNutritionPlan';
import { GoutNutritionEngine } from '../../../src/domain/calculators/GoutNutritionEngine';
import type { PurineIntakeLevel } from '../../../src/domain/types/gout';

export default function GoutNutritionPlanScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter(); const { theme } = useAppTheme();
  const patient = useObservable(useMemo(() => watchRecord<any>('patients', patientId), [patientId]), null);
  const { assessment, isLoading: loadingAssessment } = useGoutAssessment(patientId);
  const { plan, isLoading: loadingPlan, createPlan } = useGoutNutritionPlan(patientId);

  const requirements = useMemo(() => {
    if (!assessment) return null;
    try { return GoutNutritionEngine.calculateRequirements(assessment); } catch { return null; }
  }, [assessment]);

  const [maxPurineIntakeText, setMaxPurineIntakeText] = useState('200');
  const [targetCaloriesText, setTargetCaloriesText] = useState('2000');
  const [targetProteinText, setTargetProteinText] = useState('60');
  const [targetCarbsText, setTargetCarbsText] = useState('275');
  const [targetFatText, setTargetFatText] = useState('55');
  const [targetFluidText, setTargetFluidText] = useState('2500');
  const [targetVitaminCText, setTargetVitaminCText] = useState('500');
  const [needsVitaminC, setNeedsVitaminC] = useState(false);
  const [vitaminCDoseText, setVitaminCDoseText] = useState('500');
  const [needsCoQ10, setNeedsCoQ10] = useState(false);
  const [coq10DoseText, setCoq10DoseText] = useState('100');
  const [needsFishOil, setNeedsFishOil] = useState(false);
  const [fishOilDoseText, setFishOilDoseText] = useState('1000');
  const [allowedFoodsText, setAllowedFoodsText] = useState('');
  const [limitedFoodsText, setLimitedFoodsText] = useState('');
  const [avoidFoodsText, setAvoidFoodsText] = useState('');
  const [avoidBeer, setAvoidBeer] = useState(true);
  const [avoidLiquor, setAvoidLiquor] = useState(true);
  const [limitWine, setLimitWine] = useState(true);
  const [maxAlcoholUnitsText, setMaxAlcoholUnitsText] = useState('0');
  const [encourageWater, setEncourageWater] = useState(true);
  const [avoidSugaryDrinks, setAvoidSugaryDrinks] = useState(true);
  const [encourageCoffee, setEncourageCoffee] = useState(true);
  const [encourageCherry, setEncourageCherry] = useState(true);
  const [needsWeightLoss, setNeedsWeightLoss] = useState(false);
  const [targetWeightText, setTargetWeightText] = useState('70');
  const [weightLossRateText, setWeightLossRateText] = useState('0.5');
  const [onTherapy, setOnTherapy] = useState(false);
  const [medName, setMedName] = useState('');
  const [medDoseText, setMedDoseText] = useState('');
  const [medAdherence, setMedAdherence] = useState(true);
  const [checkFrequency, setCheckFrequency] = useState<'monthly'|'bimonthly'|'quarterly'>('monthly');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (requirements) {
      setMaxPurineIntakeText(String(requirements.maxPurineIntake));
      setTargetCaloriesText(String(requirements.targetCalories));
      setTargetProteinText(String(requirements.targetProtein));
      setTargetCarbsText(String(requirements.targetCarbs));
      setTargetFatText(String(requirements.targetFat));
      setTargetFluidText(String(requirements.targetFluid));
      setTargetVitaminCText(String(requirements.targetVitaminC));
    }
  }, [requirements]);

  useEffect(() => {
    if (!plan) return;
    setMaxPurineIntakeText(String(plan.maxPurineIntake));
    setTargetCaloriesText(String(plan.targetCalories));
    setTargetProteinText(String(plan.targetProtein));
    setTargetCarbsText(String(plan.targetCarbs));
    setTargetFatText(String(plan.targetFat));
    setTargetFluidText(String(plan.targetFluid));
    setTargetVitaminCText(String(plan.vitaminCDose));
    setNeedsVitaminC(plan.needsVitaminC);
    setVitaminCDoseText(String(plan.vitaminCDose));
    setNeedsCoQ10(plan.needsCoenzymeQ10);
    setCoq10DoseText(String(plan.coq10Dose));
    setNeedsFishOil(plan.needsFishOil);
    setFishOilDoseText(String(plan.fishOilDose));
    setAllowedFoodsText(plan.allowedFoods.join(', '));
    setLimitedFoodsText(plan.limitedFoods.join(', '));
    setAvoidFoodsText(plan.avoidFoods.join(', '));
    setAvoidBeer(plan.avoidBeer); setAvoidLiquor(plan.avoidLiquor); setLimitWine(plan.limitWine);
    setMaxAlcoholUnitsText(String(plan.maxAlcoholUnits));
    setEncourageWater(plan.encourageWater); setAvoidSugaryDrinks(plan.avoidSugaryDrinks);
    setEncourageCoffee(plan.encourageCoffee); setEncourageCherry(plan.encourageCherry);
    setNeedsWeightLoss(plan.needsWeightLoss);
    setTargetWeightText(String(plan.targetWeight)); setWeightLossRateText(String(plan.weightLossRate));
    setOnTherapy(plan.onUrateLoweringTherapy); setMedName(plan.medicationName);
    setMedDoseText(String(plan.medicationDose)); setMedAdherence(plan.medicationAdherence);
    setCheckFrequency(plan.uricAcidCheckFrequency);
  }, [plan]);

  const handleSave = async () => {
    if (!assessment) { Alert.alert('تنبيه', 'يرجى تعبئة تقييم النقرس أولاً.'); return; }
    setIsSaving(true);
    try {
      await createPlan({
        assessmentId: assessment.id||'', maxPurineIntake: parseFloat(maxPurineIntakeText)||0,
        purineIntakeLevel: 'moderate' as PurineIntakeLevel, targetUricAcid: 6.0, targetUrinaryUricAcid: 800,
        targetCalories: parseFloat(targetCaloriesText)||0, targetProtein: parseFloat(targetProteinText)||0,
        targetCarbs: parseFloat(targetCarbsText)||0, targetFat: parseFloat(targetFatText)||0, targetFiber: 30,
        needsVitaminC, vitaminCDose: parseFloat(vitaminCDoseText)||0,
        needsCoenzymeQ10: needsCoQ10, coq10Dose: parseFloat(coq10DoseText)||0,
        needsFishOil, fishOilDose: parseFloat(fishOilDoseText)||0,
        allowedFoods: allowedFoodsText.split(',').map(s=>s.trim()).filter(Boolean),
        limitedFoods: limitedFoodsText.split(',').map(s=>s.trim()).filter(Boolean),
        avoidFoods: avoidFoodsText.split(',').map(s=>s.trim()).filter(Boolean),
        lowPurineProteins: [], lowPurineVegetables: [], lowPurineFruits: [], lowPurineGrains: [],
        highPurineMeats: [], highPurineSeafood: [], highPurineVegetables: [], highPurineLegumes: [],
        avoidBeer, avoidLiquor, limitWine, maxAlcoholUnits: parseFloat(maxAlcoholUnitsText)||0,
        targetFluid: parseFloat(targetFluidText)||0, encourageWater, avoidSugaryDrinks,
        encourageCoffee, encourageCherry, needsWeightLoss, targetWeight: parseFloat(targetWeightText)||0,
        weightLossRate: parseFloat(weightLossRateText)||0, onUrateLoweringTherapy: onTherapy,
        medicationName: medName, medicationDose: medDoseText, medicationAdherence: medAdherence,
        uricAcidCheckFrequency: checkFrequency, targetFlareFrequency: 0, expectedImprovementMonths: 6,
      });
      Alert.alert('نجاح', 'تم حفظ الخطة الغذائية للنقرس بنجاح ✅'); router.back();
    } catch { Alert.alert('خطأ', 'فشل حفظ الخطة الغذائية.'); } finally { setIsSaving(false); }
  };

  const freqLabels: Record<string,string> = {monthly:'شهرياً',bimonthly:'كل شهرين',quarterly:'كل 3 أشهر'};

  if (loadingAssessment||loadingPlan||!patient) return (<View style={[styles.centered,{backgroundColor:theme.background}]}><ActivityIndicator size="large" color={colors.accentRose}/></View>);

  const SwRow=({l,v,s}:{l:string;v:boolean;s:(x:boolean)=>void})=>(
    <View style={{flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center',paddingVertical:6,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:colors.border}}>
      <Text style={{fontSize:12,fontFamily:fontFamilies.regular,color:theme.text}}>{l}</Text>
      <Switch value={v} onValueChange={s} trackColor={{true:colors.accentRose}}/>
    </View>
  );

  const ChipRow=({options,value,onChange,labels}:{options:readonly string[];value:string;onChange:(v:any)=>void;labels:Record<string,string>})=>(
    <View style={{flexDirection:'row-reverse',flexWrap:'wrap',gap:4}}>
      {options.map(o=>(
        <TouchableOpacity key={o} style={{paddingVertical:8,paddingHorizontal:12,borderRadius:20,borderWidth:1,borderColor:theme.border,backgroundColor:value===o?colors.accentRose:'transparent'}} onPress={()=>onChange(o)}>
          <Text style={{fontSize:11,fontFamily:fontFamilies.bold,color:value===o?'#FFF':theme.text}}>{labels[o]||o}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const InpField=({label,value,onChange,placeholder,multiline}:{label:string;value:string;onChange:(s:string)=>void;placeholder?:string;multiline?:boolean})=>(
    <View style={{width:'46%',alignItems:'flex-end'}}>
      <Text style={{fontSize:12,fontFamily:fontFamilies.regular,color:theme.text}}>{label}</Text>
      <TextInput style={[multiline?{minHeight:70,borderWidth:1,borderRadius:8,paddingHorizontal:12,paddingVertical:10,fontSize:12,textAlign:'right',width:'100%'}:styles.inp,{color:theme.text,borderColor:theme.border}]} value={value} onChangeText={onChange} keyboardType={label.includes('عدد')||label.includes('ملغ')||label.includes('سعرة')||label.includes('غ/')||label.includes('كغ')||label.includes('%/')||label.includes('(مل)')||label.includes('(وحدات')?'numeric':'default'} multiline={multiline} placeholder={placeholder}/>
    </View>
  );
  const InpFull=({label,value,onChange,placeholder,multiline}:{label:string;value:string;onChange:(s:string)=>void;placeholder?:string;multiline?:boolean})=>(
    <View style={{width:'100%',alignItems:'flex-end'}}>
      <Text style={{fontSize:12,fontFamily:fontFamilies.regular,color:theme.text}}>{label}</Text>
      <TextInput style={[multiline?{minHeight:70,borderWidth:1,borderRadius:8,paddingHorizontal:12,paddingVertical:10,fontSize:12,textAlign:'right',width:'100%'}:styles.inp,{color:theme.text,borderColor:theme.border}]} value={value} onChangeText={onChange} multiline={multiline} placeholder={placeholder}/>
    </View>
  );

  return (
    <KeyboardAvoidingView style={[{flex:1},{backgroundColor:theme.background}]} behavior={Platform.OS==='ios'?'padding':undefined}>
      <View style={[styles.header,{backgroundColor:colors.accentRose}]}>
        <TouchableOpacity style={styles.backButton} onPress={()=>router.back()}><Ionicons name="arrow-forward" size={24} color={colors.primaryContrast}/></TouchableOpacity>
        <Text style={styles.headerTitle}>الخطة الغذائية للنقرس</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={{padding:spacing.md,gap:spacing.md}} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>المستهدفات المحسوبة آلياً</Text>
          <View style={{flexDirection:'row-reverse',flexWrap:'wrap',gap:spacing.md}}>
            <InpField label="البيورين الأقصى (ملغ/يوم):" value={maxPurineIntakeText} onChange={setMaxPurineIntakeText}/>
            <InpField label="السعرات (سعرة/يوم):" value={targetCaloriesText} onChange={setTargetCaloriesText}/>
            <InpField label="البروتين (غ/يوم):" value={targetProteinText} onChange={setTargetProteinText}/>
            <InpField label="الكربوهيدرات (غ/يوم):" value={targetCarbsText} onChange={setTargetCarbsText}/>
            <InpField label="الدهون (غ/يوم):" value={targetFatText} onChange={setTargetFatText}/>
            <InpField label="السوائل المستهدفة (مل):" value={targetFluidText} onChange={setTargetFluidText}/>
            <InpField label="فيتامين C (ملغ):" value={targetVitaminCText} onChange={setTargetVitaminCText}/>
          </View>
        </View>

        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>المكملات الغذائية</Text>
          <SwRow l="فيتامين C" v={needsVitaminC} s={setNeedsVitaminC}/>
          {needsVitaminC&&<InpFull label="الجرعة (ملغ):" value={vitaminCDoseText} onChange={setVitaminCDoseText}/>}
          <SwRow l="CoQ10 (يوبيكوينون)" v={needsCoQ10} s={setNeedsCoQ10}/>
          {needsCoQ10&&<InpFull label="الجرعة (ملغ):" value={coq10DoseText} onChange={setCoq10DoseText}/>}
          <SwRow l="زيت السمك (Fish Oil)" v={needsFishOil} s={setNeedsFishOil}/>
          {needsFishOil&&<InpFull label="الجرعة (ملغ):" value={fishOilDoseText} onChange={setFishOilDoseText}/>}
        </View>

        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>قوائم الأطعمة</Text>
          <InpFull label="الأطعمة المسموحة (مفصولة بفواصل):" value={allowedFoodsText} onChange={setAllowedFoodsText} multiline placeholder="فواكه, ألبان قليلة الدسم, بيض, مكسرات"/>
          <InpFull label="الأطعمة المحدودة (بكميات معتدلة):" value={limitedFoodsText} onChange={setLimitedFoodsText} multiline placeholder="دجاج, تركي, تونة, سبانخ"/>
          <InpFull label="الأطعمة الممنوعة (تجنب تماماً):" value={avoidFoodsText} onChange={setAvoidFoodsText} multiline placeholder="لحم أحمر, كبد, سردين, بيرة"/>
        </View>

        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>الكحول والمشروبات</Text>
          <SwRow l="تجنب البيرة" v={avoidBeer} s={setAvoidBeer}/>
          <SwRow l="تجنب المشروبات الروحية" v={avoidLiquor} s={setAvoidLiquor}/>
          <SwRow l="الحد من النبيذ" v={limitWine} s={setLimitWine}/>
          <InpField label="الحد الأقصى (وحدات/أسبوع):" value={maxAlcoholUnitsText} onChange={setMaxAlcoholUnitsText}/>
        </View>

        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>توصيات السوائل</Text>
          <SwRow l="تشجيع شرب الماء" v={encourageWater} s={setEncourageWater}/>
          <SwRow l="تجنب المشروبات السكرية" v={avoidSugaryDrinks} s={setAvoidSugaryDrinks}/>
          <SwRow l="تشجيع القهوة" v={encourageCoffee} s={setEncourageCoffee}/>
          <SwRow l="تشجيع الكرز" v={encourageCherry} s={setEncourageCherry}/>
        </View>

        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>إدارة الوزن</Text>
          <SwRow l="بحاجة لإنقاص الوزن" v={needsWeightLoss} s={setNeedsWeightLoss}/>
          {needsWeightLoss&&<>
            <InpField label="الوزن المستهدف (كغ):" value={targetWeightText} onChange={setTargetWeightText}/>
            <InpField label="معدل الخسارة (كغ/أسبوع):" value={weightLossRateText} onChange={setWeightLossRateText}/>
          </>}
        </View>

        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>العلاج الدوائي</Text>
          <SwRow l="على علاج خافض لليوريك" v={onTherapy} s={setOnTherapy}/>
          {onTherapy&&<>
            <InpField label="اسم الدواء:" value={medName} onChange={setMedName} placeholder="ألوبيورينول"/>
            <InpField label="الجرعة:" value={medDoseText} onChange={setMedDoseText} placeholder="300 ملغ/يوم"/>
            <SwRow l="الالتزام بالدواء" v={medAdherence} s={setMedAdherence}/>
          </>}
        </View>

        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>وتيرة المتابعة</Text>
          <ChipRow options={['monthly','bimonthly','quarterly']} value={checkFrequency} onChange={setCheckFrequency} labels={freqLabels}/>
        </View>

        <TouchableOpacity style={{height:52,borderRadius:12,alignItems:'center',justifyContent:'center',marginTop:spacing.md,marginBottom:spacing.lg,backgroundColor:colors.accentRose}} onPress={handleSave} disabled={isSaving}>
          {isSaving?<ActivityIndicator size="small" color="#FFF"/>:<Text style={{color:'#FFF',fontSize:14,fontFamily:fontFamilies.bold}}>حفظ الخطة الغذائية</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container:{flex:1}, header:{height:70,flexDirection:'row-reverse',alignItems:'center',justifyContent:'center',position:'relative',paddingTop:Platform.OS==='ios'?10:0},
  backButton:{position:'absolute',right:16,padding:8}, headerTitle:{color:'#FFF',fontSize:fontSizes.lg,fontFamily:fontFamilies.bold},
  body:{flex:1}, card:{borderRadius:16,borderWidth:1,padding:spacing.md}, cardTitle:{fontSize:fontSizes.md,fontFamily:fontFamilies.bold,marginBottom:spacing.md,textAlign:'right'},
  inp:{height:48,borderWidth:1,borderRadius:8,paddingHorizontal:12,fontSize:14,textAlign:'right',width:'100%'},
  centered:{flex:1,alignItems:'center',justifyContent:'center'},
});
