let allSectorsChart, top5SectorsBarChart, goalsPieChart, monthChart, goalsByMonthChart;
let currentData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 10;
const colors=['#5a8db8','#e74c3c','#e67e22','#7b8794','#3498db','#9b59b6','#27ae60','#f39c12','#c0392b','#16a085','#8e44ad','#2c3e50','#e67e22','#95a5a6','#34495e'];

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const errorMsg = document.getElementById('errorMsg');

const dateStartFilter = document.getElementById('dateStartFilter');
const dateEndFilter = document.getElementById('dateEndFilter');

// Datepicker feedback
dateStartFilter.addEventListener('click', () => dateStartFilter.showPicker && dateStartFilter.showPicker());
dateEndFilter.addEventListener('click', () => dateEndFilter.showPicker && dateEndFilter.showPicker());

dateStartFilter.addEventListener('change', () => {
    if(dateStartFilter.value){
        dateStartFilter.style.borderColor = '#2962FF';
        setTimeout(() => dateStartFilter.style.borderColor = '', 1000);
    }
});
dateEndFilter.addEventListener('change', () => {
    if(dateEndFilter.value){
        dateEndFilter.style.borderColor = '#2962FF';
        setTimeout(() => dateEndFilter.style.borderColor = '', 1000);
    }
});

// Upload file
uploadArea.onclick = () => fileInput.click();
uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('dragover'); });
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
uploadArea.addEventListener('drop', e => { e.preventDefault(); uploadArea.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); });
fileInput.addEventListener('change', e => handleFile(e.target.files[0]));


function getLocalImagePath(screenshotName){ return screenshotName?.trim() ? `images/${screenshotName.trim()}` : ''; }
function showImage(imagePath){ document.getElementById('imageModal').style.display='flex'; document.getElementById('modalImage').src=imagePath; }
function closeModal(){ document.getElementById('imageModal').style.display='none'; }
document.addEventListener('keydown', e => { if(e.key==='Escape') closeModal(); });


function handleFile(file){
    if(!file) return;
    errorMsg.textContent=''; fileInfo.textContent=`📁 Loading ${file.name}...`;
    const reader = new FileReader();
    reader.onload = function(e){
        try{
            const text = e.target.result;
            const firstLine = text.split('\n')[0];
            const delimiter = (firstLine.match(/\t/g)||[]).length > (firstLine.match(/,/g)||[]).length ? '\t' : ',';
            const lines = text.split('\n').filter(l => l.trim());
            if(lines.length<2){ errorMsg.textContent='⚠️ File is empty or has no data rows'; return; }

            function parseCSVLine(line, delim){
                let result=[], current='', inQuotes=false;
                for(let i=0;i<line.length;i++){
                    const char=line[i], next=line[i+1];
                    if(char=='"'){ inQuotes && next=='"' ? (current+='"', i++) : inQuotes=!inQuotes; }
                    else if(char==delim && !inQuotes){ result.push(current.trim()); current=''; }
                    else if(char!='\r') current+=char;
                }
                result.push(current.trim()); return result;
            }

            const headers=parseCSVLine(lines[0], delimiter);
            let siteIdx=-1,dateIdx=-1,sectorIdx=-1,goalIdx=-1,screenshotIdx=-1;
            headers.forEach((h,i)=>{
                const l=h.toLowerCase().trim();
                if(l.includes('site')||l.includes('sito')||l.includes('url')) siteIdx=i;
                if(l.includes('last')||l.includes('date')||l.includes('data')||l.includes('seen')) dateIdx=i;
                if(l.includes('sector')&&l.includes('attack')) sectorIdx=i;
                if(l.includes('goal')||l.includes('obiettivo')) goalIdx=i;
                if(l.includes('screenshot')||l.includes('image')||l.includes('foto')) screenshotIdx=i;
            });

            if(siteIdx==-1||sectorIdx==-1||goalIdx==-1){
                errorMsg.innerHTML=`⚠️ Required columns not found!<br>${headers.map((h,i)=>`${i}: "${h}"`).join('<br>')}`;
                return;
            }

            const data=[];
            for(let i=1;i<lines.length;i++){
                const values=parseCSVLine(lines[i], delimiter);
                let sector=values[sectorIdx]||'UNKNOWN', goal=values[goalIdx]||'UNKNOWN';
                if(sector.startsWith('http')||sector.includes('://')||sector.includes('drive.google')) sector='UNKNOWN';
                if(goal.startsWith('http')||goal.includes('://')||goal.includes('drive.google')) goal='UNKNOWN';
                if(values[siteIdx]){
                    data.push({site: values[siteIdx], date: dateIdx!==-1?values[dateIdx]:'', sector: sector.trim().toUpperCase(), goal: goal.trim().toUpperCase(), screenshot: screenshotIdx!==-1?values[screenshotIdx]:'', rowIndex:i});
                }
            }

            currentData=data; filteredData=data;
            fileInfo.textContent=`✓ Successfully loaded ${data.length} records`;
            document.getElementById('tableContainer').classList.add('active');
            document.getElementById('filterSection').classList.add('active');
            populateFilters(data); displayPage(filteredData,1); updateAllCharts(filteredData);

        }catch(err){ errorMsg.textContent='⚠️ Error: '+err.message; }
    };
    reader.onerror=()=>{ errorMsg.textContent='⚠️ Error reading file'; };
    reader.readAsText(file);
}


dateStartFilter.addEventListener('change', applyFilters);
dateEndFilter.addEventListener('change', applyFilters);
document.getElementById('sectorFilter').addEventListener('change', applyFilters);
document.getElementById('goalFilter').addEventListener('change', applyFilters);

document.getElementById('resetFiltersBtn').addEventListener('click', ()=>{
    dateStartFilter.value=''; dateEndFilter.value=''; document.getElementById('sectorFilter').value=''; document.getElementById('goalFilter').value='';
    applyFilters();
});

function applyFilters(){
    const dateStart=dateStartFilter.value, dateEnd=dateEndFilter.value;
    const sectorFilter=document.getElementById('sectorFilter').value;
    const goalFilter=document.getElementById('goalFilter').value;
    filteredData=currentData.filter(r=>{
        if(dateStart && r.date<dateStart) return false;
        if(dateEnd && r.date>dateEnd) return false;
        if(sectorFilter && r.sector!==sectorFilter) return false;
        if(goalFilter && r.goal!==goalFilter) return false;
        return true;
    });
    displayPage(filteredData,1); updateAllCharts(filteredData);
}

function populateFilters(data){
    const sectorSelect=document.getElementById('sectorFilter');
    const sectors=[...new Set(data.map(r=>r.sector))].sort();
    sectorSelect.innerHTML='<option value="">All Sectors</option>';
    sectors.forEach(s=>sectorSelect.appendChild(Object.assign(document.createElement('option'), {value:s,textContent:s})));

    const goalSelect=document.getElementById('goalFilter');
    const goals=[...new Set(data.map(r=>r.goal))].sort();
    goalSelect.innerHTML='<option value="">All Goals</option>';
    goals.forEach(g=>goalSelect.appendChild(Object.assign(document.createElement('option'), {value:g,textContent:g})));
}


document.getElementById('prevBtn').onclick=()=>{ if(currentPage>1){ currentPage--; displayPage(filteredData,currentPage); } };
document.getElementById('nextBtn').onclick=()=>{ const totalPages=Math.ceil(filteredData.length/rowsPerPage); if(currentPage<totalPages){ currentPage++; displayPage(filteredData,currentPage); } };

function displayPage(data,page){
    currentPage=page;
    const start=(page-1)*rowsPerPage;
    const end=start+rowsPerPage;
    const pageData=data.slice(start,end);
    const tbody=document.getElementById('tableBody');
    tbody.innerHTML='';
    pageData.forEach((row,idx)=>{
        const tr=document.createElement('tr');
        tr.innerHTML=`
            <td>${start+idx+1}</td>
            <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis" title="${row.site}">${row.site}</td>
            <td>${row.date}</td>
            <td>${row.sector}</td>
            <td>${row.goal}</td>
            <td>${row.screenshot?`<img src="${getLocalImagePath(row.screenshot)}" class="screenshot-thumb" onclick="showImage('${getLocalImagePath(row.screenshot)}')" alt="Screenshot">`:'-'}</td>
        `;
        tbody.appendChild(tr);
    });
    const totalPages=Math.ceil(data.length/rowsPerPage);
    document.getElementById('pageInfo').textContent=`Page ${page} of ${totalPages} (${data.length} records)`;
    document.getElementById('prevBtn').disabled=page===1;
    document.getElementById('nextBtn').disabled=page===totalPages||totalPages===0;
}

function updateAllCharts(data){
    updateSectorsPieChart(data);
    updateTop5SectorsBarChart(data);
    updateGoalsPieChart(data);
    updateMonthChart(data);
    updateGoalsByMonthChart(data);
}

function updateSectorsPieChart(data){
    const sectorCounts={};
    data.forEach(r=>sectorCounts[r.sector]=(sectorCounts[r.sector]||0)+1);
    const labels=Object.keys(sectorCounts);
    const values=Object.values(sectorCounts);
    if(allSectorsChart) allSectorsChart.destroy();
    const ctx=document.getElementById('allSectorsChart').getContext('2d');
    allSectorsChart=new Chart(ctx,{
        type:'doughnut',
        data:{labels:labels,datasets:[{data:values,backgroundColor:colors,borderColor:'#1a1d2e',borderWidth:3}]},
        options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{position:'bottom',labels:{color:'#c5c7d0',font:{size:10},padding:8,boxWidth:12}}}}
    });
}

function updateTop5SectorsBarChart(data){
    const sectorCounts={};
    data.forEach(r=>sectorCounts[r.sector]=(sectorCounts[r.sector]||0)+1);
    const sorted=Object.entries(sectorCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const labels=sorted.map(s=>s[0]);
    const values=sorted.map(s=>s[1]);
    if(top5SectorsBarChart) top5SectorsBarChart.destroy();
    const ctx=document.getElementById('top5SectorsBarChart').getContext('2d');
    top5SectorsBarChart=new Chart(ctx,{
        type:'bar',
        data:{labels:labels,datasets:[{label:'Attacks',data:values,backgroundColor:colors.slice(0,5),borderWidth:0}]},
        options:{responsive:true,maintainAspectRatio:true,scales:{y:{beginAtZero:true,ticks:{color:'#a0a4b8',font:{size:10}},grid:{color:'#2d3142'}},x:{ticks:{color:'#a0a4b8',font:{size:9},maxRotation:45,minRotation:45},grid:{display:false}}},plugins:{legend:{display:false}}}
    });
}

function updateGoalsPieChart(data){
    const goalCounts={};
    data.forEach(r=>goalCounts[r.goal]=(goalCounts[r.goal]||0)+1);
    const labels=Object.keys(goalCounts);
    const values=Object.values(goalCounts);
    if(goalsPieChart) goalsPieChart.destroy();
    const ctx=document.getElementById('goalsPieChart').getContext('2d');
    goalsPieChart=new Chart(ctx,{
        type:'doughnut',
        data:{labels:labels,datasets:[{data:values,backgroundColor:colors,borderColor:'#1a1d2e',borderWidth:3}]},
        options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{position:'bottom',labels:{color:'#c5c7d0',font:{size:10},padding:8,boxWidth:12}}}}
    });
}

function updateMonthChart(data){
    const monthCounts={};
    data.forEach(r=>{if(r.date){const month=r.date.substring(0,7);monthCounts[month]=(monthCounts[month]||0)+1;}});
    const sorted=Object.keys(monthCounts).sort();
    const labels=sorted;
    const values=sorted.map(m=>monthCounts[m]);
    if(monthChart) monthChart.destroy();
    const ctx=document.getElementById('monthChart').getContext('2d');
    monthChart=new Chart(ctx,{
        type:'line',
        data:{labels:labels,datasets:[{label:'ATTACKS',data:values,borderColor:'#5a8db8',backgroundColor:'rgba(90,141,184,0.1)',fill:true,tension:0.4,borderWidth:2,pointRadius:4,pointBackgroundColor:'#5a8db8',pointBorderColor:'#1a1d2e',pointBorderWidth:2}]},
        options:{responsive:true,maintainAspectRatio:true,scales:{y:{beginAtZero:true,ticks:{color:'#a0a4b8',font:{size:10}},grid:{color:'#2d3142'}},x:{ticks:{color:'#a0a4b8',font:{size:9},maxRotation:45,minRotation:45},grid:{color:'#2d3142'}}},plugins:{legend:{display:false}}}
    });
}

function updateGoalsByMonthChart(data){
    const goalByMonth={};
    const allGoals=new Set();
    data.forEach(r=>{if(r.date){const month=r.date.substring(0,7);if(!goalByMonth[month])goalByMonth[month]={};goalByMonth[month][r.goal]=(goalByMonth[month][r.goal]||0)+1;allGoals.add(r.goal);}});
    const months=Object.keys(goalByMonth).sort();
    const goalsList=Array.from(allGoals);
    const datasets=goalsList.map((goal,idx)=>({label:goal,data:months.map(m=>goalByMonth[m][goal]||0),borderColor:colors[idx%colors.length],backgroundColor:colors[idx%colors.length],fill:false,tension:0.4,borderWidth:2,pointRadius:3,pointBackgroundColor:colors[idx%colors.length],pointBorderColor:'#1a1d2e',pointBorderWidth:1}));
    if(goalsByMonthChart) goalsByMonthChart.destroy();
    const ctx=document.getElementById('goalsByMonthChart').getContext('2d');
    goalsByMonthChart=new Chart(ctx,{
        type:'line',
        data:{labels:months,datasets:datasets},
        options:{responsive:true,maintainAspectRatio:true,scales:{y:{beginAtZero:true,ticks:{color:'#a0a4b8',font:{size:10}},grid:{color:'#2d3142'}},x:{ticks:{color:'#a0a4b8',font:{size:9},maxRotation:45,minRotation:45},grid:{color:'#2d3142'}}},plugins:{legend:{position:'bottom',labels:{color:'#c5c7d0',font:{size:9},padding:6,boxWidth:10}}}}
    });
}

window.addEventListener('resize',()=>{if(filteredData.length>0){updateAllCharts(filteredData);}});
