import sqlite3 from 'sqlite3';

export interface MigrationResult {
  tablesCreated: number;
  indexesCreated: number;
  foreignKeysCreated: number;
}

export async function migrateSchema(dbPath: string = './database/adcn.db'): Promise<MigrationResult> {
  console.log('Starting database schema migration...');

  const db = new sqlite3.Database(dbPath);

  let tablesCreated = 0;
  let indexesCreated = 0;
  let foreignKeysCreated = 0;

  try {
    db.exec('PRAGMA foreign_keys = ON');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        first_name_en TEXT NOT NULL,
        first_name_ar TEXT NOT NULL,
        last_name_en TEXT,
        last_name_ar TEXT,
        date_of_birth TEXT,
        gender TEXT NOT NULL,
        gender_ar TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address_en TEXT,
        address_ar TEXT,
        city_en TEXT,
        city_ar TEXT,
        country_en TEXT DEFAULT 'Yemen',
        country_ar TEXT DEFAULT 'اليمن',
        national_id TEXT,
        medical_record_number TEXT,
        blood_type TEXT,
        blood_type_ar TEXT,
        height_cm REAL,
        weight_kg REAL,
        bmi REAL,
        bmi_category TEXT,
        bmi_category_ar TEXT,
        has_diabetes BOOLEAN DEFAULT FALSE,
        has_hypertension BOOLEAN DEFAULT FALSE,
        has_obesity BOOLEAN DEFAULT FALSE,
        has_ckd BOOLEAN DEFAULT FALSE,
        has_cardiovascular BOOLEAN DEFAULT FALSE,
        has_malnutrition BOOLEAN DEFAULT FALSE,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    tablesCreated++;
    console.log('\u2705 patients table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS vitals_records (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        record_date TEXT NOT NULL,
        heart_rate REAL,
        bp_systolic REAL,
        bp_diastolic REAL,
        rr REAL,
        temperature REAL,
        o2_sat REAL,
        weight_kg REAL,
        height_cm REAL,
        bmi REAL,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
    `);
    tablesCreated++;
    foreignKeysCreated++;
    console.log('\u2705 vitals_records table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS nutritional_plans (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        plan_name_en TEXT NOT NULL,
        plan_name_ar TEXT NOT NULL,
        energy_kcal REAL NOT NULL,
        protein_g REAL NOT NULL,
        protein_percent REAL,
        carbs_g REAL NOT NULL,
        carbs_percent REAL,
        fat_g REAL NOT NULL,
        fat_percent REAL,
        fiber_g REAL,
        sodium_mg REAL,
        potassium_mg REAL,
        phosphorus_mg REAL,
        calcium_mg REAL,
        magnesium_mg REAL,
        iron_mg REAL,
        zinc_mg REAL,
        fluid_ml REAL,
        route TEXT,
        route_ar TEXT,
        feeding_method TEXT,
        feeding_method_ar TEXT,
        formula_name_en TEXT,
        formula_name_ar TEXT,
        rate_ml_per_hour REAL,
        total_volume_ml REAL,
        duration_hours REAL,
        frequency TEXT,
        frequency_ar TEXT,
        start_date TEXT,
        end_date TEXT,
        status TEXT DEFAULT 'active',
        status_ar TEXT DEFAULT '\u0646\u0634\u0637',
        notes_en TEXT,
        notes_ar TEXT,
        nutriscore REAL,
        malnutrition_severity TEXT,
        malnutrition_severity_ar TEXT,
        refeeding_risk BOOLEAN DEFAULT FALSE,
        refeeding_risk_score REAL,
        refeeding_protocol TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
    `);
    tablesCreated++;
    foreignKeysCreated++;
    console.log('\u2705 nutritional_plans table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS pediatric_growth_charts (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        record_date TEXT NOT NULL,
        age_months REAL NOT NULL,
        weight_kg REAL NOT NULL,
        height_cm REAL NOT NULL,
        head_circumference_cm REAL,
        weight_z_score REAL,
        height_z_score REAL,
        weight_for_height_z REAL,
        bmi_z_score REAL,
        head_circumference_z REAL,
        who_percentile REAL,
        chart_type TEXT,
        gender TEXT,
        notes_en TEXT,
        notes_ar TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
    `);
    tablesCreated++;
    foreignKeysCreated++;
    console.log('\u2705 pediatric_growth_charts table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS pediatric_malnutrition_criteria (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        assessment_date TEXT NOT NULL,
        weight_kg REAL NOT NULL,
        height_cm REAL NOT NULL,
        weight_for_height_z REAL,
        bmi_z_score REAL,
        mid_upper_arm_circumference REAL,
        muscle_wasting TEXT,
        muscle_wasting_ar TEXT,
        growth_faltered BOOLEAN DEFAULT FALSE,
        weight_loss_percent REAL,
        inadequate_intake BOOLEAN DEFAULT FALSE,
        edema BOOLEAN DEFAULT FALSE,
        malnutrition_severity TEXT,
        malnutrition_severity_ar TEXT,
        notes_en TEXT,
        notes_ar TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
    `);
    tablesCreated++;
    foreignKeysCreated++;
    console.log('\u2705 pediatric_malnutrition_criteria table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS stamp_pediatric_screenings (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        screening_date TEXT NOT NULL,
        nutritional_risk_score REAL NOT NULL,
        diagnosis_category TEXT,
        nutritional_intake_score REAL,
        weight_loss_score REAL,
        bmi_percentile REAL,
        total_score REAL,
        risk_level TEXT,
        risk_level_ar TEXT,
        recommended_action TEXT,
        recommended_action_ar TEXT,
        notes_en TEXT,
        notes_ar TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
    `);
    tablesCreated++;
    foreignKeysCreated++;
    console.log('\u2705 stamp_pediatric_screenings table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS icu_admissions (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        full_name TEXT,
        full_name_ar TEXT,
        age REAL,
        gender TEXT,
        weight_kg REAL,
        height_cm REAL,
        bmi REAL,
        mrn TEXT,
        admission_date TEXT,
        admission_source TEXT,
        icu_type TEXT,
        primary_diagnosis TEXT,
        primary_diagnosis_ar TEXT,
        secondary_diagnoses TEXT,
        secondary_diagnoses_ar TEXT,
        apache_ii_score REAL,
        gcs REAL,
        severity_level TEXT,
        heart_rate REAL,
        bp_systolic REAL,
        bp_diastolic REAL,
        respiratory_rate REAL,
        temperature REAL,
        o2_sat REAL,
        oxygen_therapy TEXT,
        ventilator_type TEXT,
        pre_admission_weight_kg REAL,
        weight_change_kg REAL,
        weight_change_percent REAL,
        appetite_before_admission TEXT,
        eating_difficulty TEXT,
        npo_status BOOLEAN DEFAULT FALSE,
        npo_duration TEXT,
        previous_nutrition_support TEXT,
        has_diabetes BOOLEAN DEFAULT FALSE,
        diabetes_type TEXT,
        has_cardiovascular BOOLEAN DEFAULT FALSE,
        has_kidney BOOLEAN DEFAULT FALSE,
        kidney_stage TEXT,
        has_liver BOOLEAN DEFAULT FALSE,
        has_lung BOOLEAN DEFAULT FALSE,
        has_gi BOOLEAN DEFAULT FALSE,
        has_cancer BOOLEAN DEFAULT FALSE,
        cancer_stage TEXT,
        allergies TEXT,
        allergies_ar TEXT,
        previous_surgeries TEXT,
        medications TEXT,
        hemoglobin REAL,
        wbc REAL,
        platelets REAL,
        creatinine REAL,
        bun REAL,
        egfr REAL,
        sodium REAL,
        potassium REAL,
        chloride REAL,
        glucose REAL,
        hba1c REAL,
        total_protein REAL,
        albumin REAL,
        total_bilirubin REAL,
        alt REAL,
        ast REAL,
        triglycerides REAL,
        cholesterol REAL,
        stamp_score REAL,
        malnutrition_risk TEXT,
        nutrition_concern BOOLEAN DEFAULT FALSE,
        admission_reason TEXT,
        special_concerns TEXT,
        physician_notes TEXT,
        dietitian_notes TEXT,
        nutrition_consent BOOLEAN DEFAULT FALSE,
        guardian_consent BOOLEAN DEFAULT FALSE,
        signed_by TEXT,
        consent_date TEXT,
        created_by TEXT,
        is_transferred_to_icu BOOLEAN DEFAULT FALSE,
        transferred_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
    `);
    tablesCreated++;
    foreignKeysCreated++;
    console.log('\u2705 icu_admissions table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS icu_patient_records (
        id TEXT PRIMARY KEY,
        icu_admission_id TEXT NOT NULL,
        record_date TEXT NOT NULL,
        weight_kg REAL,
        bmi REAL,
        heart_rate REAL,
        bp_systolic REAL,
        bp_diastolic REAL,
        respiratory_rate REAL,
        temperature REAL,
        o2_sat REAL,
        gcs REAL,
        urine_output_ml REAL,
        fluid_balance_ml REAL,
        sedation_level TEXT,
        lab_values_json TEXT,
        notes_en TEXT,
        notes_ar TEXT,
        current_heart_rate REAL,
        current_bp_systolic REAL,
        current_bp_diastolic REAL,
        current_rr REAL,
        current_temperature REAL,
        current_o2_sat REAL,
        current_weight REAL,
        fluid_intake_ml REAL,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (icu_admission_id) REFERENCES icu_admissions(id) ON DELETE CASCADE
      );
    `);
    tablesCreated++;
    foreignKeysCreated++;
    console.log('\u2705 icu_patient_records table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS icu_nutrition_assessments (
        id TEXT PRIMARY KEY,
        icu_admission_id TEXT NOT NULL,
        assessment_date TEXT NOT NULL,
        assessed_by TEXT,
        energy_requirement_kcal REAL,
        protein_requirement_g REAL,
        route TEXT,
        route_ar TEXT,
        nutrition_risk_score REAL,
        nrs_2002_score REAL,
        nutric_score REAL,
        malnutrition_diagnosis TEXT,
        malnutrition_diagnosis_ar TEXT,
        recommendations TEXT,
        recommendations_ar TEXT,
        energy_kcal REAL,
        protein_g REAL,
        protein_g_per_kg REAL,
        fluid_ml REAL,
        carbs_g REAL,
        carbs_percent REAL,
        fat_g REAL,
        fat_percent REAL,
        fiber_g REAL,
        stress_factor REAL,
        stress_level TEXT,
        ventilation_status TEXT,
        burn_status BOOLEAN DEFAULT FALSE,
        burn_percent REAL,
        trauma_status BOOLEAN DEFAULT FALSE,
        kidney_status TEXT,
        liver_status TEXT,
        diabetes_status TEXT,
        assessed_at TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (icu_admission_id) REFERENCES icu_admissions(id) ON DELETE CASCADE
      );
    `);
    tablesCreated++;
    foreignKeysCreated++;
    console.log('\u2705 icu_nutrition_assessments table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS icu_prescriptions (
        id TEXT PRIMARY KEY,
        icu_admission_id TEXT NOT NULL,
        icu_nutrition_assessment_id TEXT,
        prescription_date TEXT NOT NULL,
        prescribed_by TEXT,
        type TEXT,
        formula_name TEXT,
        formula_name_ar TEXT,
        volume_ml REAL,
        rate_ml_hr REAL,
        calories_kcal REAL,
        protein_g REAL,
        carbs_g REAL,
        fat_g REAL,
        fiber_g REAL,
        electrolytes_json TEXT,
        additives_json TEXT,
        status TEXT DEFAULT 'active',
        start_time TEXT,
        end_time TEXT,
        reason TEXT,
        route TEXT,
        route_ar TEXT,
        feeding_method TEXT,
        feeding_method_ar TEXT,
        formula_id TEXT,
        total_volume_ml REAL,
        duration_hours REAL,
        frequency TEXT,
        frequency_ar TEXT,
        tube_type TEXT,
        tube_type_ar TEXT,
        tube_length REAL,
        ppn_or_tpn TEXT,
        ppn_or_tpn_ar TEXT,
        central_access BOOLEAN DEFAULT FALSE,
        infusion_device TEXT,
        calories_override REAL,
        protein_override REAL,
        fluid_override REAL,
        is_override BOOLEAN DEFAULT FALSE,
        instructions TEXT,
        instructions_ar TEXT,
        slow_start BOOLEAN DEFAULT FALSE,
        slow_start_rate REAL,
        advance_plan TEXT,
        advance_plan_ar TEXT,
        paused_at TEXT,
        paused_reason TEXT,
        paused_reason_ar TEXT,
        prescribed_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (icu_admission_id) REFERENCES icu_admissions(id) ON DELETE CASCADE,
        FOREIGN KEY (icu_nutrition_assessment_id) REFERENCES icu_nutrition_assessments(id) ON DELETE SET NULL
      );
    `);
    tablesCreated++;
    foreignKeysCreated += 2;
    console.log('\u2705 icu_prescriptions table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS icu_formulas (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        type TEXT NOT NULL,
        type_ar TEXT NOT NULL,
        manufacturer TEXT,
        calories_per_ml REAL NOT NULL,
        protein_per_ml REAL NOT NULL,
        carbs_per_ml REAL,
        fat_per_ml REAL,
        fiber_per_100ml REAL,
        osmolality REAL,
        indications TEXT,
        indications_ar TEXT,
        contraindications TEXT,
        contraindications_ar TEXT,
        brand TEXT,
        energy_kcal_per_ml REAL,
        protein_g_per_ml REAL,
        carbs_g_per_ml REAL,
        fat_g_per_ml REAL,
        fiber_g_per_ml REAL,
        protein_percent REAL,
        carbs_percent REAL,
        fat_percent REAL,
        sodium_mg REAL,
        potassium_mg REAL,
        phosphorus_mg REAL,
        calcium_mg REAL,
        magnesium_mg REAL,
        iron_mg REAL,
        zinc_mg REAL,
        fluid_ml_per_ml REAL,
        volume_ml REAL,
        route TEXT,
        route_ar TEXT,
        ph REAL,
        viscosity TEXT,
        storage TEXT,
        storage_ar TEXT,
        side_effects TEXT,
        side_effects_ar TEXT,
        price_sar REAL,
        price_usd REAL,
        price_yer REAL,
        notes_en TEXT,
        notes_ar TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    tablesCreated++;
    console.log('\u2705 icu_formulas table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS icu_monitorings (
        id TEXT PRIMARY KEY,
        icu_admission_id TEXT NOT NULL,
        icu_patient_record_id TEXT,
        monitoring_date TEXT NOT NULL,
        actual_calories_kcal REAL,
        actual_protein_g REAL,
        actual_carbs_g REAL,
        actual_fat_g REAL,
        actual_fluid_ml REAL,
        tube_feeding_volume_ml REAL,
        tolerance_issues TEXT,
        tolerance_issues_ar TEXT,
        gastric_residual_ml REAL,
        vomiting BOOLEAN DEFAULT FALSE,
        diarrhea BOOLEAN DEFAULT FALSE,
        constipation BOOLEAN DEFAULT FALSE,
        abdominal_distension BOOLEAN DEFAULT FALSE,
        labs_json TEXT,
        glucose REAL,
        glucose_target_min REAL,
        glucose_target_max REAL,
        is_glucose_high BOOLEAN DEFAULT FALSE,
        is_glucose_low BOOLEAN DEFAULT FALSE,
        glucose_trend TEXT,
        ketones REAL,
        triglycerides REAL,
        cholesterol REAL,
        total_protein REAL,
        albumin REAL,
        creatinine REAL,
        bun REAL,
        egfr REAL,
        sodium REAL,
        potassium REAL,
        chloride REAL,
        phosphorus REAL,
        magnesium REAL,
        urine_output_ml REAL,
        fluid_intake_ml REAL,
        fluid_balance_ml REAL,
        current_weight REAL,
        weight_change REAL,
        weight_change_percent REAL,
        heart_rate REAL,
        bp_systolic REAL,
        bp_diastolic REAL,
        rr REAL,
        temperature REAL,
        o2_sat REAL,
        nutrition_intake_ml REAL,
        nutrition_goal_ml REAL,
        nutrition_percent REAL,
        tolerance TEXT,
        tolerance_ar TEXT,
        complications TEXT,
        complications_ar TEXT,
        monitored_by TEXT,
        recorded_by TEXT,
        recorded_at TEXT,
        notes_en TEXT,
        notes_ar TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (icu_admission_id) REFERENCES icu_admissions(id) ON DELETE CASCADE,
        FOREIGN KEY (icu_patient_record_id) REFERENCES icu_patient_records(id) ON DELETE SET NULL
      );
    `);
    tablesCreated++;
    foreignKeysCreated += 2;
    console.log('\u2705 icu_monitorings table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS icu_complications (
        id TEXT PRIMARY KEY,
        icu_admission_id TEXT NOT NULL,
        icu_patient_record_id TEXT,
        complication_date TEXT NOT NULL,
        complication_type TEXT NOT NULL,
        complication_type_ar TEXT NOT NULL,
        severity TEXT NOT NULL,
        severity_ar TEXT NOT NULL,
        category TEXT,
        category_ar TEXT,
        cause TEXT,
        cause_ar TEXT,
        risk_factors TEXT,
        risk_factors_ar TEXT,
        onset_time TEXT,
        duration TEXT,
        symptoms TEXT,
        symptoms_ar TEXT,
        medication TEXT,
        medication_ar TEXT,
        nutrition_change TEXT,
        nutrition_change_ar TEXT,
        protocol_used TEXT,
        protocol_used_ar TEXT,
        outcome TEXT,
        outcome_ar TEXT,
        description_en TEXT,
        description_ar TEXT,
        diagnosis_en TEXT,
        diagnosis_ar TEXT,
        treatment_en TEXT,
        treatment_ar TEXT,
        action_taken TEXT,
        action_taken_ar TEXT,
        resolved BOOLEAN DEFAULT FALSE,
        resolved_at TEXT,
        resolved_date TEXT,
        reported_by TEXT,
        reported_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (icu_admission_id) REFERENCES icu_admissions(id) ON DELETE CASCADE,
        FOREIGN KEY (icu_patient_record_id) REFERENCES icu_patient_records(id) ON DELETE SET NULL
      );
    `);
    tablesCreated++;
    foreignKeysCreated += 2;
    console.log('\u2705 icu_complications table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS icu_transitions (
        id TEXT PRIMARY KEY,
        icu_admission_id TEXT NOT NULL,
        icu_patient_record_id TEXT,
        transition_date TEXT NOT NULL,
        transition_type TEXT,
        transition_type_ar TEXT,
        from_location TEXT NOT NULL,
        from_location_ar TEXT NOT NULL,
        to_location TEXT NOT NULL,
        to_location_ar TEXT NOT NULL,
        from_type TEXT,
        to_type TEXT,
        reason TEXT,
        reason_ar TEXT,
        tolerance TEXT,
        tolerance_ar TEXT,
        transition_reason_en TEXT,
        transition_reason_ar TEXT,
        nutrition_status TEXT,
        nutrition_status_ar TEXT,
        weight REAL,
        energy_kcal REAL,
        protein_g REAL,
        fluid_ml REAL,
        diet_type TEXT,
        diet_type_ar TEXT,
        discharge_outcome TEXT,
        discharge_outcome_ar TEXT,
        follow_up_required BOOLEAN DEFAULT FALSE,
        follow_up_date TEXT,
        follow_up_plan TEXT,
        follow_up_plan_ar TEXT,
        home_instructions TEXT,
        home_instructions_ar TEXT,
        meal_preparation TEXT,
        meal_preparation_ar TEXT,
        food_shopping TEXT,
        food_shopping_ar TEXT,
        warning_signs TEXT,
        warning_signs_ar TEXT,
        emergency_contact TEXT,
        follow_up_notes_en TEXT,
        follow_up_notes_ar TEXT,
        transitioned_by TEXT,
        transitioned_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (icu_admission_id) REFERENCES icu_admissions(id) ON DELETE CASCADE,
        FOREIGN KEY (icu_patient_record_id) REFERENCES icu_patient_records(id) ON DELETE SET NULL
      );
    `);
    tablesCreated++;
    foreignKeysCreated += 2;
    console.log('\u2705 icu_transitions table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS nutrition_templates (
        id TEXT PRIMARY KEY,
        name_en TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        category TEXT NOT NULL,
        category_ar TEXT NOT NULL,
        energy_kcal REAL NOT NULL,
        protein_g REAL NOT NULL,
        carbs_g REAL NOT NULL,
        fat_g REAL NOT NULL,
        fiber_g REAL,
        sodium_mg REAL,
        potassium_mg REAL,
        phosphorus_mg REAL,
        calcium_mg REAL,
        magnesium_mg REAL,
        iron_mg REAL,
        zinc_mg REAL,
        fluid_ml REAL,
        description_en TEXT,
        description_ar TEXT,
        indications TEXT,
        indications_ar TEXT,
        contraindications TEXT,
        contraindications_ar TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    tablesCreated++;
    console.log('\u2705 nutrition_templates table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS foods (
        id TEXT PRIMARY KEY,
        name_en TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        category TEXT NOT NULL,
        calories REAL NOT NULL,
        protein REAL NOT NULL,
        carbs REAL NOT NULL,
        fat REAL NOT NULL,
        fiber REAL,
        sodium REAL,
        potassium REAL,
        phosphorus REAL,
        calcium REAL,
        magnesium REAL,
        iron REAL,
        zinc REAL,
        serving_size_g REAL,
        serving_unit TEXT,
        serving_unit_ar TEXT,
        image_url TEXT,
        thumbnail_url TEXT,
        thumbnail_small_url TEXT,
        source TEXT,
        source_ar TEXT,
        notes_en TEXT,
        notes_ar TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    tablesCreated++;
    console.log('\u2705 foods table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS food_contraindication_filters (
        id TEXT PRIMARY KEY,
        food_id TEXT NOT NULL,
        condition TEXT NOT NULL,
        condition_ar TEXT NOT NULL,
        contraindication_type TEXT NOT NULL,
        contraindication_type_ar TEXT NOT NULL,
        severity TEXT NOT NULL,
        severity_ar TEXT NOT NULL,
        message_en TEXT NOT NULL,
        message_ar TEXT NOT NULL,
        notes_en TEXT,
        notes_ar TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
      );
    `);
    tablesCreated++;
    foreignKeysCreated++;
    console.log('\u2705 food_contraindication_filters table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        name_en TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        category TEXT NOT NULL,
        calories REAL NOT NULL,
        protein REAL NOT NULL,
        carbs REAL NOT NULL,
        fat REAL NOT NULL,
        fiber REAL,
        servings INTEGER NOT NULL,
        prep_time_minutes INTEGER,
        cook_time_minutes INTEGER,
        ingredients TEXT NOT NULL,
        instructions TEXT NOT NULL,
        image_url TEXT,
        thumbnail_url TEXT,
        thumbnail_small_url TEXT,
        source TEXT,
        source_ar TEXT,
        notes_en TEXT,
        notes_ar TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    tablesCreated++;
    console.log('\u2705 recipes table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS clinical_guidelines (
        id TEXT PRIMARY KEY,
        title_en TEXT NOT NULL,
        title_ar TEXT NOT NULL,
        category TEXT NOT NULL,
        condition TEXT NOT NULL,
        condition_ar TEXT NOT NULL,
        recommendations TEXT NOT NULL,
        recommendations_ar TEXT NOT NULL,
        evidence_level TEXT,
        source TEXT,
        published_date TEXT,
        notes_en TEXT,
        notes_ar TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    tablesCreated++;
    console.log('\u2705 clinical_guidelines table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS clinical_alerts (
        id TEXT PRIMARY KEY,
        title_en TEXT NOT NULL,
        title_ar TEXT NOT NULL,
        severity TEXT NOT NULL,
        severity_ar TEXT NOT NULL,
        condition TEXT NOT NULL,
        condition_ar TEXT NOT NULL,
        message TEXT NOT NULL,
        message_ar TEXT NOT NULL,
        action TEXT NOT NULL,
        action_ar TEXT NOT NULL,
        notes_en TEXT,
        notes_ar TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    tablesCreated++;
    console.log('\u2705 clinical_alerts table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS clinical_recommendations (
        id TEXT PRIMARY KEY,
        title_en TEXT NOT NULL,
        title_ar TEXT NOT NULL,
        condition TEXT NOT NULL,
        condition_ar TEXT NOT NULL,
        recommendation TEXT NOT NULL,
        recommendation_ar TEXT NOT NULL,
        priority TEXT NOT NULL,
        priority_ar TEXT NOT NULL,
        notes_en TEXT,
        notes_ar TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    tablesCreated++;
    console.log('\u2705 clinical_recommendations table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS patient_food_logs (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        log_date TEXT NOT NULL,
        food_name_en TEXT NOT NULL,
        food_name_ar TEXT NOT NULL,
        food_id TEXT,
        amount REAL NOT NULL,
        unit TEXT NOT NULL,
        unit_ar TEXT NOT NULL,
        calories REAL,
        protein REAL,
        carbs REAL,
        fat REAL,
        fiber REAL,
        sodium REAL,
        potassium REAL,
        meal_type TEXT,
        meal_type_ar TEXT,
        notes_en TEXT,
        notes_ar TEXT,
        logged_by TEXT,
        logged_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE SET NULL
      );
    `);
    tablesCreated++;
    foreignKeysCreated += 2;
    console.log('\u2705 patient_food_logs table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS patient_glucose_logs (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        log_date TEXT NOT NULL,
        glucose_mg_dl REAL NOT NULL,
        measurement_time TEXT,
        measurement_type TEXT,
        measurement_type_ar TEXT,
        before_meal BOOLEAN DEFAULT FALSE,
        meal_type TEXT,
        meal_type_ar TEXT,
        notes_en TEXT,
        notes_ar TEXT,
        logged_by TEXT,
        logged_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
    `);
    tablesCreated++;
    foreignKeysCreated++;
    console.log('\u2705 patient_glucose_logs table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS patient_weight_logs (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        log_date TEXT NOT NULL,
        weight_kg REAL NOT NULL,
        measurement_time TEXT,
        bmi REAL,
        bmi_category TEXT,
        bmi_category_ar TEXT,
        notes_en TEXT,
        notes_ar TEXT,
        logged_by TEXT,
        logged_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
    `);
    tablesCreated++;
    foreignKeysCreated++;
    console.log('\u2705 patient_weight_logs table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS patient_medication_logs (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        medication_name_en TEXT NOT NULL,
        medication_name_ar TEXT NOT NULL,
        log_date TEXT NOT NULL,
        dosage REAL NOT NULL,
        unit TEXT NOT NULL,
        frequency TEXT,
        frequency_ar TEXT,
        taken BOOLEAN DEFAULT FALSE,
        taken_at TEXT,
        notes_en TEXT,
        notes_ar TEXT,
        logged_by TEXT,
        logged_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
    `);
    tablesCreated++;
    foreignKeysCreated++;
    console.log('\u2705 patient_medication_logs table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS patient_appointments (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        appointment_date TEXT NOT NULL,
        appointment_time TEXT NOT NULL,
        provider_name_en TEXT NOT NULL,
        provider_name_ar TEXT NOT NULL,
        provider_type TEXT,
        provider_type_ar TEXT,
        location_en TEXT,
        location_ar TEXT,
        appointment_type TEXT,
        appointment_type_ar TEXT,
        status TEXT DEFAULT 'pending',
        status_ar TEXT DEFAULT '\u0645\u0639\u0644\u0642',
        notes_en TEXT,
        notes_ar TEXT,
        confirmed BOOLEAN DEFAULT FALSE,
        confirmed_at TEXT,
        cancelled BOOLEAN DEFAULT FALSE,
        cancelled_at TEXT,
        cancelled_reason_en TEXT,
        cancelled_reason_ar TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
    `);
    tablesCreated++;
    foreignKeysCreated++;
    console.log('\u2705 patient_appointments table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS patient_education_content (
        id TEXT PRIMARY KEY,
        patient_id TEXT,
        title_en TEXT NOT NULL,
        title_ar TEXT NOT NULL,
        category TEXT NOT NULL,
        category_ar TEXT NOT NULL,
        content_type TEXT NOT NULL,
        content_type_ar TEXT NOT NULL,
        content_en TEXT NOT NULL,
        content_ar TEXT NOT NULL,
        image_url TEXT,
        video_url TEXT,
        duration_minutes INTEGER,
        tags TEXT,
        tags_ar TEXT,
        level TEXT,
        level_ar TEXT,
        viewed BOOLEAN DEFAULT FALSE,
        viewed_at TEXT,
        completed BOOLEAN DEFAULT FALSE,
        completed_at TEXT,
        notes_en TEXT,
        notes_ar TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
    `);
    tablesCreated++;
    foreignKeysCreated++;
    console.log('\u2705 patient_education_content table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS fhir_nutrition_orders (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        fhir_id TEXT,
        status TEXT NOT NULL,
        status_ar TEXT NOT NULL,
        route TEXT,
        route_ar TEXT,
        feeding_method TEXT,
        feeding_method_ar TEXT,
        formula_name_en TEXT,
        formula_name_ar TEXT,
        rate_ml_per_hour REAL,
        total_volume_ml REAL,
        duration_hours REAL,
        start_date TEXT,
        end_date TEXT,
        instructions_en TEXT,
        instructions_ar TEXT,
        notes_en TEXT,
        notes_ar TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
    `);
    tablesCreated++;
    foreignKeysCreated++;
    console.log('\u2705 fhir_nutrition_orders table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS fhir_nutrition_statuses (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        fhir_id TEXT,
        status TEXT NOT NULL,
        status_ar TEXT NOT NULL,
        assessment_date TEXT NOT NULL,
        energy_kcal REAL,
        protein_g REAL,
        carbs_g REAL,
        fat_g REAL,
        fiber_g REAL,
        sodium_mg REAL,
        potassium_mg REAL,
        fluid_ml REAL,
        nutriscore REAL,
        malnutrition_severity TEXT,
        malnutrition_severity_ar TEXT,
        refeeding_risk BOOLEAN DEFAULT FALSE,
        notes_en TEXT,
        notes_ar TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
    `);
    tablesCreated++;
    foreignKeysCreated++;
    console.log('\u2705 fhir_nutrition_statuses table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS cgm_data (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        device_id TEXT,
        measurement_time TEXT NOT NULL,
        glucose_mg_dl REAL NOT NULL,
        glucose_mmol_l REAL,
        trend TEXT,
        trend_ar TEXT,
        low_alarm BOOLEAN DEFAULT FALSE,
        high_alarm BOOLEAN DEFAULT FALSE,
        notes_en TEXT,
        notes_ar TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
    `);
    tablesCreated++;
    foreignKeysCreated++;
    console.log('\u2705 cgm_data table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS wearable_data (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        device_id TEXT,
        device_type TEXT,
        device_type_ar TEXT,
        measurement_time TEXT NOT NULL,
        heart_rate REAL,
        steps INTEGER,
        calories_burned REAL,
        distance_km REAL,
        active_minutes INTEGER,
        sleep_duration_minutes INTEGER,
        sleep_quality TEXT,
        sleep_quality_ar TEXT,
        spo2 REAL,
        temperature REAL,
        notes_en TEXT,
        notes_ar TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
    `);
    tablesCreated++;
    foreignKeysCreated++;
    console.log('\u2705 wearable_data table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS smart_scale_data (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        device_id TEXT,
        measurement_time TEXT NOT NULL,
        weight_kg REAL NOT NULL,
        bmi REAL,
        body_fat_percent REAL,
        muscle_percent REAL,
        water_percent REAL,
        bone_percent REAL,
        protein_percent REAL,
        notes_en TEXT,
        notes_ar TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
    `);
    tablesCreated++;
    foreignKeysCreated++;
    console.log('\u2705 smart_scale_data table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS genetic_profiles (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        test_date TEXT,
        test_lab TEXT,
        test_lab_ar TEXT,
        gene_variations TEXT,
        gene_variations_ar TEXT,
        nutrition_sensitivities TEXT,
        nutrition_sensitivities_ar TEXT,
        food_allergies TEXT,
        food_allergies_ar TEXT,
        metabolic_traits TEXT,
        metabolic_traits_ar TEXT,
        recommendations_en TEXT,
        recommendations_ar TEXT,
        notes_en TEXT,
        notes_ar TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
    `);
    tablesCreated++;
    foreignKeysCreated++;
    console.log('\u2705 genetic_profiles table created');

    console.log('Creating indexes for performance...');

    await db.exec(`CREATE INDEX IF NOT EXISTS idx_patients_dob ON patients(date_of_birth)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_patients_gender ON patients(gender)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_patients_conditions ON patients(has_diabetes, has_hypertension, has_obesity)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_vitals_patient_id ON vitals_records(patient_id)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_vitals_record_date ON vitals_records(record_date)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_nutritional_plans_patient_id ON nutritional_plans(patient_id)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_pediatric_growth_patient_id ON pediatric_growth_charts(patient_id)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_pediatric_malnutrition_patient_id ON pediatric_malnutrition_criteria(patient_id)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_stamp_screening_patient_id ON stamp_pediatric_screenings(patient_id)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_icu_admissions_patient_id ON icu_admissions(patient_id)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_icu_admissions_date ON icu_admissions(admission_date)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_icu_patient_records_admission_id ON icu_patient_records(icu_admission_id)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_icu_nutrition_assessments_admission_id ON icu_nutrition_assessments(icu_admission_id)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_icu_prescriptions_admission_id ON icu_prescriptions(icu_admission_id)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_icu_monitorings_admission_id ON icu_monitorings(icu_admission_id)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_icu_complications_admission_id ON icu_complications(icu_admission_id)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_icu_transitions_admission_id ON icu_transitions(icu_admission_id)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_foods_calories ON foods(calories)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_guidelines_condition ON clinical_guidelines(condition)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_alerts_condition ON clinical_alerts(condition)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_recommendations_condition ON clinical_recommendations(condition)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_patient_food_logs_patient_id ON patient_food_logs(patient_id)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_patient_food_logs_date ON patient_food_logs(log_date)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_patient_glucose_logs_patient_id ON patient_glucose_logs(patient_id)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_patient_weight_logs_patient_id ON patient_weight_logs(patient_id)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_fhir_nutrition_orders_patient_id ON fhir_nutrition_orders(patient_id)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_cgm_data_patient_id ON cgm_data(patient_id)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_wearable_data_patient_id ON wearable_data(patient_id)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_smart_scale_data_patient_id ON smart_scale_data(patient_id)`);
    indexesCreated++;
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_genetic_profiles_patient_id ON genetic_profiles(patient_id)`);
    indexesCreated++;

    console.log(`\u2705 Created ${indexesCreated} indexes`);
    console.log(`\u2705 Migration complete! Tables: ${tablesCreated}, Indexes: ${indexesCreated}, Foreign Keys: ${foreignKeysCreated}`);

    return {
      tablesCreated,
      indexesCreated,
      foreignKeysCreated,
    };
  } catch (error) {
    console.error('\u274C Migration failed:', error);
    throw error;
  } finally {
    db.close();
  }
}

const isMainModule = process.argv[1]?.includes('migrateSchema');
if (isMainModule) {
  const dbPath = process.argv[2] || './database/adcn.db';
  migrateSchema(dbPath)
    .then((result) => {
      console.log(`Migration successful: ${result.tablesCreated} tables, ${result.indexesCreated} indexes, ${result.foreignKeysCreated} foreign keys`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
