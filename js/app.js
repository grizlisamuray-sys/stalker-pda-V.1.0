const API_URL = 'https://script.google.com/macros/s/AKfycbwBUyX3lDvEhtTo8bS59mC0r2Yesb5X7STXyO0yQMxI4QTaS9HV5NUh7DiDZDOnWHBu4A/exec'; // ← ваш URL
let PLAYER_CODE = localStorage.getItem('playerCode') || '';
const app = document.getElementById('app');

// Глобальная переменная для профиля (обязательно!)
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

async function initApp() {
  const isMaster = (PLAYER_CODE === 'MASTER');

  // Загружаем профиль до рендеринга
  if (!isMaster) {
    try {
      const profiles = await fetchData('Профили');
      myProfile = profiles.find(p => p.code === PLAYER_CODE) || null;
    } catch (e) {
      myProfile = null;
    }
  }

  // Теперь myProfile точно объявлен и может использоваться в шаблоне
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

  setInterval(updateTime, 1000); updateTime();
  loadTasks(); loadRumors(); loadChat(); loadWiki(); loadInventory();
  loadReputation();
  if (isMaster) populatePlayerSelects();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
}

// --- Остальные функции (переключение, fetch, загрузка и т.д.) – оставьте без изменений ---
// ... весь остальной код из предыдущего комплекта (switchTab, fetchData, loadTasks, loadRumors, loadChat, sendMessage, loadWiki, loadInventory, loadReputation, changeReputation, showProfileModal, closeModal, мастер-функции)
