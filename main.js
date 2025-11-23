let remainingSeconds = 25 * 60;
let intervalId = null;
let currentMode = 'work'; // 'work' | 'break'
let totalSeconds = 25 * 60; // Toplam süre (çalışma modu için 25 dakika)

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateProgressBar() {
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.querySelector('.progress-bar-container');
    
    if (!progressBar || !progressContainer) return;
    
    // Timer çalışırken veya bittiğinde göster (çalışma veya mola modu)
    const isTimerActive = totalSeconds > 0 && (intervalId !== null || remainingSeconds === 0);
    
    if (isTimerActive) {
        progressContainer.style.display = 'block';
        
        // Kalan süre yüzdesi
        const progress = Math.max(0, remainingSeconds / totalSeconds);
        const percentage = progress * 100;
        
        // Genişliği güncelle
        progressBar.style.width = percentage + '%';
        
        // Sabit renkler: moda göre
        if (currentMode === 'work') {
            // Çalışma modu: kırmızı kalır
            progressBar.style.backgroundColor = '#cc0000';
        } else {
            // Mola modu: yeşil kalır
            progressBar.style.backgroundColor = '#00cc00';
        }
    } else {
        // Timer başlamamışsa gizle
        progressContainer.style.display = 'none';
    }
}

function render() {
    const displayEl = document.querySelector('.timer-display');
    if (displayEl) {
        displayEl.textContent = formatTime(remainingSeconds);
    }
    const modeEl = document.querySelector('.mode-indicator');
    if (modeEl) {
        modeEl.textContent = currentMode === 'work' ? 'Çalışma Modu' : 'Mola';
    }
    updateProgressBar();
}

function setButtonsState({ startDisabled, breakDisabled, resetDisabled }) {
    const startBtn = document.querySelector('.start-button');
    const breakBtn = document.querySelector('.break-button');
    const resetBtn = document.querySelector('.reset-button');
    if (startBtn) startBtn.disabled = !!startDisabled;
    if (breakBtn) breakBtn.disabled = !!breakDisabled;
    if (resetBtn) resetBtn.disabled = !!resetDisabled;
}

function setStartButtonActive(isActive) {
    const startBtn = document.querySelector('.start-button');
    if (startBtn) {
        if (isActive) {
            startBtn.classList.add('active');
        } else {
            startBtn.classList.remove('active');
        }
    }
}

function setStartButtonLabel(label) {
    const startBtn = document.querySelector('.start-button');
    if (startBtn) {
        startBtn.textContent = label;
    }
}

function clearRunningInterval() {
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
}

function playAlarm() {
    const audio = document.getElementById('alarm-audio');
    if (audio) {
        // Reset to start in case it was played before
        try { audio.currentTime = 0; } catch (e) {}
        audio.play().catch(() => {
            // Autoplay block or other issue: ignore silently
        });
    }
}

function stopAlarm() {
    const audio = document.getElementById('alarm-audio');
    if (audio) {
        try {
            audio.pause();
            audio.currentTime = 0;
        } catch (e) {}
    }
}

function tick() {
    if (remainingSeconds > 0) {
        remainingSeconds -= 1;
        render();
        if (remainingSeconds === 0) {
            clearRunningInterval();
            playAlarm();
            setButtonsState({
                startDisabled: false,
                breakDisabled: false,
                resetDisabled: false
            });
            setStartButtonLabel('Başlat (25 dk)');
            setStartButtonActive(false);
        }
    }
}

function startCountdown(seconds, mode) {
    currentMode = mode;
    remainingSeconds = seconds;
    // Toplam süreyi kaydet (hem çalışma hem mola modu için)
    totalSeconds = seconds;
    render();
    clearRunningInterval();
    intervalId = setInterval(tick, 1000);
    
    if (mode === 'work') {
        setButtonsState({
            startDisabled: false,
            breakDisabled: false,
            resetDisabled: false
        });
        setStartButtonLabel('Durdur');
        setStartButtonActive(true);
    } else {
        setButtonsState({
            startDisabled: false,
            breakDisabled: false,
            resetDisabled: false
        });
        setStartButtonActive(false);
        setStartButtonLabel('Başlat (25 dk)');
    }
}

function startWork() {
    const isRunning = intervalId !== null;
    const isWorkMode = currentMode === 'work';
    
    if (isRunning && isWorkMode) {
        // Timer çalışıyor ve çalışma modunda - Durdur
        clearRunningInterval();
        setStartButtonLabel('Devam Et');
        setStartButtonActive(false);
        setButtonsState({
            startDisabled: false,
            breakDisabled: false,
            resetDisabled: false
        });
    } else if (!isRunning && isWorkMode && remainingSeconds > 0) {
        // Timer durmuş ve çalışma modunda - Devam Et
        stopAlarm();
        intervalId = setInterval(tick, 1000);
        setStartButtonLabel('Durdur');
        setStartButtonActive(true);
        setButtonsState({
            startDisabled: false,
            breakDisabled: false,
            resetDisabled: false
        });
    } else {
        // Timer başlamamış veya farklı modda - Başlat
        stopAlarm();
        startCountdown(25 * 60, 'work');
        setStartButtonLabel('Durdur');
    }
}

function startBreak() {
    stopAlarm();
    startCountdown(5 * 60, 'break');
    setStartButtonLabel('Başlat (25 dk)');
    setStartButtonActive(false);
}

function resetTimer() {
    clearRunningInterval();
    remainingSeconds = currentMode === 'work' ? 25 * 60 : 5 * 60;
    totalSeconds = currentMode === 'work' ? 25 * 60 : 5 * 60;
    render();
    stopAlarm();
    setButtonsState({
        startDisabled: false,
        breakDisabled: false,
        resetDisabled: false
    });
    setStartButtonLabel('Başlat (25 dk)');
    setStartButtonActive(false);
}

// Initial render
render();
setStartButtonLabel('Başlat (25 dk)');

// Register Service Worker for PWA (only on secure contexts / localhost)
(function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    const isLocalhost = Boolean(
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '::1'
    );
    const isSecure = window.isSecureContext || window.location.protocol === 'https:';
    if (!isSecure && !isLocalhost) return;
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/service-worker.js').catch(function () { /* ignore */ });
    });
})();
