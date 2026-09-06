/* ============================================
   NUTRICENSE - Mock Data & Data Models
   Simulated sensor/AI data for the dashboard
   ============================================ */

const NutriCenseMockData = (() => {

    // ─── Constants & Thresholds ───
    const DEFAULTS = {
        tempSafeMin: 60,        // °C – HACCP hot holding minimum
        tempSafeMax: 74,        // °C – typical hot food range
        phSafeMin: 4.0,
        phSafeMax: 8.0,
        gasSpoilThreshold: 600, // ppb TVOC
        humidityMin: 40,
        humidityMax: 65,
    };

    // ─── School Menu Database ───
    const SCHOOL_MENUS = [
        {
            name: 'Rice, Crispy Chicken, Stir-Fry Broccoli',
            items: ['Rice (Steamed)', 'Fried Chicken', 'Sautéd Veggies'],
            portionWeight: 380,
            calories: 542,
            carbs: 68,
            protein: 24,
            fats: 14,
            nutriScore: 92,
            nutriGrade: 'A',
            micronutrients: ['High Fiber', 'Vit D', 'Calcium Fortified'],
        },
        {
            name: 'Spaghetti Bolognese, Garden Salad, Banana',
            items: ['Spaghetti', 'Beef Sauce', 'Lettuce Salad'],
            portionWeight: 420,
            calories: 618,
            carbs: 74,
            protein: 28,
            fats: 18,
            nutriScore: 85,
            nutriGrade: 'B',
            micronutrients: ['Iron', 'Vit C', 'Folate'],
        },
        {
            name: 'Grilled Fish Fillet, Mashed Potato, Corn',
            items: ['Grilled Tilapia', 'Mashed Potato', 'Sweet Corn'],
            portionWeight: 360,
            calories: 485,
            carbs: 52,
            protein: 32,
            fats: 12,
            nutriScore: 95,
            nutriGrade: 'A',
            micronutrients: ['Omega-3', 'Vit B12', 'Potassium'],
        },
        {
            name: 'Chicken Curry, Jasmine Rice, Papaya',
            items: ['Chicken Curry', 'Jasmine Rice', 'Papaya Slice'],
            portionWeight: 400,
            calories: 580,
            carbs: 72,
            protein: 26,
            fats: 16,
            nutriScore: 88,
            nutriGrade: 'B',
            micronutrients: ['Vit A', 'Zinc', 'High Fiber'],
        },
        {
            name: 'Beef Rendang, Brown Rice, Tempeh',
            items: ['Beef Rendang', 'Brown Rice', 'Fried Tempeh'],
            portionWeight: 390,
            calories: 610,
            carbs: 60,
            protein: 30,
            fats: 22,
            nutriScore: 82,
            nutriGrade: 'B',
            micronutrients: ['Iron', 'Protein+', 'Vit B6'],
        },
    ];

    // ─── Utility: Random in Range ───
    function rand(min, max, decimals = 1) {
        const val = Math.random() * (max - min) + min;
        return parseFloat(val.toFixed(decimals));
    }

    // ─── Utility: Random jitter from a base value ───
    function jitter(base, range, decimals = 1) {
        return parseFloat((base + (Math.random() - 0.5) * 2 * range).toFixed(decimals));
    }

    // ─── Generate a single sensor reading snapshot ───
    function generateSensorSnapshot(prevSnapshot) {
        const base = prevSnapshot || {
            temperature: 63.0,
            ph: 6.8,
            gas: 120,
            humidity: 54,
        };

        return {
            temperature: clamp(jitter(base.temperature, 0.5, 1), 20, 100),
            ph: clamp(jitter(base.ph, 0.08, 2), 2, 14),
            gas: clamp(Math.round(jitter(base.gas, 8, 0)), 0, 2000),
            humidity: clamp(Math.round(jitter(base.humidity, 1.5, 0)), 10, 99),
            timestamp: new Date(),
        };
    }

    function clamp(val, min, max) {
        return Math.min(max, Math.max(min, val));
    }

    // ─── Evaluate safety of sensor readings ───
    function evaluateSafety(snapshot, thresholds) {
        const t = thresholds || DEFAULTS;
        const issues = [];

        // Temperature check
        let tempStatus = 'safe';
        if (snapshot.temperature < t.tempSafeMin) {
            tempStatus = 'danger';
            issues.push({
                sensor: 'Thermal Serving Target',
                level: 'danger',
                message: `Serving temperature (${snapshot.temperature}°C) has dropped below safe minimum of ${t.tempSafeMin}°C. Risk of bacterial growth.`,
            });
        } else if (snapshot.temperature >= t.tempSafeMin && snapshot.temperature < t.tempSafeMin + 3) {
            tempStatus = 'warning';
            issues.push({
                sensor: 'Thermal Serving Target',
                level: 'warning',
                message: `Serving temperature (${snapshot.temperature}°C) is near the lower safe threshold of ${t.tempSafeMin}°C.`,
            });
        }

        // pH check
        let phStatus = 'safe';
        if (snapshot.ph < t.phSafeMin || snapshot.ph > t.phSafeMax) {
            phStatus = 'danger';
            issues.push({
                sensor: 'Chemical / pH Level',
                level: 'danger',
                message: `pH reading (${snapshot.ph}) is outside safe range of ${t.phSafeMin}–${t.phSafeMax}. Possible contamination or unusual acidity.`,
            });
        }

        // Gas (TVOC) check
        let gasStatus = 'safe';
        if (snapshot.gas >= t.gasSpoilThreshold) {
            gasStatus = 'danger';
            issues.push({
                sensor: 'Spoilage Gas (TVOC)',
                level: 'danger',
                message: `TVOC level (${snapshot.gas} ppb) exceeds rancidity threshold of ${t.gasSpoilThreshold} ppb. Possible spoilage detected!`,
            });
        } else if (snapshot.gas >= t.gasSpoilThreshold * 0.5) {
            gasStatus = 'warning';
            issues.push({
                sensor: 'Spoilage Gas (TVOC)',
                level: 'warning',
                message: `TVOC level (${snapshot.gas} ppb) is approaching spoilage threshold (${t.gasSpoilThreshold} ppb). Monitor closely.`,
            });
        }

        // Overall safety index (simple weighted calculation)
        let safetyIndex = 100;
        if (tempStatus === 'warning') safetyIndex -= 10;
        if (tempStatus === 'danger') safetyIndex -= 30;
        if (phStatus === 'danger') safetyIndex -= 25;
        if (gasStatus === 'warning') safetyIndex -= 8;
        if (gasStatus === 'danger') safetyIndex -= 35;

        const overallStatus = safetyIndex >= 90 ? 'safe' : safetyIndex >= 60 ? 'warning' : 'danger';

        return {
            overallStatus,
            safetyIndex: Math.max(0, safetyIndex),
            tempStatus,
            phStatus,
            gasStatus,
            issues,
        };
    }

    // ─── Generate scan history entry ───
    function generateHistoryEntry(index) {
        const menu = SCHOOL_MENUS[index % SCHOOL_MENUS.length];
        const snapshot = generateSensorSnapshot(null);
        const safety = evaluateSafety(snapshot);

        const timeOffset = index * 7 * 60 * 1000; // 7 min apart
        const timestamp = new Date(Date.now() - timeOffset);

        return {
            id: `NL-${String(1000 + index).slice(-4)}`,
            timestamp: timestamp,
            meal: menu.name,
            temp: snapshot.temperature,
            ph: snapshot.ph,
            gas: snapshot.gas,
            nutriScore: menu.nutriScore,
            nutriGrade: menu.nutriGrade,
            safetyStatus: safety.overallStatus,
            safetyIndex: safety.safetyIndex,
        };
    }

    // ─── Generate batch history ───
    function generateScanHistory(count = 20) {
        const history = [];
        for (let i = 0; i < count; i++) {
            history.push(generateHistoryEntry(i));
        }
        return history;
    }

    // ─── Pick a random menu ───
    function getRandomMenu() {
        return SCHOOL_MENUS[Math.floor(Math.random() * SCHOOL_MENUS.length)];
    }

    // ─── Public API ───
    return {
        DEFAULTS,
        SCHOOL_MENUS,
        generateSensorSnapshot,
        evaluateSafety,
        generateScanHistory,
        generateHistoryEntry,
        getRandomMenu,
        rand,
        jitter,
    };

})();
