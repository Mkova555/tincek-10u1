
    let deferredPrompt = null;

        overlay.classList.add('show');
        overlay.setAttribute('aria-hidden', 'false');
    }

    function hideInstallPrompt() {
        const overlay = document.getElementById('install-modal-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            overlay.setAttribute('aria-hidden', 'true');
        }
    }

    async function installApp() {
        if (!deferredPrompt) {
            alert('Instalacija nije dostupna u ovom pregledniku.');
            return;
        }

        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
            hideInstallPrompt();
        }
        deferredPrompt = null;
    }

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredPrompt = event;
        setTimeout(() => showInstallPrompt(), 4000);
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        hideInstallPrompt();
    });

    document.getElementById('app-container').addEventListener('click', (event) => {
        const interactive = event.target.closest('button, input, textarea, select, a, label');
        if (interactive) return;
        showInstallPrompt();
    });

    // LOGIN + REGISTRACIJA + RESET LOZINKE

    function getUsers() { return JSON.parse(localStorage.getItem('tincek_users')) || []; }
    function saveUsers(u) { localStorage.setItem('tincek_users', JSON.stringify(u)); }
    function getRememberedCredentials() {
        try {
            return JSON.parse(localStorage.getItem('tincek_remembered')) || null;
        } catch {
            return null;
        }
    }

    function saveRememberedCredentials(username, password, remember) {
        if (remember) {
            localStorage.setItem('tincek_remembered', JSON.stringify({ username, password }));
        } else {
            localStorage.removeItem('tincek_remembered');
        }
    }

    function showAuthScreen(screen) {
        document.querySelectorAll('.auth-screen').forEach(panel => panel.classList.remove('active'));
        document.getElementById('login-error').innerText = '';

        if (screen === 'login') {
            document.getElementById('auth-login').classList.add('active');
            const saved = getRememberedCredentials();
            if (saved) {
                document.getElementById('login-username').value = saved.username || '';
                document.getElementById('login-password').value = saved.password || '';
                document.getElementById('login-remember').checked = true;
            }
        } else if (screen === 'register') {
            document.getElementById('auth-register').classList.add('active');
        } else {
            document.getElementById('auth-choice').classList.add('active');
        }
    }

    function handleLogin() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const errorDiv = document.getElementById('login-error');

        if(!username || !password) {
            errorDiv.innerText = 'Unesi korisničko ime i lozinku!';
            return;
        }

        const users = getUsers();
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if(!user) {
            errorDiv.innerText = 'Korisnik ne postoji. Klikni Registracija da se registriraš.';
            return;
        }
        if(user.password !== password) { errorDiv.innerText = 'Kriva lozinka.'; return; }

        const remember = document.getElementById('login-remember').checked;
        saveRememberedCredentials(username, password, remember);

        sessionStorage.setItem('tincek_logged', 'true');
        sessionStorage.setItem('tincek_session_user', user.username);
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('app-container').classList.add('logged-in');
        errorDiv.innerText = '';
        displayUsername();
    }

    function handleRegister() {
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value.trim();
        const confirm = document.getElementById('register-password-confirm').value.trim();
        const errorDiv = document.getElementById('login-error');

        if(!username || !email || !password || !confirm) { errorDiv.innerText = 'Popuni sva polja za registraciju.'; return; }
        if(password !== confirm) { errorDiv.innerText = 'Lozinke se ne podudaraju.'; return; }
        if(password.length < 4) { errorDiv.innerText = 'Lozinka mora imati barem 4 znaka.'; return; }

        const users = getUsers();
        if(users.find(u => u.username.toLowerCase() === username.toLowerCase())) { errorDiv.innerText = 'Korisničko ime je zauzeto.'; return; }
        if(users.find(u => u.email.toLowerCase() === email.toLowerCase())) { errorDiv.innerText = 'E-mail je već registriran.'; return; }

        users.push({ username, password, email });
        saveUsers(users);

        // Auto-login after registration
        sessionStorage.setItem('tincek_logged', 'true');
        sessionStorage.setItem('tincek_session_user', username);
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('app-container').classList.add('logged-in');
        errorDiv.innerText = '';
        displayUsername();
    }

    function startPasswordReset() {
        const email = prompt('Unesi svoj registrirani e-mail za reset:');
        if(!email) return;
        const users = getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if(!user) { alert('E-mail nije pronađen.'); return; }

        // Offline reset: iz sigurnosnih razloga ne šaljemo kodove, odmah omogućavamo unos nove lozinke
        const newPass = prompt('Unesi novu lozinku (min 4 znaka):');
        if(!newPass || newPass.length < 4) { alert('Lozinka mora imati barem 4 znaka.'); return; }
        const confirm = prompt('Potvrdi novu lozinku:');
        if(confirm !== newPass) { alert('Lozinke se ne podudaraju.'); return; }

        // Update password
        const all = getUsers();
        const idx = all.findIndex(u => u.username === user.username);
        if(idx !== -1) { all[idx].password = newPass; saveUsers(all); alert('Lozinka je resetirana. Možeš se prijaviti.'); }
    }

    function displayUsername() {
        const username = sessionStorage.getItem('tincek_session_user');
        if(username) {
            const nameBadge = document.querySelector('.name-badge');
            nameBadge.innerHTML = `<input type="text" id="user-name" value="${username}" readonly style="background:transparent !important; border:none !important; color:#ffffff !important; font-family: 'Fugaz One', cursive !important; font-size:1.15rem !important; outline:none !important; text-transform:uppercase !important; text-shadow: 0 0 8px var(--neon-pink) !important; letter-spacing:0.5px !important; width:105px !important; text-align:left !important; margin:0 !important; padding:0 !important;" title="Prijavljen kao: ${username}">`;
        }
    }

    function logout() {
        sessionStorage.removeItem('tincek_logged');
        sessionStorage.removeItem('tincek_session_user');
        document.getElementById('login-container').style.display = 'flex';
        showAuthScreen('choice');
        document.getElementById('app-container').classList.remove('logged-in');
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('login-error').innerText = '';
        const nameBadge = document.querySelector('.name-badge');
        nameBadge.innerHTML = '<!-- Ime je skriveno iz sigurnosnih razloga -->';
    }

    // Provjeri je li korisnik već prijavljen
    window.addEventListener('load', () => {
        const saved = getRememberedCredentials();
        if (saved) {
            document.getElementById('login-username').value = saved.username || '';
            document.getElementById('login-password').value = saved.password || '';
            document.getElementById('login-remember').checked = true;
        }

        if(sessionStorage.getItem('tincek_logged') === 'true') {
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('app-container').classList.add('logged-in');
            displayUsername();
        }
    });

    // Dozvoli Enter tipku za prijavu/registraciju
    document.addEventListener('keypress', (e) => {
        if(e.key !== 'Enter' || document.getElementById('login-container').style.display === 'none') return;

        const active = document.activeElement?.id || '';
        if(active === 'register-username' || active === 'register-email' || active === 'register-password' || active === 'register-password-confirm') {
            handleRegister();
        } else if (document.getElementById('auth-login').classList.contains('active')) {
            handleLogin();
        }
    });

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(() => {});
        });
    }

    // ORIGINALNI SCRIPT

    // SCREEN NAVIGACIJA
    function openScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        if(id === 'screen-calendar') loadCalendar();
        if(id === 'screen-todo') renderTodos();
        if(id === 'screen-bills') renderBills();
        if(id === 'screen-notepad') renderBlockSheets();
    }
    function goHome() { openScreen('screen-dashboard'); }

    window.onload = () => {
        // Nije trebam učitavati ime jer se skriva iz sigurnosnih razloga
        const savedPic = localStorage.getItem('tincek_pic');
        if(savedPic) {
            const profileContainer = document.querySelector('.profile-container');
            profileContainer.innerHTML = `<img src="${savedPic}" id="profile-display" class="profile-img" onclick="document.getElementById('profile-input').click()">`;
        }
        setInterval(updateClock, 1000);
        updateClock();
        renderBlockSheets();
        loadTemperature();
        updateTickerReminders();
        setInterval(updateTickerReminders, 5000);
    };
    
    function loadProfilePic(input) {
        if(input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const cameraIcon = document.getElementById('camera-icon');
                const profileContainer = document.querySelector('.profile-container');
                profileContainer.innerHTML = `<img src="${e.target.result}" id="profile-display" class="profile-img" onclick="document.getElementById('profile-input').click()">`;
                localStorage.setItem('tincek_pic', e.target.result);
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    function updateClock() {
        const now = new Date();
        document.getElementById('clock').innerText = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
        document.getElementById('date').innerText = now.toLocaleDateString('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ".";
    }

    // 1. BLOK ZA PISANJE (SAVED SHEETS LOGIKA)
    let blockSheets = JSON.parse(localStorage.getItem('tincek_sheets')) || [];
    function renderBlockSheets() {
        const container = document.getElementById('saved-sheets-container');
        container.innerHTML = '';
        blockSheets.forEach((sheet, index) => {
            container.innerHTML += `
                <div class="note-sheet">
                    <div class="note-sheet-text">${sheet}</div>
                    <button class="delete-sheet-btn" onclick="deleteBlockSheet(${index})">Otrgni X</button>
                </div>
            `;
        });
    }

    function saveBlockNote() {
        const area = document.getElementById('notepad-area');
        if(area.value.trim()) {
            blockSheets.push(area.value.trim());
            localStorage.setItem('tincek_sheets', JSON.stringify(blockSheets));
            area.value = '';
            renderBlockSheets();
        }
    }

    function deleteBlockSheet(index) {
        blockSheets.splice(index, 1);
        localStorage.setItem('tincek_sheets', JSON.stringify(blockSheets));
        renderBlockSheets();
    }

    // 2. KALENDAR LOGIKA
    function loadCalendar() {
        const now = new Date();
        const monthNames = ["Siječanj", "Veljača", "Ožujak", "Travanj", "Svibanj", "Lipanj", "Srpanj", "Kolovoz", "Rujan", "Listopad", "Studeni", "Prosinac"];
        document.getElementById('calendar-month-year').innerText = monthNames[now.getMonth()].toUpperCase() + " " + now.getFullYear();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';
        let startOffset = firstDay === 0 ? 6 : firstDay - 1;
        for (let i = 0; i < startOffset; i++) grid.innerHTML += '<div></div>';
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = day === now.getDate() ? 'border: 2px solid var(--neon-cyan); background: rgba(0,242,254,0.2); border-radius: 8px;' : '';
            grid.innerHTML += `<div style="${isToday}">${day}</div>`;
        }
    }

    // 3. TEMPERATURA LOGIKA
    function loadTemperature() {
        // Simulira učitavanje temperature ili koristi mock vrijednost
        const temps = [18, 19, 20, 21, 22, 23, 24, 25];
        const statuses = ['Hladno i oblačno', 'Normalno', 'Optimalno i Sunčano', 'Toplo', 'Vruće i vlažno'];
        const randomTemp = temps[Math.floor(Math.random() * temps.length)];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        document.getElementById('weather-temp').innerText = randomTemp + '°C';
        document.getElementById('weather-status').innerText = 'Status: ' + randomStatus;
    }
    
    function updateTickerReminders() {
        const todos = JSON.parse(localStorage.getItem('tincek_todos')) || [];
        const bills = JSON.parse(localStorage.getItem('tincek_bills')) || [];
        const tickerBar = document.getElementById('ticker-bar');
        let tickerText = '';
        
        if(todos.length > 0 || bills.length > 0 || activeAlarm) {
            tickerBar.style.display = 'flex';
            
            if(todos.length > 0) {
                tickerText += '<span class="ticker-prefix">✅</span> OBAVEZE: ' + todos.slice(0, 3).join(' | ') + ' ';
            }
            if(bills.length > 0) {
                tickerText += '<span class="ticker-prefix">💰</span> RAČUNI: ' + bills.map(b => b.name + ' (' + b.amount + ' EUR)').slice(0, 2).join(' | ') + ' ';
            }
            if(activeAlarm) {
                tickerText += '<span class="ticker-prefix">⏰</span> ALARM u: ' + activeAlarm + ' ';
            }
            document.getElementById('ticker-content').innerHTML = tickerText;
        } else {
            tickerBar.style.display = 'none';
        }
    }

    // 4. KALKULATOR LOGIKA
    let calcDisplay = document.getElementById('calc-display');
    function pressCalc(val) { if (calcDisplay.innerText === '0' || calcDisplay.innerText === 'Greška') calcDisplay.innerText = val; else calcDisplay.innerText += val; }
    function clearCalc() { calcDisplay.innerText = '0'; }
    function solveCalc() { try { calcDisplay.innerText = eval(calcDisplay.innerText); } catch { calcDisplay.innerText = 'Greška'; } }

    // 5. OBAVEZE LOGIKA
    let todos = JSON.parse(localStorage.getItem('tincek_todos')) || [];
    function renderTodos() {
        const list = document.getElementById('todo-list'); list.innerHTML = '';
        todos.forEach((t, i) => { list.innerHTML += `<li><span>${t}</span><button class="delete-btn" onclick="deleteTodo(${i})">X</button></li>`; });
    }
    function addTodo() {
        const input = document.getElementById('todo-input');
        if(input.value.trim()) { todos.push(input.value.trim()); localStorage.setItem('tincek_todos', JSON.stringify(todos)); input.value = ''; renderTodos(); updateTickerReminders(); }
    }
    function deleteTodo(i) { todos.splice(i, 1); localStorage.setItem('tincek_todos', JSON.stringify(todos)); renderTodos(); updateTickerReminders(); }

    // 6. SREĆA PORUKE
    const quotes = ["Sve što ti treba već je u tebi. Samo kreni!", "Danas je savršen dan za proboj barijera.", "Prepreke su samo nivoi u igri koje ćeš prijeći.", "Ti kontroliraš svoju matricu sudbine!"];
    function generateQuote() { document.getElementById('quote-text').innerText = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`; }

    // 7. RAČUNI LOGIKA
    let bills = JSON.parse(localStorage.getItem('tincek_bills')) || [];
    function renderBills() {
        const list = document.getElementById('bills-list'); list.innerHTML = '';
        bills.forEach((b, i) => { list.innerHTML += `<li><div><strong>${b.name}</strong> - ${b.amount} EUR<br><small>Rok: ${b.date}</small></div><button class="delete-btn" onclick="deleteBill(${i})">Plaćeno</button></li>`; });
    }
    function addBill() {
        const name = document.getElementById('bill-name').value; const amount = document.getElementById('bill-amount').value; const date = document.getElementById('bill-date').value;
        if(name && amount && date) { bills.push({name, amount, date}); localStorage.setItem('tincek_bills', JSON.stringify(bills)); renderBills(); updateTickerReminders(); document.getElementById('bill-name').value = ''; document.getElementById('bill-amount').value = ''; document.getElementById('bill-date').value = ''; }
    }
    function deleteBill(i) { bills.splice(i, 1); localStorage.setItem('tincek_bills', JSON.stringify(bills)); renderBills(); updateTickerReminders(); }

    // 8. ALARM PROTOKOL
    let activeAlarm = null;
    let alarmTriggered = false;
    function setAlarm() { 
        const time = document.getElementById('alarm-time').value; 
        if(time) { 
            activeAlarm = time; 
            alarmTriggered = false;
            document.getElementById('alarm-status').innerText = `✅ Alarm aktivan u: ${time}`; 
            document.getElementById('alarm-status').style.color = 'var(--neon-green)';
            localStorage.setItem('tincek_alarm', time);
            updateTickerReminders();
        } 
    }
    
    function cancelAlarm() {
        activeAlarm = null;
        alarmTriggered = false;
        document.getElementById('alarm-status').innerText = 'Alarm otkazan';
        document.getElementById('alarm-status').style.color = 'var(--neon-pink)';
        document.getElementById('alarm-display').style.display = 'none';
        localStorage.removeItem('tincek_alarm');
        updateTickerReminders();
    }
    
    window.addEventListener('load', () => {
        const savedAlarm = localStorage.getItem('tincek_alarm');
        if(savedAlarm) { activeAlarm = savedAlarm; document.getElementById('alarm-status').innerText = `✅ Alarm aktivan u: ${savedAlarm}`; }
    });
    
    setInterval(() => {
        if(activeAlarm && !alarmTriggered) {
            const now = new Date(); 
            const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            if(current === activeAlarm) { 
                alarmTriggered = true;
                playAlarmSound();
                showAlarmNotification();
                openScreen('screen-alarm');
            }
        }
    }, 1000);
    
    function playAlarmSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 2);
    }
    
    function showAlarmNotification() {
        document.getElementById('alarm-display').style.display = 'block';
        document.getElementById('alarm-trigger-time').innerText = `ALARM: ${activeAlarm}`;
        alert('🔔 VRIJEME JE ISTEKLO! Alarm: ' + activeAlarm);
    }

    // 9. KRIŽIĆ KRUŽIĆ (LOGIKA I SELEKTORI POPRAVLJENI)
    let board = ["", "", "", "", "", "", "", "", ""];
    function playerMove(i) { if(board[i] === "") { board[i] = "X"; updateBoard(); if(!checkWinner()) setTimeout(aiMove, 400); } }
    
    function aiMove() {
        let empty = board.map((c, i) => c === "" ? i : null).filter(v => v !== null);
        if(empty.length > 0) { board[empty[Math.floor(Math.random() * empty.length)]] = "O"; updateBoard(); checkWinner(); }
    }
    
    function updateBoard() { 
        const cells = document.querySelectorAll('#ttt-board .ttt-cell');
        board.forEach((val, i) => { 
            cells[i].innerText = val; 
            if(val === "X") cells[i].style.color = 'var(--neon-pink)'; 
            else if(val === "O") cells[i].style.color = 'var(--neon-cyan)'; 
        }); 
    }
    
    function checkWinner() {
        const patterns = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];
        for (let p of patterns) { if(board[p[0]] && board[p[0]] === board[p[1]] && board[p[0]] === board[p[2]]) { alert(`Pobjednik: ${board[p[0]]}`); resetGame(); return true; } }
        if(!board.includes("")) { alert("Izjednačeno!"); resetGame(); return true; }
        return false;
    }
    
    function resetGame() { 
        board = ["", "", "", "", "", "", "", "", ""]; 
        updateBoard(); 
        const cells = document.querySelectorAll('#ttt-board .ttt-cell');
        cells.forEach(c => c.innerText = ''); 
    }

    // 10. MULTIMEDIJSKI DNEVNIK
    function unlockDiary() {
        if(document.getElementById('diary-pin').value === "1234") {
            document.getElementById('diary-auth').style.display = 'none'; document.getElementById('diary-content').style.display = 'block';
            document.getElementById('diary-editor').innerHTML = localStorage.getItem('tincek_diary') || '';
        } else { alert("Krivi PIN."); }
    }
    function saveDiary() {
        localStorage.setItem('tincek_diary', document.getElementById('diary-editor').innerHTML); alert("Spremljeno!"); 
        document.getElementById('diary-pin').value = ''; document.getElementById('diary-auth').style.display = 'block'; document.getElementById('diary-content').style.display = 'none';
    }
    function insertHTMLAtCursor(html) {
        let sel, range;
        if (window.getSelection) {
            sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                range = sel.getRangeAt(0); range.deleteContents();
                let el = document.createElement("div"); el.innerHTML = html;
                let frag = document.createDocumentFragment(), node, lastNode;
                while ( (node = el.firstChild) ) { lastNode = frag.appendChild(node); }
                range.insertNode(frag);
                if (lastNode) { range = range.cloneRange(); range.setStartAfter(lastNode); range.collapse(true); sel.removeAllRanges(); sel.addRange(range); }
            }
        }
    }
    function insertMedia(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) { insertHTMLAtCursor(`<img src="${e.target.result}" alt="Media"><div><br></div>`); };
            reader.readAsDataURL(input.files[0]);
        }
        input.value = '';
    }
    function insertLink() {
        const url = prompt("Unesi URL:");
        if (url) {
            let vUrl = /^https?:\/\//i.test(url) ? url : 'https://' + url;
            const text = prompt("Tekst linka:", "Link");
            if (text) insertHTMLAtCursor(`<a href="${vUrl}" target="_blank">${text}</a> `);
        }
    }
