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
document.getElementById('nextBtn').onclick=()=>{ const total=Mat
