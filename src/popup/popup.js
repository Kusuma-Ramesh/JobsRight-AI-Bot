const statusBadge = document.getElementById('statusBadge');
const statusText = document.getElementById('statusText');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const logList = document.getElementById('logList');

const companyValue = document.getElementById('companyValue');
const roleValue = document.getElementById('roleValue');
const matchValue = document.getElementById('matchValue');
const submittedValue = document.getElementById('submittedValue');
const skippedValue = document.getElementById('skippedValue');

function setStatus(state, label) {
  statusBadge.className = `status-pill ${state}`;
  statusText.textContent = label;
}

function appendLog(message) {
  const entry = document.createElement('li');
  entry.className = 'log-entry';
  entry.textContent = message;
  logList.prepend(entry);
}

function updateStats() {
  companyValue.textContent = 'Northwind Labs';
  roleValue.textContent = 'Product Designer';
  matchValue.textContent = '92%';
  submittedValue.textContent = '3';
  skippedValue.textContent = '1';
}

startBtn.addEventListener('click', () => {
  setStatus('running', 'Running');
  updateStats();
  appendLog('Start requested from popup UI.');
});

stopBtn.addEventListener('click', () => {
  setStatus('paused', 'Paused');
  appendLog('Stop requested from popup UI.');
});

setStatus('idle', 'Idle');
updateStats();
appendLog('Popup ready.');
