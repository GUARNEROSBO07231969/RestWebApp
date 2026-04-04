let chart, editId=null;
function fmt(v){return '$'+Number(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
function recalcTotal(){const c=+cashAmount.value||0, v=+visaAmount.value||0, s=+spentAmount.value||0;calcTotal.value=fmt(c+v-s)}
 
// Center color plugin: fill center of pie with Total KPI color
Chart.register({
  id: 'centerColor',
  beforeDraw: function(chart) {
    if ((chart.config.type === 'doughnut' || chart.config.type === 'pie') && chart.options.cutout) {
      const {ctx, chartArea: area} = chart;
      const cutout = chart.options.cutout;
      const cutoutPx = typeof cutout === 'string' && cutout.endsWith('%')
        ? (parseFloat(cutout) / 100) * (area.right - area.left) / 2
        : cutout / 2;
      const centerX = (area.left + area.right) / 2;
      const centerY = (area.top + area.bottom) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, cutoutPx, 0, 2 * Math.PI);
      ctx.fillStyle = '#9333ea'; // Total KPI color
      ctx.fill();
      ctx.restore();
    }
  }
});


// Theme persistence
defaultThemeLoad();
function defaultThemeLoad(){document.addEventListener('DOMContentLoaded',()=>{const t=localStorage.getItem('theme')||'light';document.documentElement.setAttribute('data-theme',t);const tg=document.getElementById('themeToggle');if(tg) tg.checked=t==='dark';});}
function toggleTheme(el){const t=el.checked?'dark':'light';document.documentElement.setAttribute('data-theme',t);localStorage.setItem('theme',t)}

// Center text plugin: show TOTAL only
const centerText={id:'centerText',afterDraw(c){const {ctx,chartArea:{left,right,top,bottom}}=c;ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=getComputedStyle(document.body).color;ctx.font='bold 18px Inter, system-ui';ctx.fillText(totalVal.textContent,(left+right)/2,(top+bottom)/2);ctx.restore();}};

// Load restaurants then data
async function loadRestaurants(){
  const r=await fetch('/api/restaurants').then(r=>r.json());
  const sel=document.getElementById('restaurantSelect');
  sel.innerHTML='';
  r.forEach(x=>{
    const o=document.createElement('option');
    o.value=x.id;
    o.text=x.name;
    sel.appendChild(o)
  });
  if(r.length){
    sel.value=r[0].id;
    loadData();
  }
}

let currentPage = 1, pageSize = 10, allData = [], filteredData = [];

async function loadData(){
  const id=document.getElementById('restaurantSelect').value;
  allData = await fetch('/api/sales?restaurantId='+id).then(r=>r.json());
  filteredData = allData.slice();
  currentPage = 1;
  renderTable();
}

let searchTerm = '';

function setupSearchInput() {
  const container = document.getElementById('search-container');
  if (!container) return;
  container.innerHTML = `<input id="searchInput" type="text" placeholder="Search..." class="search-input" style="margin-bottom:8px;min-width:200px;max-width:300px;padding:4px 10px;font-size:14px;border-radius:6px;border:1px solid #ccc;" />`;
  document.getElementById('searchInput').addEventListener('input', e => {
    searchTerm = e.target.value.trim().toLowerCase();
    currentPage = 1;
    renderTable();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadRestaurants();
  setupSearchInput();
});

function getFilteredData() {
  if (!searchTerm) return allData;
  return allData.filter(x => {
    return (
      (x.date && x.date.toLowerCase().includes(searchTerm)) ||
      (x.storeName && x.storeName.toLowerCase().includes(searchTerm)) ||
      (x.cashAmount && fmt(x.cashAmount).toLowerCase().includes(searchTerm)) ||
      (x.visaAmount && fmt(x.visaAmount).toLowerCase().includes(searchTerm)) ||
      (x.spent && fmt(x.spent).toLowerCase().includes(searchTerm)) ||
      (x.totalAmount && fmt(x.totalAmount).toLowerCase().includes(searchTerm))
    );
  });
}

function filterTable() {
  const input = document.getElementById('tableSearch');
  searchTerm = input ? input.value.trim().toLowerCase() : '';
  currentPage = 1;
  renderTable();
}

function renderTable() {
  const rows = document.getElementById('rows');
  const pagination = document.getElementById('pagination');
  const grandTotalContainer = document.getElementById('grand-total-row-container');
  let c=0,v=0,s=0,t=0;
  const filteredData = getFilteredData();
  // Calculate grand totals from filteredData
  filteredData.forEach(x=>{
    c+=x.cashAmount;v+=x.visaAmount;s+=x.spent;t+=x.totalAmount;
  });
  const start = (currentPage-1)*pageSize;
  const pageData = filteredData.slice(start, start+pageSize);
  rows.innerHTML = '';
  pageData.forEach(x=>{
    rows.innerHTML+=`<tr><td>${x.date??''}</td><td>${fmt(x.cashAmount)}</td><td>${fmt(x.visaAmount)}</td><td>${x.storeName??''}</td><td>${fmt(x.spent)}</td><td>${fmt(x.totalAmount)}</td><td><button class="action-btn edit-btn" onclick="editTx(${x.id},${x.cashAmount},${x.visaAmount},'${x.storeName??''}',${x.spent})">Edit</button> <button class="action-btn delete-btn" onclick="delTx(${x.id})">Delete</button></td></tr>`
  });
  // Always show grand total row below the table
  grandTotalContainer.innerHTML = `<table class='modern' style='margin-top:0'><tr class='grand-total-row'><td colspan='1'><b>Grand Total</b></td><td><b>${fmt(c)}</b></td><td><b>${fmt(v)}</b></td><td></td><td><b>${fmt(s)}</b></td><td><b>${fmt(t)}</b></td><td></td></tr></table>`;
  renderPagination(filteredData.length);
  updateSortIndicators();
  cashVal.textContent=fmt(c);visaVal.textContent=fmt(v);spentVal.textContent=fmt(s);totalVal.textContent=fmt(t);
  if(chart) chart.destroy();
  const tt = t || 1;
  chart=new Chart(document.getElementById('pie'),{type:'doughnut',data:{datasets:[{data:[c,v,s],backgroundColor:['#22c55e','#2563eb','#f97316']}]},options:{cutout:'70%',plugins:{legend:{display:false},tooltip:{callbacks:{label:(ctx)=> Math.round((ctx.raw/tt)*100)+'%'}}}},plugins:[centerText]});
}

function renderPagination(dataLength) {
  const pagination = document.getElementById('pagination');
  const pageCount = Math.ceil((dataLength ?? getFilteredData().length) / pageSize);
  let html = '';
  if (pageCount > 1) {
    html += `<button onclick="gotoPage(${currentPage-1})" ${currentPage===1?'disabled':''}>Prev</button>`;
    for(let i=1;i<=pageCount;i++) {
      html += `<button onclick="gotoPage(${i})" ${i===currentPage?'style=\'font-weight:bold\'':''}>${i}</button>`;
    }
    html += `<button onclick="gotoPage(${currentPage+1})" ${currentPage===pageCount?'disabled':''}>Next</button>`;
  }
  pagination.innerHTML = html;
}

function gotoPage(page) {
  const pageCount = Math.ceil(getFilteredData().length / pageSize);
  if(page < 1 || page > pageCount) return;
  currentPage = page;
  renderTable();
}

function editTx(id,c,v,store,s){editId=id;cashAmount.value=c;visaAmount.value=v;storeName.value=store||'';spentAmount.value=s;recalcTotal()}
function cancelEdit(){editId=null;cashAmount.value='';visaAmount.value='';storeName.value='';spentAmount.value='';calcTotal.value=''}

async function saveTx(){const body={restaurantId:+restaurantSelect.value,cashAmount:+cashAmount.value||0,visaAmount:+visaAmount.value||0,storeName:storeName.value||null,spent:+spentAmount.value||0};
  if(editId){await fetch('/api/sales/'+editId,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}else{await fetch('/api/sales',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}cancelEdit();await loadData();}
async function delTx(id){await fetch('/api/sales/'+id,{method:'DELETE'});await loadData();}

document.addEventListener('DOMContentLoaded',loadRestaurants);

let sortColumn = null, sortAsc = true;

function updateSortIndicators() {
  const columns = ['date','cashAmount','visaAmount','storeName','spent','totalAmount'];
  columns.forEach(col => {
    const el = document.getElementById('sort-' + col);
    if (!el) return;
    if (sortColumn === col) {
      el.textContent = sortAsc ? '▲' : '▼';
      el.style.color = '#2563eb';
      el.style.fontWeight = 'bold';
      el.style.marginLeft = '2px';
    } else {
      el.textContent = '';
    }
  });
}

function sortTable(column) {
  if (sortColumn === column) {
    sortAsc = !sortAsc;
  } else {
    sortColumn = column;
    sortAsc = true;
  }
  allData.sort((a, b) => {
    let av = a[column], bv = b[column];
    if (column === 'storeName' || column === 'date') {
      av = av ? av.toString().toLowerCase() : '';
      bv = bv ? bv.toString().toLowerCase() : '';
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    } else {
      av = Number(av) || 0;
      bv = Number(bv) || 0;
      return sortAsc ? av - bv : bv - av;
    }
  });
  currentPage = 1;
  renderTable();
  updateSortIndicators();
}
