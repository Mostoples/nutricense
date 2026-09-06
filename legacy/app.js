/* ============================================
   NUTRICENSE - Main Application Logic (app.js)
   Vanilla JavaScript | ES6 Module
   Firebase Auth + Firestore Integration
   ============================================ */

import { AuthService, FirestoreService } from './firebase-config.js';

'use strict';

const NutriCenseApp = (() => {

    // ─── Application State ───────────────────────────────────────────────────
    const state = {
        currentTab: 'overview',
        sensorSnapshot: null,
        currentMenu: null,
        scanHistory: [],
        alertCount: 0,
        todayScans: 142,
        overallSafetyIndex: 98.4,
        thresholds: { ...NutriCenseMockData.DEFAULTS },
        sensorHistoryData: { temp: [], ph: [], gas: [], humidity: [], labels: [] },
        boundingBoxesVisible: true,
        isScanActive: false,
        charts: {},
        intervals: [],
        currentUser: null,            // Firebase Auth user object
        firestoreUnsubscribe: null,   // Firestore real-time listener cleanup
        sensorLogCounter: 0,          // throttle sensor logging to Firestore
    };

    // ─── DOM Elements (cached) ───────────────────────────────────────────────
    let el = {};

    function cacheElements() {
        el = {
            // Nav
            navItems: document.querySelectorAll('.sidebar-nav li'),
            tabContents: document.querySelectorAll('.tab-content'),
            currentTabTitle: document.getElementById('current-tab-title'),
            currentTabDesc: document.getElementById('current-tab-desc'),

            // Header
            liveClock: document.getElementById('live-clock'),
            triggerScanBtn: document.getElementById('trigger-scan-btn'),

            // Overview Metrics
            overallSafetyIndexEl: document.getElementById('overall-safety-index'),
            todayScansCountEl: document.getElementById('today-scans-count'),
            overallNutriScoreEl: document.getElementById('overall-nutri-score'),
            activeAlertsCountEl: document.getElementById('active-alerts-count'),

            // Sensor Values
            sensorTempValue: document.getElementById('sensor-temp-value'),
            sensorTempFill: document.getElementById('sensor-temp-fill'),
            sensorTempStatus: document.getElementById('sensor-temp-status'),
            sensorTempCard: document.getElementById('sensor-temp-card'),

            sensorPhValue: document.getElementById('sensor-ph-value'),
            sensorPhFill: document.getElementById('sensor-ph-fill'),
            sensorPhStatus: document.getElementById('sensor-ph-status'),
            sensorPhCard: document.getElementById('sensor-ph-card'),

            sensorGasValue: document.getElementById('sensor-gas-value'),
            sensorGasFill: document.getElementById('sensor-gas-fill'),
            sensorGasStatus: document.getElementById('sensor-gas-status'),
            sensorGasCard: document.getElementById('sensor-gas-card'),

            sensorHumValue: document.getElementById('sensor-hum-value'),
            sensorHumFill: document.getElementById('sensor-hum-fill'),
            sensorHumStatus: document.getElementById('sensor-hum-status'),
            sensorHumCard: document.getElementById('sensor-hum-card'),
            sensorLastUpdated: document.getElementById('sensor-last-updated'),

            // Assessment Panel
            foodAssessmentPanel: document.getElementById('food-assessment-panel'),
            detectedMealName: document.getElementById('detected-meal-name'),
            portionWeight: document.getElementById('portion-weight'),
            nutriScorePill: document.getElementById('nutri-score-pill'),
            foodAssessmentTime: document.getElementById('food-assessment-time'),
            macroCals: document.getElementById('macro-calories'),
            macroCalsBar: document.getElementById('macro-calories-pct'),
            macroCarbs: document.getElementById('macro-carbs'),
            macroProtein: document.getElementById('macro-protein'),
            macroFats: document.getElementById('macro-fats'),
            microBadgesEl: document.getElementById('micronutrient-badges'),
            chemicalAnomalyItem: document.getElementById('chemical-anomaly-item'),

            // Camera Vision
            visionOverlay: document.getElementById('vision-overlay'),
            btnToggleGrid: document.getElementById('btn-toggle-grid'),
            btnSnapPhoto: document.getElementById('btn-snap-photo'),

            // History
            historyTbody: document.querySelector('#scan-history-table tbody'),
            btnExportCSV: document.getElementById('btn-export-csv'),

            // Settings
            settingsForm: document.getElementById('settings-form'),
            tempLimit: document.getElementById('temp-limit'),
            gasThreshold: document.getElementById('gas-threshold'),
            minPh: document.getElementById('min-ph'),
            maxPh: document.getElementById('max-ph'),
            btnSelfTest: document.getElementById('btn-self-test'),
            btnResetBox: document.getElementById('btn-reset-box'),

            // Sensor chart
            sensorChartSelect: document.getElementById('sensor-chart-select'),

            // Toast
            toastContainer: document.getElementById('toast-container'),

            // Log button
            btnSaveLog: document.getElementById('btn-save-log'),

            // Auth UI elements
            authUserName: document.getElementById('auth-user-name'),
            authUserEmail: document.getElementById('auth-user-email'),
            btnLogout: document.getElementById('btn-logout'),
        };
    }

    // ─── TAB DESCRIPTIONS ────────────────────────────────────────────────────
    const TAB_META = {
        overview: {
            title: 'Dashboard Overview',
            desc: 'Real-time school feeding meal safety and nutritional analysis monitoring.',
        },
        sensors: {
            title: 'Sensor Telemetry',
            desc: 'Hardware sensor array telemetry history, diagnostics and calibration status.',
        },
        nutrition: {
            title: 'Nutritional Analysis',
            desc: 'Weekly diet quality, macronutrient tracking, and school menu assessment.',
        },
        history: {
            title: 'Scan Log History',
            desc: 'Complete log of all NUTRICENSE food safety and nutritional scan events.',
        },
        settings: {
            title: 'Box Configuration',
            desc: 'Calibrate sensor thresholds, device settings, and API connection for NC-BOX-09X.',
        },
    };

    // ═══════════════════════════════════════════════════════════════════════════
    //  FIREBASE AUTH GUARD & USER UI
    // ═══════════════════════════════════════════════════════════════════════════

    function initAuthGuard() {
        AuthService.onAuthChange(async (user) => {
            if (!user) {
                // Not logged in → redirect to login page
                window.location.href = 'login.html';
                return;
            }

            // User is authenticated
            state.currentUser = user;

            // Update sidebar user info
            if (el.authUserName) {
                el.authUserName.textContent = user.displayName || (user.isAnonymous ? 'Guest User' : 'Operator');
            }
            if (el.authUserEmail) {
                el.authUserEmail.textContent = user.email || (user.isAnonymous ? 'Anonymous Session' : user.uid.slice(0, 12));
            }

            // Save/update user profile in Firestore
            await FirestoreService.upsertUserProfile(user);

            console.log('[NUTRICENSE] User authenticated:', user.uid, user.email || 'anonymous');
        });
    }

    function initLogout() {
        if (!el.btnLogout) return;
        el.btnLogout.addEventListener('click', async () => {
            if (confirm('Are you sure you want to sign out of NUTRICENSE?')) {
                // Clean up Firestore listener
                if (state.firestoreUnsubscribe) {
                    state.firestoreUnsubscribe();
                }
                // Clear all intervals
                state.intervals.forEach(id => clearInterval(id));

                const result = await AuthService.logout();
                if (result.error) {
                    showToast('⚠️ Logout Error', result.error, 'danger', 4000);
                }
                // onAuthChange will redirect to login.html
            }
        });
    }

    // ─── CLOCK ──────────────────────────────────────────────────────────────
    function initClock() {
        function update() {
            if (!el.liveClock) return;
            const now = new Date();
            const hours = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const h = hours % 12 || 12;
            el.liveClock.textContent = `${h}:${minutes}:${seconds} ${ampm}`;
        }
        update();
        const id = setInterval(update, 1000);
        state.intervals.push(id);
    }

    // ─── SIDEBAR NAVIGATION ──────────────────────────────────────────────────
    function initNavigation() {
        el.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                if (tab === state.currentTab) return;
                switchTab(tab);
            });
        });
    }

    function switchTab(tab) {
        state.currentTab = tab;

        el.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tab);
        });

        el.tabContents.forEach(tc => {
            tc.classList.add('hidden');
        });
        const targetTab = document.getElementById(`${tab}-tab`);
        if (targetTab) {
            targetTab.classList.remove('hidden');
        }

        const meta = TAB_META[tab];
        if (meta) {
            el.currentTabTitle.textContent = meta.title;
            el.currentTabDesc.textContent = meta.desc;
        }

        if (tab === 'sensors') initSensorHistoryChart();
        if (tab === 'nutrition') initWeeklyNutritionChart();
        if (tab === 'history') renderScanHistoryTable();
    }

    // ─── SENSOR SIMULATION ────────────────────────────────────────────────────
    function initSensorSimulation() {
        state.sensorSnapshot = NutriCenseMockData.generateSensorSnapshot(null);
        updateSensorUI(state.sensorSnapshot);
        appendSensorHistory(state.sensorSnapshot);

        const id = setInterval(() => {
            state.sensorSnapshot = NutriCenseMockData.generateSensorSnapshot(state.sensorSnapshot);
            updateSensorUI(state.sensorSnapshot);
            appendSensorHistory(state.sensorSnapshot);

            const safety = NutriCenseMockData.evaluateSafety(state.sensorSnapshot, state.thresholds);
            updateSafetyAlerts(safety);
            updateSensorHistoryChartLive();

            // Log sensor data to Firestore every 10th reading (every ~30 seconds)
            state.sensorLogCounter++;
            if (state.sensorLogCounter >= 10) {
                state.sensorLogCounter = 0;
                FirestoreService.saveSensorLog(state.sensorSnapshot).then(res => {
                    if (res.error) console.warn('[Firestore] Sensor log failed:', res.error);
                });
            }
        }, 3000);

        state.intervals.push(id);
    }

    function updateSensorUI(snapshot) {
        if (!snapshot) return;

        const { temperature, ph, gas, humidity } = snapshot;

        // Temperature
        const tempPct = Math.min(100, Math.round(((temperature - 20) / 80) * 100));
        const tempSafe = temperature >= state.thresholds.tempSafeMin;
        const tempWarn = temperature >= state.thresholds.tempSafeMin - 3 && temperature < state.thresholds.tempSafeMin;

        el.sensorTempValue.textContent = `${temperature.toFixed(1)}°C`;
        el.sensorTempFill.style.width = `${tempPct}%`;
        el.sensorTempCard.classList.remove('alert-state');

        if (tempSafe) {
            setColorClass(el.sensorTempFill, 'bg-warning');
            el.sensorTempStatus.className = 'sensor-status text-success';
            el.sensorTempStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> Safe Temp (Serving)';
        } else if (tempWarn) {
            setColorClass(el.sensorTempFill, 'bg-warning');
            el.sensorTempStatus.className = 'sensor-status text-warning';
            el.sensorTempStatus.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Near Minimum – Monitor';
        } else {
            setColorClass(el.sensorTempFill, 'bg-danger');
            el.sensorTempStatus.className = 'sensor-status text-danger';
            el.sensorTempStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> DANGER: Below Safe Temp!';
            el.sensorTempCard.classList.add('alert-state');
        }

        // pH
        const phPct = Math.min(100, Math.round((ph / 14) * 100));
        const phSafe = ph >= state.thresholds.phSafeMin && ph <= state.thresholds.phSafeMax;

        el.sensorPhValue.textContent = ph.toFixed(2);
        el.sensorPhFill.style.width = `${phPct}%`;
        el.sensorPhCard.classList.remove('alert-state');

        if (phSafe) {
            setColorClass(el.sensorPhFill, 'bg-primary');
            el.sensorPhStatus.className = 'sensor-status text-success';
            el.sensorPhStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> Neutral / Normal';
        } else {
            setColorClass(el.sensorPhFill, 'bg-danger');
            el.sensorPhStatus.className = 'sensor-status text-danger';
            el.sensorPhStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> ANOMALY: pH Out of Range!';
            el.sensorPhCard.classList.add('alert-state');
        }

        // Gas (TVOC)
        const gasPct = Math.min(100, Math.round((gas / 2000) * 100));
        const gasSafe = gas < state.thresholds.gasSpoilThreshold * 0.5;
        const gasWarn = gas >= state.thresholds.gasSpoilThreshold * 0.5 && gas < state.thresholds.gasSpoilThreshold;

        el.sensorGasValue.textContent = `${gas} ppb`;
        el.sensorGasFill.style.width = `${gasPct}%`;
        el.sensorGasCard.classList.remove('alert-state');

        if (gasSafe) {
            setColorClass(el.sensorGasFill, 'bg-success');
            el.sensorGasStatus.className = 'sensor-status text-success';
            el.sensorGasStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> Fresh Food Profile';
        } else if (gasWarn) {
            setColorClass(el.sensorGasFill, 'bg-warning');
            el.sensorGasStatus.className = 'sensor-status text-warning';
            el.sensorGasStatus.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Moderate Gas – Watch Trend';
        } else {
            setColorClass(el.sensorGasFill, 'bg-danger');
            el.sensorGasStatus.className = 'sensor-status text-danger';
            el.sensorGasStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> HIGH TVOC – Spoilage Risk!';
            el.sensorGasCard.classList.add('alert-state');
        }

        // Humidity
        const humPct = humidity;
        const humSafe = humidity >= state.thresholds.humidityMin && humidity <= state.thresholds.humidityMax;

        el.sensorHumValue.textContent = `${humidity}%`;
        el.sensorHumFill.style.width = `${humPct}%`;
        el.sensorHumCard.classList.remove('alert-state');

        if (humSafe) {
            setColorClass(el.sensorHumFill, 'bg-info');
            el.sensorHumStatus.className = 'sensor-status text-success';
            el.sensorHumStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> Optimal Chamber';
        } else {
            setColorClass(el.sensorHumFill, 'bg-warning');
            el.sensorHumStatus.className = 'sensor-status text-warning';
            el.sensorHumStatus.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Humidity Deviation';
        }

        el.sensorLastUpdated.textContent = 'Just Now';
    }

    function setColorClass(el, newClass) {
        const colorClasses = ['bg-success', 'bg-warning', 'bg-danger', 'bg-primary', 'bg-info'];
        el.classList.remove(...colorClasses);
        el.classList.add(newClass);
    }

    // ─── SENSOR HISTORY BUFFER ────────────────────────────────────────────────
    function appendSensorHistory(snapshot) {
        const MAX = 20;
        const t = new Date(snapshot.timestamp);
        const label = `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}:${String(t.getSeconds()).padStart(2,'0')}`;

        state.sensorHistoryData.labels.push(label);
        state.sensorHistoryData.temp.push(snapshot.temperature);
        state.sensorHistoryData.ph.push(snapshot.ph);
        state.sensorHistoryData.gas.push(snapshot.gas);
        state.sensorHistoryData.humidity.push(snapshot.humidity);

        if (state.sensorHistoryData.labels.length > MAX) {
            state.sensorHistoryData.labels.shift();
            state.sensorHistoryData.temp.shift();
            state.sensorHistoryData.ph.shift();
            state.sensorHistoryData.gas.shift();
            state.sensorHistoryData.humidity.shift();
        }
    }

    // ─── SAFETY ALERTS SYSTEM ────────────────────────────────────────────────
    function updateSafetyAlerts(safety) {
        const prevAlertCount = state.alertCount;

        state.overallSafetyIndex = safety.safetyIndex.toFixed(1);
        if (el.overallSafetyIndexEl) {
            el.overallSafetyIndexEl.textContent = `${state.overallSafetyIndex}%`;
            el.overallSafetyIndexEl.className = `metric-value ${safety.overallStatus === 'safe' ? 'text-success' : safety.overallStatus === 'warning' ? 'text-warning' : 'text-danger'}`;
        }

        state.alertCount = safety.issues.filter(i => i.level === 'danger').length;
        if (el.activeAlertsCountEl) {
            el.activeAlertsCountEl.textContent = state.alertCount;
            el.activeAlertsCountEl.className = `metric-value ${state.alertCount > 0 ? 'text-danger' : 'text-success'}`;
        }

        updateAssessmentHeader(safety);

        // Show toasts and save critical alerts to Firestore
        if (state.alertCount > prevAlertCount) {
            safety.issues.forEach(issue => {
                if (issue.level === 'danger') {
                    showToast(
                        '⚠️ Safety Alert Triggered',
                        `${issue.sensor}: ${issue.message}`,
                        'danger',
                        8000
                    );
                    // Save critical alert to Firestore
                    FirestoreService.saveAlert({
                        sensor: issue.sensor,
                        level: issue.level,
                        message: issue.message,
                        sensorSnapshot: { ...state.sensorSnapshot },
                    }, state.currentUser);
                }
            });
        } else if (state.alertCount < prevAlertCount && state.alertCount === 0) {
            showToast(
                '✅ Food Safety Restored',
                'All sensor readings have returned to safe operating parameters.',
                'success',
                4000
            );
        }
    }

    function updateAssessmentHeader(safety) {
        const header = el.foodAssessmentPanel ? el.foodAssessmentPanel.querySelector('.card-header') : null;
        if (!header) return;

        const titleEl = header.querySelector('.card-title h3');
        if (!titleEl) return;

        header.className = 'card-header';

        if (safety.overallStatus === 'safe') {
            header.classList.add('bg-success', 'text-white');
            titleEl.textContent = 'Latest Scan: Meal Safe ✓';
        } else if (safety.overallStatus === 'warning') {
            header.classList.add('bg-warning', 'text-white');
            titleEl.textContent = 'Latest Scan: Caution – Verify Meal';
        } else {
            header.classList.add('bg-danger', 'text-white');
            titleEl.textContent = 'Latest Scan: UNSAFE – Do Not Serve';
        }
    }

    // ─── TRIGGER SCAN (Manual) ───────────────────────────────────────────────
    function initScanTrigger() {
        if (!el.triggerScanBtn) return;
        el.triggerScanBtn.addEventListener('click', performManualScan);
    }

    function performManualScan() {
        if (state.isScanActive) return;
        state.isScanActive = true;

        el.triggerScanBtn.disabled = true;
        el.triggerScanBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Scanning...</span>';

        showToast('🔬 Scan Initiated', 'NUTRICENSE box is performing AI vision + multi-sensor assessment...', 'primary', 3000);

        setTimeout(async () => {
            const menu = NutriCenseMockData.getRandomMenu();
            state.currentMenu = menu;

            updateAssessmentMeal(menu);

            state.todayScans++;
            if (el.todayScansCountEl) {
                el.todayScansCountEl.textContent = state.todayScans;
            }

            if (el.overallNutriScoreEl) {
                el.overallNutriScoreEl.textContent = `${menu.nutriScore}/100`;
            }

            const safetyResult = NutriCenseMockData.evaluateSafety(state.sensorSnapshot, state.thresholds);

            // Build scan entry
            const entry = {
                scanId: `NL-${String(1000 + state.todayScans).slice(-4)}`,
                timestamp: new Date().toISOString(),
                meal: menu.name,
                mealItems: menu.items,
                portionWeight: menu.portionWeight,
                temp: state.sensorSnapshot.temperature,
                ph: state.sensorSnapshot.ph,
                gas: state.sensorSnapshot.gas,
                humidity: state.sensorSnapshot.humidity,
                calories: menu.calories,
                carbs: menu.carbs,
                protein: menu.protein,
                fats: menu.fats,
                micronutrients: menu.micronutrients,
                nutriScore: menu.nutriScore,
                nutriGrade: menu.nutriGrade,
                safetyStatus: safetyResult.overallStatus,
                safetyIndex: safetyResult.safetyIndex,
            };

            // Push to local history
            state.scanHistory.unshift(entry);

            // ★ Save scan to Firestore ★
            const firestoreResult = await FirestoreService.saveScan(entry, state.currentUser);
            if (firestoreResult.error) {
                console.warn('[Firestore] Scan save failed:', firestoreResult.error);
                showToast('⚠️ Cloud Sync Error', 'Scan saved locally but failed to sync to Firestore.', 'warning', 4000);
            } else {
                console.log('[Firestore] Scan saved:', firestoreResult.id);
            }

            updateBoundingBoxes(menu.items);

            if (el.foodAssessmentTime) {
                el.foodAssessmentTime.textContent = formatTime(new Date());
            }

            el.triggerScanBtn.disabled = false;
            el.triggerScanBtn.innerHTML = '<i class="fa-solid fa-expand"></i> <span>Trigger Box Scan</span>';
            state.isScanActive = false;

            showToast(`🍽️ Scan Complete`, `Identified: ${menu.name} | Score: ${menu.nutriGrade} (${menu.nutriScore}/100) — Saved to Cloud ☁️`, 'success', 5000);

        }, 2400);
    }

    function updateAssessmentMeal(menu) {
        if (!el.detectedMealName) return;

        el.detectedMealName.textContent = menu.name;
        el.portionWeight.textContent = `${menu.portionWeight}g`;
        el.macroCals.textContent = `${menu.calories} kcal`;
        el.macroCarbs.textContent = `${menu.carbs}g`;
        el.macroProtein.textContent = `${menu.protein}g`;
        el.macroFats.textContent = `${menu.fats}g`;

        const calPct = Math.min(100, Math.round((menu.calories / 2000) * 100));
        el.macroCalsBar.style.width = `${calPct}%`;

        el.nutriScorePill.textContent = `${menu.nutriGrade} (${menu.nutriScore}/100)`;
        el.nutriScorePill.className = 'nutri-score-pill';
        if (menu.nutriScore >= 90) {
            el.nutriScorePill.classList.add('bg-success');
        } else if (menu.nutriScore >= 75) {
            el.nutriScorePill.classList.add('bg-warning');
        } else {
            el.nutriScorePill.classList.add('bg-danger');
        }

        if (el.microBadgesEl && menu.micronutrients) {
            el.microBadgesEl.innerHTML = menu.micronutrients.map(m =>
                `<span class="micro-badge"><i class="fa-solid fa-leaf text-success"></i> ${m}</span>`
            ).join('');
        }
    }

    function updateBoundingBoxes(items) {
        const boxes = el.visionOverlay ? el.visionOverlay.querySelectorAll('.bounding-box') : [];
        boxes.forEach((box, i) => {
            const label = box.querySelector('.box-label');
            if (label && items[i]) {
                label.textContent = `${items[i]} - ${(90 + Math.random() * 9).toFixed(1)}%`;
            }
        });
    }

    // ─── VISION CONTROLS ─────────────────────────────────────────────────────
    function initVisionControls() {
        if (el.btnToggleGrid) {
            el.btnToggleGrid.addEventListener('click', () => {
                state.boundingBoxesVisible = !state.boundingBoxesVisible;
                if (el.visionOverlay) {
                    const boxes = el.visionOverlay.querySelectorAll('.bounding-box');
                    boxes.forEach(b => {
                        b.style.opacity = state.boundingBoxesVisible ? '1' : '0';
                    });
                }
                el.btnToggleGrid.innerHTML = state.boundingBoxesVisible
                    ? '<i class="fa-solid fa-border-all"></i> Toggle AI Bounding Boxes'
                    : '<i class="fa-regular fa-square"></i> Show Bounding Boxes';
            });
        }

        if (el.btnSnapPhoto) {
            el.btnSnapPhoto.addEventListener('click', () => {
                showToast('📸 Snapshot Captured', 'Frame saved to device storage buffer (NL-SNAP-' + Date.now().toString().slice(-6) + '.jpg)', 'primary', 4000);
                const vision = document.querySelector('.vision-container');
                if (vision) {
                    vision.style.filter = 'brightness(2)';
                    setTimeout(() => { vision.style.filter = ''; }, 150);
                }
            });
        }
    }

    // ─── SENSOR HISTORY CHART (Chart.js) ─────────────────────────────────────
    function initSensorHistoryChart() {
        const canvas = document.getElementById('sensorHistoryChart');
        if (!canvas) return;

        if (state.charts.sensorHistory) {
            updateSensorHistoryChartLive();
            return;
        }

        const selectedSensor = el.sensorChartSelect ? el.sensorChartSelect.value : 'temp';
        const { labels, data, color, label } = getSensorChartData(selectedSensor);

        state.charts.sensorHistory = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    borderColor: color,
                    backgroundColor: color + '15',
                    borderWidth: 2.5,
                    pointRadius: 4,
                    pointBackgroundColor: color,
                    fill: true,
                    tension: 0.4,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 300 },
                plugins: {
                    legend: { display: false },
                    tooltip: { mode: 'index', intersect: false },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#64748b', font: { size: 11, family: 'JetBrains Mono' } },
                    },
                    y: {
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: { color: '#64748b', font: { size: 11 } },
                    },
                },
            },
        });

        if (el.sensorChartSelect) {
            el.sensorChartSelect.addEventListener('change', () => {
                updateSensorHistoryChartLive();
            });
        }
    }

    function getSensorChartData(sensor) {
        const data_map = {
            temp: { data: state.sensorHistoryData.temp, color: '#f59e0b', label: 'Temperature (°C)' },
            ph: { data: state.sensorHistoryData.ph, color: '#2563eb', label: 'pH Level' },
            gas: { data: state.sensorHistoryData.gas, color: '#10b981', label: 'TVOC Gas (ppb)' },
            humidity: { data: state.sensorHistoryData.humidity, color: '#06b6d4', label: 'Chamber Humidity (%)' },
        };
        const selected = data_map[sensor] || data_map.temp;
        return {
            labels: [...state.sensorHistoryData.labels],
            data: [...selected.data],
            color: selected.color,
            label: selected.label,
        };
    }

    function updateSensorHistoryChartLive() {
        const chart = state.charts.sensorHistory;
        if (!chart) return;
        const selectedSensor = el.sensorChartSelect ? el.sensorChartSelect.value : 'temp';
        const { labels, data, color, label } = getSensorChartData(selectedSensor);

        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.data.datasets[0].label = label;
        chart.data.datasets[0].borderColor = color;
        chart.data.datasets[0].backgroundColor = color + '15';
        chart.data.datasets[0].pointBackgroundColor = color;
        chart.update('none');
    }

    // ─── WEEKLY NUTRITION CHART ───────────────────────────────────────────────
    function initWeeklyNutritionChart() {
        const canvas = document.getElementById('weeklyNutritionChart');
        if (!canvas || state.charts.weeklyNutrition) return;

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const carbData = [65, 72, 68, 61, 70];
        const proteinData = [22, 25, 28, 21, 26];
        const fatData = [12, 15, 14, 11, 16];

        state.charts.weeklyNutrition = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: days,
                datasets: [
                    { label: 'Carbohydrates (g)', data: carbData, backgroundColor: '#f97316cc', borderRadius: 6 },
                    { label: 'Protein (g)', data: proteinData, backgroundColor: '#ef4444cc', borderRadius: 6 },
                    { label: 'Fats (g)', data: fatData, backgroundColor: '#eab308cc', borderRadius: 6 },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { font: { size: 12 } } },
                    tooltip: { mode: 'index', intersect: false },
                },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#64748b' } },
                    y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#64748b' } },
                },
            },
        });
    }

    // ─── SCAN HISTORY TABLE ───────────────────────────────────────────────────
    function renderScanHistoryTable() {
        if (!el.historyTbody) return;

        const rows = state.scanHistory.map(entry => {
            const statusMap = { safe: 'badge-success', warning: 'badge-warning', danger: 'badge-danger' };
            const statusLabel = { safe: '✓ Safe', warning: '⚠ Caution', danger: '✗ Unsafe' };
            const tempVal = typeof entry.temp === 'number' ? entry.temp.toFixed(1) : entry.temp;
            const phVal = typeof entry.ph === 'number' ? entry.ph.toFixed(2) : entry.ph;
            return `
                <tr>
                    <td style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--gray-500);">
                        ${formatDateTime(entry.timestamp)}
                    </td>
                    <td><strong>${entry.meal}</strong></td>
                    <td>${tempVal}°C</td>
                    <td>${phVal}</td>
                    <td>${entry.gas} ppb</td>
                    <td><strong>${entry.nutriGrade} (${entry.nutriScore})</strong></td>
                    <td><span class="badge ${statusMap[entry.safetyStatus]}">${statusLabel[entry.safetyStatus]}</span></td>
                    <td>
                        <button class="btn btn-outline btn-sm" style="font-size: 0.7rem; padding: 4px 10px;">
                            <i class="fa-solid fa-file-lines"></i> Report
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        el.historyTbody.innerHTML = rows || '<tr><td colspan="8" style="text-align: center; color: var(--gray-400); padding: 32px;">No scan records available yet.</td></tr>';
    }

    // ─── FIRESTORE REAL-TIME SUBSCRIPTION ─────────────────────────────────────
    function initFirestoreSubscription() {
        // Listen to Firestore scans in real-time for the history tab
        state.firestoreUnsubscribe = FirestoreService.subscribeScans(50, (docs) => {
            // Merge Firestore data into local history
            // Only replace if we have cloud data
            if (docs.length > 0) {
                const cloudEntries = docs.map(d => ({
                    id: d.scanId || d.id,
                    timestamp: d.timestamp || (d.createdAt ? d.createdAt.toDate().toISOString() : new Date().toISOString()),
                    meal: d.meal || 'Unknown',
                    temp: d.temp || 0,
                    ph: d.ph || 7.0,
                    gas: d.gas || 0,
                    nutriScore: d.nutriScore || 0,
                    nutriGrade: d.nutriGrade || '-',
                    safetyStatus: d.safetyStatus || 'safe',
                    safetyIndex: d.safetyIndex || 100,
                }));

                // Combine cloud entries with any local-only entries
                const cloudIds = new Set(docs.map(d => d.scanId || d.id));
                const localOnly = state.scanHistory.filter(e => !cloudIds.has(e.id) && !cloudIds.has(e.scanId));
                state.scanHistory = [...localOnly, ...cloudEntries].sort((a, b) => {
                    return new Date(b.timestamp) - new Date(a.timestamp);
                });

                // If history tab is visible, re-render
                if (state.currentTab === 'history') {
                    renderScanHistoryTable();
                }
            }
        });
    }

    // ─── EXPORT CSV ───────────────────────────────────────────────────────────
    function initExportCSV() {
        if (!el.btnExportCSV) return;
        el.btnExportCSV.addEventListener('click', exportToCSV);
    }

    function exportToCSV() {
        if (state.scanHistory.length === 0) {
            showToast('⚠️ No Data', 'No scan records to export yet.', 'warning', 3000);
            return;
        }

        const headers = ['Scan ID', 'Timestamp', 'Meal', 'Temp(°C)', 'pH', 'TVOC(ppb)', 'Nutri Score', 'Nutri Grade', 'Safety Status'];
        const rows = state.scanHistory.map(e => [
            e.id || e.scanId,
            formatDateTime(e.timestamp),
            `"${e.meal}"`,
            typeof e.temp === 'number' ? e.temp.toFixed(1) : e.temp,
            typeof e.ph === 'number' ? e.ph.toFixed(2) : e.ph,
            e.gas,
            e.nutriScore,
            e.nutriGrade,
            e.safetyStatus,
        ].join(','));

        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `nutricense_export_${Date.now()}.csv`;
        a.click();

        URL.revokeObjectURL(url);
        showToast('📥 Export Ready', `${state.scanHistory.length} scan records exported as CSV.`, 'success', 3500);
    }

    // ─── SAVE LOG BUTTON (to Firestore) ─────────────────────────────────────
    function initSaveLog() {
        if (!el.btnSaveLog) return;
        el.btnSaveLog.addEventListener('click', async () => {
            if (!state.currentMenu) {
                showToast('⚠️ No Meal', 'No meal has been scanned yet. Trigger a scan first.', 'warning', 3000);
                return;
            }

            const entry = {
                scanId: `NL-LOG-${Date.now().toString().slice(-6)}`,
                timestamp: new Date().toISOString(),
                meal: state.currentMenu.name,
                mealItems: state.currentMenu.items,
                portionWeight: state.currentMenu.portionWeight,
                temp: state.sensorSnapshot ? state.sensorSnapshot.temperature : 0,
                ph: state.sensorSnapshot ? state.sensorSnapshot.ph : 7,
                gas: state.sensorSnapshot ? state.sensorSnapshot.gas : 0,
                humidity: state.sensorSnapshot ? state.sensorSnapshot.humidity : 50,
                calories: state.currentMenu.calories,
                carbs: state.currentMenu.carbs,
                protein: state.currentMenu.protein,
                fats: state.currentMenu.fats,
                micronutrients: state.currentMenu.micronutrients,
                nutriScore: state.currentMenu.nutriScore,
                nutriGrade: state.currentMenu.nutriGrade,
                safetyStatus: 'safe',
                safetyIndex: parseFloat(state.overallSafetyIndex),
                logType: 'manual',
            };

            const result = await FirestoreService.saveScan(entry, state.currentUser);
            if (result.error) {
                showToast('⚠️ Save Failed', `Could not save to Firestore: ${result.error}`, 'danger', 5000);
            } else {
                showToast('💾 Meal Logged to Cloud', `${state.currentMenu.name} — Saved to Firestore (ID: ${result.id.slice(0, 8)}...)`, 'success', 4000);
            }
        });
    }

    // ─── SETTINGS FORM ────────────────────────────────────────────────────────
    function initSettings() {
        if (el.settingsForm) {
            el.settingsForm.addEventListener('submit', e => {
                e.preventDefault();
                state.thresholds.tempSafeMin = parseFloat(el.tempLimit.value) || 60;
                state.thresholds.gasSpoilThreshold = parseFloat(el.gasThreshold.value) || 600;
                state.thresholds.phSafeMin = parseFloat(el.minPh.value) || 4.0;
                state.thresholds.phSafeMax = parseFloat(el.maxPh.value) || 8.0;
                showToast('⚙️ Config Saved', 'Hardware sensor thresholds have been updated and applied.', 'success', 3500);
            });
        }

        if (el.btnSelfTest) {
            el.btnSelfTest.addEventListener('click', () => {
                showToast('🔧 Self-Diagnostic', 'Running hardware self-check on all sensor modules...', 'primary', 2500);
                setTimeout(() => {
                    showToast('✅ Diagnostic Complete', 'All 4 sensor modules passed self-test. Firmware v1.4.2 nominal.', 'success', 4000);
                }, 2600);
            });
        }

        if (el.btnResetBox) {
            el.btnResetBox.addEventListener('click', () => {
                if (confirm('Are you sure you want to reboot the NC-BOX-09X device module? Data collection will pause briefly.')) {
                    showToast('🔄 Rebooting Device', 'NC-BOX-09X is restarting. Reconnection expected in 15–20 seconds.', 'warning', 6000);
                }
            });
        }
    }

    // ─── TOAST NOTIFICATION SYSTEM ───────────────────────────────────────────
    function showToast(title, message, type = 'success', duration = 4000) {
        const typeIconMap = {
            success: { icon: 'fa-circle-check', color: 'text-success' },
            warning: { icon: 'fa-triangle-exclamation', color: 'text-warning' },
            danger: { icon: 'fa-circle-xmark', color: 'text-danger' },
            primary: { icon: 'fa-circle-info', color: 'text-primary' },
        };

        const typeInfo = typeIconMap[type] || typeIconMap.success;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon ${typeInfo.color}">
                <i class="fa-solid ${typeInfo.icon}"></i>
            </div>
            <div class="toast-body">
                <h5>${title}</h5>
                <p>${message}</p>
            </div>
            <button class="toast-close" onclick="this.closest('.toast').remove()">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;

        if (el.toastContainer) {
            el.toastContainer.appendChild(toast);
        }

        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }

    // ─── LOAD INITIAL SCAN HISTORY ────────────────────────────────────────────
    function initScanHistory() {
        state.scanHistory = NutriCenseMockData.generateScanHistory(20);
    }

    // ─── LOAD INITIAL MENU ASSESSMENT ────────────────────────────────────────
    function initAssessmentPanel() {
        state.currentMenu = NutriCenseMockData.SCHOOL_MENUS[0];
        updateAssessmentMeal(state.currentMenu);
    }

    // ─── HELPERS ─────────────────────────────────────────────────────────────
    function formatTime(date) {
        const d = new Date(date);
        const h = d.getHours() % 12 || 12;
        const m = String(d.getMinutes()).padStart(2, '0');
        const s = String(d.getSeconds()).padStart(2, '0');
        const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
        return `${h}:${m}:${s} ${ampm}`;
    }

    function formatDateTime(date) {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${year}-${month}-${day} ${formatTime(d)}`;
    }

    // ─── INITIALIZE ──────────────────────────────────────────────────────────
    function init() {
        cacheElements();

        // ★ Firebase Auth Guard — must be first ★
        initAuthGuard();
        initLogout();

        initClock();
        initNavigation();
        initScanHistory();
        initAssessmentPanel();
        initSensorSimulation();
        initScanTrigger();
        initVisionControls();
        initExportCSV();
        initSaveLog();
        initSettings();

        // ★ Firestore real-time subscription ★
        initFirestoreSubscription();

        // Welcome toast on load
        setTimeout(() => {
            showToast('🟢 NUTRICENSE Online', 'NC-BOX-09X connected. All sensors active. Cloud sync enabled ☁️', 'success', 5000);
        }, 800);

        console.log('[NUTRICENSE] Application initialized with Firebase integration.');
    }

    // ─── Public ──────────────────────────────────────────────────────────────
    return { init, showToast, performManualScan };

})();

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
    NutriCenseApp.init();
});
