// =======================
// VARIABILI GLOBALI
// =======================
let allSectorsChart, top5SectorsBarChart, goalsPieChart, monthChart, goalsByMonthChart;
let currentData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 10;

const colors = [
  '#5a8db8','#e74c3c','#e67e22','#7b8794','#3498db',
  '#9b59b6','#27ae60','#f39c12','#c0392b','#16a085',
  '#8e44ad','#2c3e50','#95a5a6','#34495e'
];

// =======================
// DOM ELEMENTS
// =======================
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const errorMsg = document.getElementById('errorMsg');

const allSectorsChartEl = document.getElementById('allSectorsChartEl');
const top5SectorsBarChartEl = document.getElementById('top5SectorsBarChartEl');
const goalsPieChartEl = document.getElementById('goalsPieChartEl');
const monthChartEl = document.getElementById('monthChartEl');
const goalsByMonthChartEl = document.getElementById('goalsByMonthChartEl');

// =======================
// CSV UPLOAD
// =======================
uploadArea.onclick = () => fileInput.click();
uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('dragover'); });
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
uploadArea.addEventListener('drop', e => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

function handleFile(file) {
  if (!file) return;
  errorMsg.textContent = '';
  fileInfo.textContent = `📁 Loading ${file.name}...`;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length === 0) throw new Error('CSV vuoto');

      // Determina separatore
      const delimiter = lines[0].includes('\t') ? '\t' : ',';
      const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());

      console.log('Headers trovati:', headers);

      // Mapping colonne reali del tuo CSV
      const siteIdx = headers.findIndex(h => h.includes('site') || h.includes('url'));
      const dateIdx = headers.findIndex(h => h.includes('last seen'));
      const sectorIdx = headers.findIndex(h => h.includes('sector attacked'));
      const goalIdx = headers.findIndex(h => h.includes('attack goal'));

      if (siteIdx === -1 || sectorIdx === -1 || goalIdx === -1) {
        errorMsg.textContent = '❌ CSV columns not valid. Devono esserci Site, SECTOR ATTACKED, ATTACK GOAL';
        return;
      }

      currentData = lines.slice(1).map(line => {
        const v = line.split(delimiter).map(x => x.trim());
        
        // Converte data da DD/MM/YYYY HH:MM -> YYYY-MM-DD
        let formattedDate = '';
        if (v[dateIdx]) {
          const parts = v[dateIdx].split(' ')[0].split('/');
          if (parts.length === 3) formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }

        return {
          site: v[siteIdx] || '',
          date: formattedDate,
          sector: (v[sectorIdx] || '').toUpperCase(),
          goal: (v[goalIdx] || '').toUpperCase()
        };
      });

      console.log('Dati caricati:', currentData);

      if (currentData.length === 0) {
        errorMsg.textContent = '❌ Nessun dato trovato nel CSV';
        return;
      }

      filteredData = currentData;
      fileInfo.textContent = `✓ Loaded ${currentData.length} rows`;
      displayPage(filteredData, 1);
      updateAllCharts(filteredData);

    } catch (err) {
      console.error(err);
      errorMsg.textContent = '❌ Error reading CSV: ' + err.message;
    }
  };

  reader.onerror = () => {
    errorMsg.textContent = '❌ Unable to read file';
  };

  reader.readAsText(file);
}

// =======================
// TABLE
// =======================
function displayPage(data, page) {
  currentPage = page;
  const start = (page - 1) * rowsPerPage;
  const pageData = data.slice(start, start + rowsPerPage);

  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  pageData.forEach((r, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${start + i + 1}</td>
        <td>${r.site}</td>
        <td>${r.date}</td>
        <td>${r.sector}</td>
        <td>${r.goal}</td>
      </tr>
    `;
  });
}

// =======================
// BASE LINE OPTIONS
// =======================
function baseLineOptions(showLegend = false) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    elements: { point: { radius: 0, hoverRadius: 4 } },
    scales: {
      x: { ticks: { autoSkip: true, maxTicksLimit: 6, color: '#a0a4b8', font: { size: 9 } }, grid: { color: '#2d3142' } },
      y: { beginAtZero: true, ticks: { color: '#a0a4b8', font: { size: 10 } }, grid: { color: '#2d3142' } }
    },
    plugins: {
      legend: showLegend ? {
        position: 'bottom',
        labels: { color: '#c5c7d0', font: { size: 9 }, boxWidth: 10 }
      } : { display: false }
    }
  };
}

// =======================
// CHARTS
// =======================
function updateSectorsPieChart(data) {
  const c = {}; data.forEach(r => c[r.sector] = (c[r.sector] || 0) + 1);
  if (allSectorsChart) allSectorsChart.destroy();
  allSectorsChart = new Chart(allSectorsChartEl, {
    type: 'doughnut',
    data: { labels: Object.keys(c), datasets: [{ data: Object.values(c), backgroundColor: colors }] },
    options: { responsive: true }
  });
}

function updateTop5SectorsBarChart(data) {
  const c = {}; data.forEach(r => c[r.sector] = (c[r.sector] || 0) + 1);
  const s = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (top5SectorsBarChart) top5SectorsBarChart.destroy();
  top5SectorsBarChart = new Chart(top5SectorsBarChartEl, {
    type: 'bar',
    data: { labels: s.map(x => x[0]), datasets: [{ data: s.map(x => x[1]), backgroundColor: colors }] },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

function updateGoalsPieChart(data) {
  const c = {}; data.forEach(r => c[r.goal] = (c[r.goal] || 0) + 1);
  if (goalsPieChart) goalsPieChart.destroy();
  goalsPieChart = new Chart(goalsPieChartEl, {
    type: 'doughnut',
    data: { labels: Object.keys(c), datasets: [{ data: Object.values(c), backgroundColor: colors }] },
    options: { responsive: true }
  });
}

function updateMonthChart(data) {
  const m = {};
  data.forEach(r => { if (r.date) { const k = r.date.substring(0, 7); m[k] = (m[k] || 0) + 1; } });
  const labels = Object.keys(m).sort();
  if (monthChart) monthChart.destroy();
  monthChart = new Chart(monthChartEl, {
    type: 'line',
    data: { labels, datasets: [{ data: labels.map(l => m[l]), borderColor: '#5a8db8', backgroundColor: 'rgba(90,141,184,.15)', fill: true, tension: .4, borderWidth: 2 }] },
    options: baseLineOptions(false)
  });
}

function updateGoalsByMonthChart(data) {
  const map = {}, goals = new Set();
  data.forEach(r => {
    if (r.date) {
      const m = r.date.substring(0, 7);
      if (!map[m]) map[m] = {};
      map[m][r.goal] = (map[m][r.goal] || 0) + 1;
      goals.add(r.goal);
    }
  });
  const months = Object.keys(map).sort();
  const datasets = [...goals].map((g, i) => ({
    label: g,
    data: months.map(m => map[m][g] || 0),
    borderColor: colors[i % colors.length],
    tension: .4,
    borderWidth: 2,
    fill: false
  }));
  if (goalsByMonthChart) goalsByMonthChart.destroy();
  goalsByMonthChart = new Chart(goalsByMonthChartEl, {
    type: 'line',
    data: { labels: months, datasets },
    options: baseLineOptions(true)
  });
}

function updateAllCharts(data) {
  updateSectorsPieChart(data);
  updateTop5SectorsBarChart(data);
  updateGoalsPieChart(data);
  updateMonthChart(data);
  updateGoalsByMonthChart(data);
}
