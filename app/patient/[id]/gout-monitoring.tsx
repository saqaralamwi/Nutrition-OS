import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { watchRecord } from '../../../src/data/database/observe';
import { useObservable } from '../../../src/presentation/hooks/useObservable';
import { useAppTheme } from '../../../src/presentation/hooks/useAppTheme';
import { colors, spacing, fontFamilies, fontSizes } from '../../../src/presentation/theme';
import { useGoutMonitoring } from '../../../src/presentation/hooks/useGoutMonitoring';

export default function GoutMonitoringScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter(); const { theme } = useAppTheme();
  const patient = useObservable(useMemo(() => watchRecord<any>('patients', patientId), [patientId]), null);
  const { monitoring, isLoading, createMonitoring } = useGoutMonitoring(patientId);

  const [followUpDate, setFollowUpDate] = useState('');
  const [serumUricAcidText, setSerumUricAcidText] = useState('');
  const [urinaryUricAcidText, setUrinaryUricAcidText] = useState('');
  const [hasFlare, setHasFlare] = useState(false);
  const [flareDate, setFlareDate] = useState('');
  const [flareSeverity, setFlareSeverity] = useState<'mild'|'moderate'|'severe'>('mild');
  const [flareDurationText, setFlareDurationText] = useState('0');
  const [affectedJointsText, setAffectedJointsText] = useState('');
  const [painSeverity, setPainSeverity] = useState<'none'|'mild'|'moderate'|'severe'>('none');
  const [hasSwelling, setHasSwelling] = useState(false);
  const [hasTophi, setHasTophi] = useState(false);
  const [tophiSizeText, setTophiSizeText] = useState('0');
  const [weightText, setWeightText] = useState('');
  const [weightChangeText, setWeightChangeText] = useState('0');
  const [adherenceToDiet, setAdherenceToDiet] = useState(true);
  const [adherenceToMedication, setAdherenceToMedication] = useState(true);
  const [adherenceToFluids, setAdherenceToFluids] = useState(true);
  const [hasSideEffects, setHasSideEffects] = useState(false);
  const [sideEffectSeverity, setSideEffectSeverity] = useState<'none'|'mild'|'moderate'|'severe'>('none');
  const [isImproving, setIsImproving] = useState(false);
  const [uricAcidChangeText, setUricAcidChangeText] = useState('0');
  const [flareReductionText, setFlareReductionText] = useState('0');
  const [improvementPercentageText, setImprovementPercentageText] = useState('0');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!monitoring) return;
    setFollowUpDate(monitoring.followUpDate);
    setSerumUricAcidText(String(monitoring.serumUricAcid));
    setUrinaryUricAcidText(String(monitoring.urinaryUricAcid));
    setHasFlare(monitoring.hasFlare); setFlareDate(monitoring.flareDate);
    setFlareSeverity(monitoring.flareSeverity);
    setFlareDurationText(String(monitoring.flareDuration));
    setAffectedJointsText(monitoring.affectedJoints.join(', '));
    setPainSeverity(monitoring.painSeverity);
    setHasSwelling(monitoring.hasSwelling); setHasTophi(monitoring.hasTophi);
    setTophiSizeText(String(monitoring.tophiSize));
    setWeightText(String(monitoring.weight)); setWeightChangeText(String(monitoring.weightChange));
    setAdherenceToDiet(!!monitoring.adherenceToDiet);
    setAdherenceToMedication(!!monitoring.adherenceToMedication);
    setAdherenceToFluids(!!monitoring.adherenceToFluids);
    setHasSideEffects(monitoring.hasMedicationSideEffects);
    setSideEffectSeverity(monitoring.sideEffectSeverity);
    setIsImproving(monitoring.isImproving);
    setUricAcidChangeText(String(monitoring.uricAcidChange));
    setFlareReductionText(String(monitoring.flareReduction));
    setImprovementPercentageText(String(monitoring.improvementPercentage));
    setNextFollowUpDate(monitoring.nextFollowUpDate);
  }, [monitoring]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await createMonitoring({
        planId: monitoring?.id||'', followUpDate,
        serumUricAcid: parseFloat(serumUricAcidText)||0,
        urinaryUricAcid: parseFloat(urinaryUricAcidText)||0,
        hasFlare, flareDate, flareSeverity, flareDuration: parseInt(flareDurationText)||0,
        affectedJoints: affectedJointsText.split(',').map(s=>s.trim()).filter(Boolean),
        painSeverity, hasSwelling, hasTophi, tophiSize: parseFloat(tophiSizeText)||0,
        weight: parseFloat(weightText)||0, weightChange: parseFloat(weightChangeText)||0,
        adherenceToDiet, adherenceToMedication, adherenceToFluids,
        hasMedicationSideEffects: hasSideEffects, sideEffectSeverity,
        isImproving, uricAcidChange: parseFloat(uricAcidChangeText)||0,
        flareReduction: parseFloat(flareReductionText)||0,
        improvementPercentage: parseFloat(improvementPercentageText)||0,
        nextFollowUpDate,
      });
      Alert.alert('نجاح', 'تم حفظ متابعة النقرس بنجاح ✅'); router.back();
    } catch { Alert.alert('خطأ', 'فشل حفظ بيانات المتابعة.'); } finally { setIsSaving(false); }
  };

  const pl: Record<string,string> = {none:'لا يوجد ألم',mild:'خفيف',moderate:'متوسط',severe:'شديد'};
  const svl: Record<string,string> = {mild:'خفيفة',moderate:'متوسطة',severe:'شديدة'};

  if (isLoading||!patient) return (<View style={[styles.centered,{backgroundColor:theme.background}]}><ActivityIndicator size="large" color={colors.accentRose}/></View>);

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
  const InpF=({l,v,on,p}:{l:string;v:string;on:(s:string)=>void;p?:string})=>(
    <View style={{width:'46%',alignItems:'flex-end'}}>
      <Text style={{fontSize:12,fontFamily:fontFamilies.regular,color:theme.text}}>{l}</Text>
      <TextInput style={[styles.inp,{color:theme.text,borderColor:theme.border}]} value={v} onChangeText={on} keyboardType="numeric" placeholder={p}/>
    </View>
  );

  return (
    <KeyboardAvoidingView style={[{flex:1},{backgroundColor:theme.background}]} behavior={Platform.OS==='ios'?'padding':undefined}>
      <View style={[styles.header,{backgroundColor:colors.accentRose}]}>
        <TouchableOpacity style={styles.backButton} onPress={()=>router.back()}><Ionicons name="arrow-forward" size={24} color={colors.primaryContrast}/></TouchableOpacity>
        <Text style={styles.headerTitle}>متابعة النقرس</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={{padding:spacing.md,gap:spacing.md}} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>بيانات المتابعة</Text>
          <View style={{width:'100%',alignItems:'flex-end'}}><Text style={{fontSize:12,fontFamily:fontFamilies.regular,color:theme.text}}>تاريخ المتابعة:</Text><TextInput style={[styles.inp,{color:theme.text,borderColor:theme.border}]} value={followUpDate} onChangeText={setFollowUpDate} placeholder="YYYY-MM-DD"/></View>
        </View>
        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>التحاليل المخبرية</Text>
          <View style={{flexDirection:'row-reverse',flexWrap:'wrap',gap:spacing.md}}>
            <InpF l="حمض اليوريك في المصل:" v={serumUricAcidText} on={setSerumUricAcidText} p="ملغ/دل"/>
            <InpF l="حمض اليوريك البولي:" v={urinaryUricAcidText} on={setUrinaryUricAcidText} p="ملغ/24س"/>
          </View>
        </View>
        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>النوبة الحادة</Text>
          <SwRow l="وجود نوبة" v={hasFlare} s={setHasFlare}/>
          {hasFlare&&<>
            <View style={{width:'100%',alignItems:'flex-end'}}><Text style={{fontSize:12,fontFamily:fontFamilies.regular,color:theme.text}}>تاريخ النوبة:</Text><TextInput style={[styles.inp,{color:theme.text,borderColor:theme.border}]} value={flareDate} onChangeText={setFlareDate} placeholder="YYYY-MM-DD"/></View>
            <View style={{width:'100%',alignItems:'flex-end'}}><Text style={{fontSize:12,fontFamily:fontFamilies.regular,color:theme.text}}>شدة النوبة:</Text><ChipRow options={['mild','moderate','severe']} value={flareSeverity} onChange={setFlareSeverity} labels={svl}/></View>
            <InpF l="المدة (أيام):" v={flareDurationText} on={setFlareDurationText}/>
            <View style={{width:'100%',alignItems:'flex-end'}}><Text style={{fontSize:12,fontFamily:fontFamilies.regular,color:theme.text}}>المفاصل المصابة:</Text><TextInput style={[styles.inp,{color:theme.text,borderColor:theme.border}]} value={affectedJointsText} onChangeText={setAffectedJointsText} placeholder="إبهام القدم, الكاحل"/></View>
          </>}
        </View>
        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>الألم والالتهابات</Text>
          <View style={{width:'100%',alignItems:'flex-end'}}><Text style={{fontSize:12,fontFamily:fontFamilies.regular,color:theme.text}}>شدة الألم:</Text><ChipRow options={['none','mild','moderate','severe']} value={painSeverity} onChange={setPainSeverity} labels={pl}/></View>
          <SwRow l="تورّم" v={hasSwelling} s={setHasSwelling}/>
          <SwRow l="توفي" v={hasTophi} s={setHasTophi}/>
          {hasTophi&&<InpF l="حجم التوفي (سم):" v={tophiSizeText} on={setTophiSizeText}/>}
        </View>
        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>متابعة الوزن</Text>
          <View style={{flexDirection:'row-reverse',flexWrap:'wrap',gap:spacing.md}}>
            <InpF l="الوزن الحالي (كغ):" v={weightText} on={setWeightText}/>
            <InpF l="التغير في الوزن (كغ):" v={weightChangeText} on={setWeightChangeText}/>
          </View>
        </View>
        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>الالتزام بالخطة</Text>
          <SwRow l="الالتزام بالحمية" v={adherenceToDiet} s={setAdherenceToDiet}/>
          <SwRow l="الالتزام بالأدوية" v={adherenceToMedication} s={setAdherenceToMedication}/>
          <SwRow l="الالتزام بالسوائل" v={adherenceToFluids} s={setAdherenceToFluids}/>
        </View>
        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>الآثار الجانبية</Text>
          <SwRow l="وجود آثار جانبية" v={hasSideEffects} s={setHasSideEffects}/>
          {hasSideEffects&&<View style={{width:'100%',alignItems:'flex-end'}}><Text style={{fontSize:12,fontFamily:fontFamilies.regular,color:theme.text}}>الشدة:</Text><ChipRow options={['mild','moderate','severe']} value={sideEffectSeverity} onChange={setSideEffectSeverity} labels={svl}/></View>}
        </View>
        <View style={[styles.card,{backgroundColor:theme.card,borderColor:theme.border}]}>
          <Text style={[styles.cardTitle,{color:theme.text}]}>مؤشرات التقدم والتحسن</Text>
          <SwRow l="المريض يتحسن" v={isImproving} s={setIsImproving}/>
          <View style={{flexDirection:'row-reverse',flexWrap:'wrap',gap:spacing.md}}>
            <InpF l="تغير حمض اليوريك:" v={uricAcidChangeText} on={setUricAcidChangeText} p="ملغ/دل"/>
            <InpF l="نسبة انخفاض النوبات (%):" v={flareReductionText} on={setFlareReductionText}/>
            <InpF l="نسبة التحسن الإجمالية (%):" v={improvementPercentageText} on={setImprovementPercentageText}/>
          </View>
          <View style={{width:'100%',alignItems:'flex-end'}}><Text style={{fontSize:12,fontFamily:fontFamilies.regular,color:theme.text}}>تاريخ المتابعة التالي:</Text><TextInput style={[styles.inp,{color:theme.text,borderColor:theme.border}]} value={nextFollowUpDate} onChangeText={setNextFollowUpDate} placeholder="YYYY-MM-DD"/></View>
        </View>
        <TouchableOpacity style={{height:52,borderRadius:12,alignItems:'center',justifyContent:'center',marginTop:spacing.md,marginBottom:spacing.lg,backgroundColor:colors.accentRose}} onPress={handleSave} disabled={isSaving}>
          {isSaving?<ActivityIndicator size="small" color="#FFF"/>:<Text style={{color:'#FFF',fontSize:14,fontFamily:fontFamilies.bold}}>حفظ متابعة النقرس</Text>}
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
