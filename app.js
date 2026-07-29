// ==================== المتغيرات العامة ====================
let medications = JSON.parse(localStorage.getItem('medications')) || [];
let isDarkMode = JSON.parse(localStorage.getItem('darkMode')) || false;
let currentTheme = localStorage.getItem('theme') || 'teal';
let deferredPrompt = null;
let installDismissed = localStorage.getItem('installDismissed');

// ==================== الثيمات ====================
const themes = {
    teal:   { primary: '#0d9488', secondary: '#14b8a6', bg: '#f0fdfa', darkBg: '#042f2e', darkCard: '#134e4a' },
    blue:   { primary: '#2563eb', secondary: '#3b82f6', bg: '#eff6ff', darkBg: '#172554', darkCard: '#1e3a5f' },
    purple: { primary: '#7c3aed', secondary: '#8b5cf6', bg: '#faf5ff', darkBg: '#2e1065', darkCard: '#4c1d95' },
    rose:   { primary: '#e11d48', secondary: '#f43f5e', bg: '#fff1f2', darkBg: '#4c0519', darkCard: '#881337' },
    amber:  { primary: '#d97706', secondary: '#f59e0b', bg: '#fffbeb', darkBg: '#451a03', darkCard: '#78350f' }
};

// ==================== تطبيق الثيم ====================
function applyTheme() {
    const theme = themes[currentTheme];
    const root = document.documentElement;
    const isDark = isDarkMode;

    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--secondary', theme.secondary);
    root.style.setProperty('--bg', isDark ? theme.darkBg : theme.bg);
    root.style.setProperty('--card-bg', isDark ? theme.darkCard : '#ffffff');
    root.style.setProperty('--text', isDark ? '#e2e8f0' : '#1e293b');
    root.style.setProperty('--text-secondary', isDark ? '#94a3b8' : '#64748b');
    root.style.setProperty('--border', isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)');

    document.body.className = `theme-${currentTheme}`;
    if (isDark) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');

    localStorage.setItem('theme', currentTheme);
    localStorage.setItem('darkMode', JSON.stringify(isDark));

    // تحديث لون شريط الحالة
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', isDark ? theme.darkBg : theme.primary);
    }
}

// ==================== إدارة التثبيت PWA ====================
function showInstallPromotion() {
    const banner = document.getElementById('installPrompt');
    const installBtn = document.getElementById('installBtn');
    
    if (installDismissed === 'true') {
        // عرض الزر الصغير فقط في الهيدر
        if (installBtn) installBtn.style.display = 'flex';
        return;
    }
    
    // عرض البانر الكبير
    if (banner) banner.style.display = 'block';
    if (installBtn) installBtn.style.display = 'flex';
}

function hideInstallPromotion() {
    const banner = document.getElementById('installPrompt');
    if (banner) banner.style.display = 'none';
    localStorage.setItem('installDismissed', 'true');
}

// الاستماع لحدث beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPromotion();
});

// اكتشاف إذا كان التطبيق مثبتاً بالفعل
window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideInstallPromotion();
    document.getElementById('installBtn').style.display = 'none';
    console.log('✅ تم تثبيت التطبيق بنجاح');
});

// التحقق من وضع العرض
if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('📱 التطبيق يعمل في وضع standalone');
}

// زر التثبيت في الهيدر
document.getElementById('installBtn').addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`المستخدم: ${outcome === 'accepted' ? 'قبل التثبيت' : 'رفض التثبيت'}`);
        deferredPrompt = null;
    }
});

// زر التثبيت في البانر
document.getElementById('installBannerBtn').addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            hideInstallPromotion();
        }
        deferredPrompt = null;
    }
});

// زر تجاهل البانر
document.getElementById('dismissBanner').addEventListener('click', () => {
    hideInstallPromotion();
});

// ==================== تبديل الوضع الليلي/النهاري ====================
document.getElementById('themeToggle').addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    applyTheme();
});

// ==================== اختيار الثيم ====================
document.querySelectorAll('.theme-dot').forEach(dot => {
    dot.addEventListener('click', () => {
        currentTheme = dot.dataset.theme;
        applyTheme();
    });
});

// ==================== تنسيق الوقت المتبقي ====================
function formatTimeRemaining(totalSeconds) {
    if (totalSeconds <= 0) return 'حان وقت الدواء! 🕐';

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let parts = [];
    if (days > 0) parts.push(`${days} يوم`);
    if (hours > 0) parts.push(`${hours} ساعة`);
    if (minutes > 0) parts.push(`${minutes} دقيقة`);
    if (days === 0 && hours === 0 && minutes === 0) parts.push(`${seconds} ثانية`);

    return parts.join(' و ') + ' متبقي';
}

// ==================== حساب الثواني المتبقية ====================
function getSecondsRemaining(dateTimeStr) {
    const target = new Date(dateTimeStr).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((target - now) / 1000));
}

// ==================== عرض قائمة الأدوية ====================
function renderMedications() {
    const list = document.getElementById('medList');
    if (medications.length === 0) {
        list.innerHTML = '<p class="empty-msg">لا توجد أدوية مضافة بعد</p>';
        return;
    }

    list.innerHTML = medications.map((med, index) => {
        const remaining = getSecondsRemaining(med.dateTime);
        const isPast = remaining <= 0;
        return `
            <div class="med-item ${isPast ? 'past' : ''}">
                <div class="med-info">
                    <strong>${med.name}</strong>
                    <small>${new Date(med.dateTime).toLocaleString('ar-SA')}</small>
                    <span class="time-remaining">${formatTimeRemaining(remaining)}</span>
                </div>
                <button class="btn btn-taken" onclick="markAsTaken(${index})">✅ أخذت الدواء</button>
            </div>
        `;
    }).join('');
}

// ==================== حفظ دواء جديد ====================
document.getElementById('saveMedBtn').addEventListener('click', () => {
    const name = document.getElementById('medName').value.trim();
    const dateTime = document.getElementById('medDateTime').value;

    if (!name || !dateTime) {
        alert('الرجاء إدخال اسم الدواء وتاريخ ووقت الجرعة');
        return;
    }

    medications.push({ name, dateTime });
    medications.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    localStorage.setItem('medications', JSON.stringify(medications));

    document.getElementById('medName').value = '';
    document.getElementById('medDateTime').value = '';
    renderMedications();
});

// ==================== أزرار المدد السريعة ====================
document.querySelectorAll('.btn-quick').forEach(btn => {
    btn.addEventListener('click', () => {
        const hours = parseInt(btn.dataset.hours);
        const name = document.getElementById('medName').value.trim();
        if (!name) {
            alert('الرجاء إدخال اسم الدواء أولاً');
            return;
        }
        const now = new Date();
        const target = new Date(now.getTime() + hours * 3600 * 1000);
        const dateTime = target.toISOString().slice(0, 16);

        medications.push({ name, dateTime });
        medications.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        localStorage.setItem('medications', JSON.stringify(medications));
        renderMedications();
    });
});

// ==================== أخذت الدواء ====================
function markAsTaken(index) {
    medications.splice(index, 1);
    localStorage.setItem('medications', JSON.stringify(medications));
    renderMedications();
}

// ==================== تحديث كل ثانية ====================
setInterval(renderMedications, 1000);

// ==================== تسجيل Service Worker ====================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => {
                console.log('✅ Service Worker مسجل بنجاح:', reg.scope);
            })
            .catch(err => {
                console.log('❌ فشل تسجيل Service Worker:', err);
            });
    });
}

// ==================== بدء التشغيل ====================
applyTheme();
renderMedications();
