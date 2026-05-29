const API_URL = 'https://script.google.com/macros/s/AKfycbzjOZOslRNEptOV6EkNcEGMOxAyIMAcNmA5ajGPeHqpV9lZgMf8Au0LE6tAOqVuDQssow/exec'; // ваш URL
let PLAYER_CODE = localStorage.getItem('playerCode') || '';
const app = document.getElementById('app');
let myProfile = null;

if (!PLAYER_CODE) {
  showLoginScreen();
} else {
  initApp();
}

function showLoginScreen() {
  app.innerHTML = `<div style="padding:20px;text-align:center">
    <h2>ВВЕДИТЕ КОД СТАЛКЕРА</h2>
    <input id="codeInput" maxlength="6" placeholder="XXXX"><br><br>
    <button onclick="saveCode()">ВОЙТИ</button></div>`;
}

function saveCode() {
  const code = document.getElementById('codeInput').value.trim().toUpperCase();
  if (code) {
    PLAYER_CODE = code;
    localStorage.setItem('playerCode', code);
    location.reload();
  }
}

// Вспомогательные функции (должны быть объявлены ДО initApp)
function switchTab(id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function updateTime() {
  const el = document.getElementById('time');
  if (el) el.textContent = new Date().toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' });
}

async function fetchData(sheetName) {
  try {
    const resp = await fetch(`${API_URL}?sheet=${sheetName}&code=${PLAYER_CODE}`);
    return await resp.json();
  } catch (err) {
    return JSON.parse(localStorage.getItem(`cache_${sheetName}`) || '[]');
  }
}

async function initApp() {
  const isMaster = (PLAYER_CODE === 'MASTER');

  // Загружаем профиль (если не мастер)
  if (!isMaster) {
    try {
      const profiles = await fetchData('Профили');
      myProfile = profiles.find(p => p.code === PLAYER_CODE) || null;
    } catch (e) {
      myProfile = null;
    }
  }

  // Строим интерфейс
  app.innerHTML = `
    <div id="profileModal" class="modal" style="display:none">
      <div class="modal-content">
        <span class="close" onclick="closeModal()">&times;</span>
        <img id="modalPhoto" src="" style="width:100px;height:100px;border-radius:10px;">
        <h3 id="modalName"></h3>
        <p id="modalInfo"></p>
      </div>
    </div>
    <header>
      <div style="display:flex; align-items:center; gap:10px;">
        <img id="myAvatar" src="${myProfile?.photo || 'assets/icons/icon-192.png'}" style="width:40px;height:40px;border-radius:50%;">
        <span id="myName">${myProfile?.pozivnoy || PLAYER_CODE}</span>
      </div>
      <div id="time">--:--</div>
      <button onclick="localStorage.removeItem('playerCode');location.reload()" style="background:none;border:none;color:var(--text)">✕</button>
    </header>
    <nav>
      <button onclick="switchTab('svodka')">СВОДКА</button>
      <button onclick="switchTab('tasks')">ЗАДАЧИ</button>
      <button onclick="switchTab('reputation')">РЕПУТАЦИЯ</button>
      <button onclick="switchTab('map')">КАРТА</button>
      <button onclick="switchTab('rumors')">СЛУХИ</button>
      <button onclick="switchTab('chat')">ЧАТ</button>
      <button onclick="switchTab('wiki')">ЭНЦИКЛОПЕДИЯ</button>
      <button onclick="switchTab('inventory')">ИНВЕНТАРЬ</button>
      ${isMaster ? '<button onclick="switchTab(\'master\')">УПРАВЛЕНИЕ</button>' : ''}
    </nav>
    <main>
      <section id="svodka" class="tab active"><div class="welcome">Код: ${PLAYER_CODE}</div><div id="alerts"></div></section>
      <section id="tasks" class="tab"><ul id="task-list"></ul></section>
      <section id="reputation" class="tab">
        <h3>ЛИЧНАЯ РЕПУТАЦИЯ</h3><ul id="personal-rep-list"></ul><div id="rep-controls"></div>
        <h3>РЕПУТАЦИЯ У ФРАКЦИЙ</h3><ul id="faction-rep-list"></ul>
      </section>
      <section id="map" class="tab"><img id="map-image" src="assets/map-placeholder.jpg" alt="Карта"></section>
      <section id="rumors" class="tab"><ul id="rumor-list"></ul></section>
      <section id="chat" class="tab"><ul id="chat-list"></ul><div style="display:flex;gap:5px;padding:5px"><input id="chatInput" placeholder="Сообщение..."><button onclick="sendMessage()">></button></div></section>
      <section id="wiki" class="tab"><ul id="wiki-list"></ul></section>
      <section id="inventory" class="tab"><ul id="inventory-list"></ul></section>
      ${isMaster ? `
      <section id="master" class="tab">
        <h3>ИНСТРУМЕНТЫ МАСТЕРА</h3>
        <div>
          <button onclick="announceEmission()">ОБЪЯВИТЬ ВЫБРОС</button>
          <input id="emissionMessage" placeholder="Текст выброса">
        </div>
        <hr>
        <div>
          <button onclick="createQuest()">СОЗДАТЬ ЗАДАНИЕ</button>
          <input id="questTitle" placeholder="Название">
          <input id="questDesc" placeholder="Описание">
          <input id="questReward" placeholder="Награда">
          <select id="questTarget"><option value="">Всем</option></select>
        </div>
        <hr>
        <div>
          <button onclick="updateFactionRep()">ИЗМЕНИТЬ РЕПУТАЦИЮ ФРАКЦИИ</button>
          <select id="factionSelect">
            <option value="Долг">Долг</option><option value="Свобода">Свобода</option>
            <option value="Бандиты">Бандиты</option><option value="Наёмники">Наёмники</option>
            <option value="Монолит">Монолит</option><option value="Учёные">Учёные</option>
            <option value="Вольные">Вольные</option>
          </select>
          <select id="repPlayerSelect"></select>
          <input id="repAmount" type="number" placeholder="Значение">
          <input id="repReason" placeholder="Причина">
        </div>
        <hr>
        <div>
          <button onclick="sendRumor()">ОТПРАВИТЬ СЛУХ</button>
          <input id="rumorText" placeholder="Текст слуха">
          <select id="rumorTarget"><option value="">Всем</option></select>
        </div>
      </section>` : ''}
    </main>`;

  // Запуск часов и загрузка данных
  setInterval(updateTime, 1000);
  updateTime();
  loadTasks();
  loadRumors();
  loadChat();
  loadWiki();
  loadInventory();
  loadReputation();
  if (isMaster) populatePlayerSelects();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
}

// --- Загрузчики контента ---
async function loadTasks() {
  const data = await fetchData('Квесты');
  const list = document.getElementById('task-list'); if(!list) return;
  list.innerHTML = data.map(t => `<li><strong>${t[1]||''}</strong><br>${t[5]||''}</li>`).join('');
  localStorage.setItem('cache_Квесты', JSON.stringify(data));
}

async function loadRumors() {
  const data = await fetchData('Слухи и события');
  const list = document.getElementById('rumor-list'); if(!list) return;
  list.innerHTML = data.map(r => `<li>${r[2]||''}</li>`).join('');
  localStorage.setItem('cache_Слухи и события', JSON.stringify(data));
}

async function loadChat() {
  const data = await fetchData('Чат');
  const list = document.getElementById('chat-list'); if(!list) return;
  list.innerHTML = data.map(m => {
    const senderCode = m[3] || '';
    return `<li><small>${m[0]||''} <b><a href="javascript:void(0)" onclick="showProfileModal('${senderCode}')">${m[1]||''}</a></b></small>: ${m[2]||''}</li>`;
  }).join('');
  list.scrollTop = list.scrollHeight;
  localStorage.setItem('cache_Чат', JSON.stringify(data));
}

async function sendMessage() {
  const input = document.getElementById('chatInput'); const text = input.value.trim(); if(!text) return;
  input.value = '';
  await fetch(API_URL, { method:'POST', body: JSON.stringify({ action:'addChat', code:PLAYER_CODE, message:text }) });
  loadChat();
}

async function loadWiki() {
  const data = await fetchData('Энциклопедия');
  const list = document.getElementById('wiki-list'); if(!list) return;
  list.innerHTML = data.map(e => `<li><strong>${e[0]||''}</strong><br>${e[1]||''}</li>`).join('');
  localStorage.setItem('cache_Энциклопедия', JSON.stringify(data));
}

async function loadInventory() {
  const data = await fetchData('Инвентарь');
  const list = document.getElementById('inventory-list'); if(!list) return;
  list.innerHTML = data.map(i => `<li>${i[1]||''} (${i[2]||0})</li>`).join('');
  localStorage.setItem('cache_Инвентарь', JSON.stringify(data));
}

// --- Репутация ---
async function loadReputation() {
  const personal = await fetchData('Репутация');
  const personalList = document.getElementById('personal-rep-list');
  const controls = document.getElementById('rep-controls');
  if (personalList) {
    let total = 0;
    personalList.innerHTML = personal.map(r => {
      total += r.value;
      return `<li><a href="javascript:void(0)" onclick="showProfileModal('${r.fromCode}')">${r.fromName}</a>: ${r.value>0?'+'+r.value:r.value}</li>`;
    }).join('');
    personalList.innerHTML += `<li><strong>Общий баланс: ${total>0?'+'+total:total}</strong></li>`;
  }
  if (controls) {
    controls.innerHTML = `
      <select id="repTarget"><option value="">Выберите сталкера</option></select>
      <input id="repReasonInput" placeholder="Причина">
      <button onclick="changeReputation(1)">+ Доверие</button>
      <button onclick="changeReputation(-1)">− Недоверие</button>
    `;
    try {
      const playersResp = await fetch(`${API_URL}?sheet=Игроки&code=`);
      const players = await playersResp.json();
      const select = document.getElementById('repTarget');
      players.forEach(p => { if(p[0] !== PLAYER_CODE) { const opt = document.createElement('option'); opt.value = p[0]; opt.textContent = p[1]; select.appendChild(opt); } });
    } catch(e) {}
  }
  const faction = await fetchData('ФракционнаяРепутация');
  const factionList = document.getElementById('faction-rep-list');
  if (factionList) {
    factionList.innerHTML = faction.map(f => {
      const rep = f.reputation || 0;
      let color = rep >= 500 ? '#33ff33' : rep <= -500 ? '#ff3333' : '#ffaa00';
      return `<li style="color:${color}">${f.faction}: ${rep>0?'+'+rep:rep}</li>`;
    }).join('');
    if (faction.length === 0) factionList.innerHTML = '<li>Нет данных</li>';
  }
}

async function changeReputation(amount) {
  const target = document.getElementById('repTarget').value;
  const reason = document.getElementById('repReasonInput').value.trim();
  if (!target) return;
  await fetch(API_URL, { method:'POST', body: JSON.stringify({ action:'updateReputation', fromCode:PLAYER_CODE, toCode:target, amount, reason }) });
  loadReputation();
}

// --- Профиль ---
async function showProfileModal(code) {
  if (!code) return;
  const profiles = await fetchData('Профили');
  const profile = profiles.find(p => p.code === code);
  if (!profile) return;
  document.getElementById('modalPhoto').src = profile.photo || 'assets/icons/icon-192.png';
  document.getElementById('modalName').textContent = profile.pozivnoy + (profile.fio ? ' (' + profile.fio + ')' : '');
  document.getElementById('modalInfo').textContent = profile.info || 'Информация отсутствует';
  document.getElementById('profileModal').style.display = 'block';
}

function closeModal() {
  document.getElementById('profileModal').style.display = 'none';
}
window.onclick = function(event) {
  if (event.target == document.getElementById('profileModal')) closeModal();
}

// --- Мастерские функции ---
async function populatePlayerSelects() {
  const playersResp = await fetch(`${API_URL}?sheet=Игроки&code=`);
  const players = await playersResp.json();
  const selects = ['questTarget', 'repPlayerSelect', 'rumorTarget'];
  selects.forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;
    players.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p[0];
      opt.textContent = p[1] + ' (' + p[2] + ')';
      select.appendChild(opt);
    });
  });
}

async function announceEmission() {
  const msg = document.getElementById('emissionMessage').value || 'Внимание! Выброс!';
  await fetch(API_URL, { method:'POST', body: JSON.stringify({ action:'announceEmission', code:'MASTER', message:msg }) });
  alert('Выброс объявлен!');
}

async function createQuest() {
  const title = document.getElementById('questTitle').value;
  const desc = document.getElementById('questDesc').value;
  const reward = document.getElementById('questReward').value;
  const target = document.getElementById('questTarget').value;
  if (!title) return alert('Введите название');
  await fetch(API_URL, { method:'POST', body: JSON.stringify({ action:'createQuest', code:'MASTER', title, description:desc, reward, targetCode:target }) });
  alert('Задание создано!');
  document.getElementById('questTitle').value = ''; document.getElementById('questDesc').value = ''; document.getElementById('questReward').value = '';
}

async function updateFactionRep() {
  const player = document.getElementById('repPlayerSelect').value;
  const faction = document.getElementById('factionSelect').value;
  const amount = parseInt(document.getElementById('repAmount').value) || 0;
  const reason = document.getElementById('repReason').value;
  if (!player || !faction || amount === 0) return alert('Заполните все поля');
  await fetch(API_URL, { method:'POST', body: JSON.stringify({ action:'updateFactionRep', code:'MASTER', playerCode:player, faction, amount, reason }) });
  alert('Репутация изменена!');
  loadReputation();
}

async function sendRumor() {
  const text = document.getElementById('rumorText').value;
  const target = document.getElementById('rumorTarget').value;
  if (!text) return alert('Введите текст слуха');
  await fetch(API_URL, { method:'POST', body: JSON.stringify({ action:'sendRumor', code:'MASTER', text, targetCode:target }) });
  alert('Слух отправлен!');
  document.getElementById('rumorText').value = '';
}
