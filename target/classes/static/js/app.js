let chart, editId = null;
const expenseAmount = document.getElementById('expenseAmount');
function fmt(v){return '$'+Number(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
function recalcTotal(){
  const c=+cashAmount.value||0, v=+visaAmount.value||0, d=+doordashAmount.value||0, g=+grubhubAmount.value||0, u=+ubereatsAmount.value||0, o=+onlineAmount.value||0, s=+expenseAmount.value||0;
  calcTotal.value=fmt(c+v+d+g+u+o+s);
}
 
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

// Center text plugin: show TOTAL AMOUNT only
const centerText={id:'centerText',afterDraw(c){const {ctx,chartArea:{left,right,top,bottom}}=c;ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=getComputedStyle(document.body).color;ctx.font='bold 18px Inter, system-ui';ctx.fillText('Total Amount', (left+right)/2, (top+bottom)/2-12);ctx.fillText(totalVal.textContent,(left+right)/2,(top+bottom)/2+12);ctx.restore();}};

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

let currentPage = 1, pageSize = 15, allData = [], filteredData = [];

async function loadData(){
  const id=document.getElementById('restaurantSelect').value;
  allData = await fetch('/api/sales?restaurantId='+id).then(r=>r.json());
  // Sort by date/time descending on initial load only
  allData.sort((a, b) => {
    const ad = a.date ? new Date(a.date) : new Date(0);
    const bd = b.date ? new Date(b.date) : new Date(0);
    if (bd - ad !== 0) return bd - ad;
    return (b.id || 0) - (a.id || 0);
  });
  filteredData = allData.slice();
  currentPage = 1;
  renderTable();
}

let searchTerm = '', dateFrom = '', dateTo = '';

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

  // --- KPI tooltip logic for Grand Gross Net Amount ---
  const netVal = document.getElementById('netVal');
  const tooltip = document.getElementById('netKpiTooltip');
  let hideTimer = null;
  if (netVal && tooltip) {
    netVal.addEventListener('mouseenter', () => {
      // Calculate cash and visa percentages from current KPI values
      let c = 0, v = 0;
      const filteredData = getFilteredData();
      filteredData.forEach(x => {
        c += x.cashAmount || 0;
        v += x.visaAmount || 0;
      });
      const n = c + v;
      const cashPct = n > 0 ? (c / n * 100) : 0;
      const visaPct = n > 0 ? (v / n * 100) : 0;
      document.getElementById('tooltipCashPct').textContent = cashPct.toFixed(1) + '%';
      document.getElementById('tooltipVisaPct').textContent = visaPct.toFixed(1) + '%';
      tooltip.style.display = 'block';
    });
    netVal.addEventListener('mouseleave', () => {
      hideTimer = setTimeout(() => { tooltip.style.display = 'none'; }, 120);
    });
    tooltip.addEventListener('mouseenter', () => {
      if (hideTimer) clearTimeout(hideTimer);
      tooltip.style.display = 'block';
    });
    tooltip.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  }
});

function getFilteredData() {
  let data = allData;
  if (dateFrom || dateTo) {
    data = data.filter(x => {
      if (!x.date) return false;
      let recordDate = x.date;
      if (typeof recordDate !== 'string') recordDate = String(recordDate);
      let dateOnly = recordDate.substring(0, 10).trim();
      let inRange = true;
      if (dateFrom && dateOnly < dateFrom) inRange = false;
      if (dateTo && dateOnly > dateTo) inRange = false;
      return inRange;
    });
  }
  if (!searchTerm) return data;
  return data.filter(x => {
    return (
      (x.date && String(x.date).toLowerCase().includes(searchTerm)) ||
      (x.storeName && x.storeName.toLowerCase().includes(searchTerm)) ||
      (x.cashAmount && fmt(x.cashAmount).toLowerCase().includes(searchTerm)) ||
      (x.visaAmount && fmt(x.visaAmount).toLowerCase().includes(searchTerm)) ||
      (x.netsaleAmount && fmt(x.netsaleAmount).toLowerCase().includes(searchTerm)) ||
      (x.expenseAmount && fmt(x.expenseAmount).toLowerCase().includes(searchTerm)) ||
      (x.totalAmount && fmt(x.totalAmount).toLowerCase().includes(searchTerm))
    );
  });
}

function filterTable() {
  const input = document.getElementById('tableSearch');
  searchTerm = input ? input.value.trim().toLowerCase() : '';
  // Get date range values
  const fromInput = document.getElementById('dateFrom');
  const toInput = document.getElementById('dateTo');
  dateFrom = fromInput && fromInput.value ? fromInput.value : '';
  dateTo = toInput && toInput.value ? toInput.value : '';
  currentPage = 1;
  renderTable();
}

function renderTable() {
  const rows = document.getElementById('rows');
  const pagination = document.getElementById('pagination');
  // Totals for footer
  let totalCash=0, totalVisa=0, totalDoordash=0, totalGrubhub=0, totalUber=0, totalOnline=0, totalExpense=0, totalSale=0, totalNet=0;
  let filteredData = getFilteredData();
  // DO NOT sort filteredData here; keep backend order
  // filteredData.sort(...); // <-- Make sure this is removed/commented
  filteredData.forEach(x=>{
    totalCash += x.cashAmount||0;
    totalVisa += x.visaAmount||0;
    totalDoordash += x.doordashAmount||0;
    totalGrubhub += x.grubhubAmount||0;
    totalUber += x.ubereatsAmount||0;
    totalOnline += x.onlineAmount||0;
    totalExpense += x.expenseAmount||0;
    totalSale += (x.cashAmount||0)+(x.visaAmount||0)+(x.doordashAmount||0)+(x.grubhubAmount||0)+(x.ubereatsAmount||0)+(x.onlineAmount||0)+(x.expenseAmount||0);
    totalNet += (x.cashAmount||0)+(x.visaAmount||0)+(x.doordashAmount||0)+(x.grubhubAmount||0)+(x.ubereatsAmount||0)+(x.onlineAmount||0)-(x.expenseAmount||0);
  });
  const start = (currentPage-1)*pageSize;
  const pageData = filteredData.slice(start, start+pageSize);
  rows.innerHTML = '';
  pageData.forEach(x=>{
    const saleAmount = (x.cashAmount||0)+(x.visaAmount||0)+(x.doordashAmount||0)+(x.grubhubAmount||0)+(x.ubereatsAmount||0)+(x.onlineAmount||0)+(x.expenseAmount||0);
    const netSaleAmount = (x.cashAmount||0)+(x.visaAmount||0)+(x.doordashAmount||0)+(x.grubhubAmount||0)+(x.ubereatsAmount||0)+(x.onlineAmount||0)-(x.expenseAmount||0);
    // Use a modern light yellow gradient highlight for editing row
    const highlight = (editId === x.id)
      ? ' style="background:linear-gradient(90deg,#fef9c3 80%,#fde047 100%)!important;color:#92400e!important;border:2.5px solid #fde047!important;box-shadow:0 4px 18px 0 #fde04755,0 1.5px 6px 0 #fde04733;outline:2px solid #fde047;outline-offset:-2px;font-weight:600;position:relative;overflow:hidden;transition:background 0.3s,color 0.2s,box-shadow 0.3s;animation:rowHighlightPulse 1.2s cubic-bezier(.4,0,.2,1) 1;"'
      : '';
    rows.innerHTML+=`<tr${highlight}>
      <td>${x.date ? x.date.substring(0,10) : ''}</td>
      <td>${fmt(x.cashAmount)}</td>
      <td>${fmt(x.visaAmount)}</td>
      <td>${fmt(x.doordashAmount||0)}</td>
      <td>${fmt(x.grubhubAmount||0)}</td>
      <td>${fmt(x.ubereatsAmount||0)}</td>
      <td>${fmt(x.onlineAmount||0)}</td>
      <td>${x.storeName??''}</td>
      <td>${fmt(x.expenseAmount||0)}</td>
      <td>${fmt(saleAmount)}</td>
      <td><button class="action-btn edit-btn" onclick="editTx(${x.id},${netSaleAmount},${x.cashAmount},${x.visaAmount},${x.doordashAmount||0},${x.grubhubAmount||0},${x.ubereatsAmount||0},${x.onlineAmount||0},'${x.storeName??''}',${x.expenseAmount||0})">Edit</button> <button class="action-btn delete-btn" onclick="delTx(${x.id})">Delete</button></td>
    </tr>`
  });
  // Update footer totals
  document.getElementById('footer-cashAmount').textContent = fmt(totalCash);
  document.getElementById('footer-visaAmount').textContent = fmt(totalVisa);
  document.getElementById('footer-doordashAmount').textContent = fmt(totalDoordash);
  document.getElementById('footer-grubhubAmount').textContent = fmt(totalGrubhub);
  document.getElementById('footer-ubereatsAmount').textContent = fmt(totalUber);
  document.getElementById('footer-onlineAmount').textContent = fmt(totalOnline);
  document.getElementById('footer-expenseAmount').textContent = fmt(totalExpense);
  document.getElementById('footer-saleAmount').textContent = fmt(totalSale);
  // Update KPIs: Grand Total Expense and Grand Total Sales
  spentVal.textContent = fmt(totalExpense);
  totalVal.textContent = fmt(totalSale);
  // Remove netVal and netPct logic
  document.getElementById('spentPct').innerHTML = '';
  document.getElementById('totalPct').innerHTML = '';
  if(chart) { chart.destroy(); chart = null; }
  renderPagination(filteredData.length);
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

function editTx(id, net, c, v, doordash, grubhub, ubereats, online, store, s) {
  editId = id;
  sortColumn = null; // Disable sorting when editing
  renderTable();
  document.getElementById('cashAmount').value = c != null ? String(c) : '';
  document.getElementById('visaAmount').value = v != null ? String(v) : '';
  document.getElementById('doordashAmount').value = doordash != null ? String(doordash) : '';
  document.getElementById('grubhubAmount').value = grubhub != null ? String(grubhub) : '';
  document.getElementById('ubereatsAmount').value = ubereats != null ? String(ubereats) : '';
  document.getElementById('onlineAmount').value = online != null ? String(online) : '';
  document.getElementById('storeName').value = store != null ? store : '';
  document.getElementById('expenseAmount').value = s != null ? String(s) : '';
  recalcTotal();
}
function cancelEdit(){
  editId = null;
  renderTable(); // remove highlight
  // Always get the latest input elements by ID and clear them
  const ids = [
    'cashAmount', 'visaAmount', 'doordashAmount', 'grubhubAmount', 'ubereatsAmount', 'onlineAmount',
    'storeName', 'expenseAmount', 'calcTotal'
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

async function saveTx() {
  const expenseAmountInput = document.getElementById('expenseAmount');
  const doordashAmount = document.getElementById('doordashAmount');
  const grubhubAmount = document.getElementById('grubhubAmount');
  const ubereatsAmount = document.getElementById('ubereatsAmount');
  const onlineAmount = document.getElementById('onlineAmount');
  const c = +cashAmount.value||0, v = +visaAmount.value||0, d = +doordashAmount.value||0, g = +grubhubAmount.value||0, u = +ubereatsAmount.value||0, o = +onlineAmount.value||0, s = +expenseAmountInput.value||0;
  const netsaleAmount = c + v + d + g + u + o - s;
  const body={
    restaurantId:+restaurantSelect.value,
    cashAmount:c,
    visaAmount:v,
    storeName:storeName.value||null,
    netsaleAmount: netsaleAmount,
    expenseAmount:s,
    doordashAmount: d,
    grubhubAmount: g,
    ubereatsAmount: u,
    onlineAmount: o,
    // Use Eastern Time for the date
    date: getEasternIsoString()
  };
  if(editId){
    await fetch('/api/sales/'+editId,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  }else{
    await fetch('/api/sales',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  }
  editId = null; // Clear edit state after saving
  await loadData();
  // Clear all input values after saving
  const ids = [
    'cashAmount', 'visaAmount', 'doordashAmount', 'grubhubAmount', 'ubereatsAmount', 'onlineAmount',
    'storeName', 'expenseAmount', 'calcTotal'
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}
async function delTx(id){await fetch('/api/sales/'+id,{method:'DELETE'});await loadData();}

document.addEventListener('DOMContentLoaded',loadRestaurants);

let sortColumn = 'date', sortAsc = false; // Default: sort by date descending

function updateSortIndicators() {
  const columns = ['date','cashAmount','visaAmount','netsaleAmount','doordashAmount','grubhubAmount','ubereatsAmount','onlineAmount','storeName','expenseAmount','totalAmount'];
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

function printPDF() {
  window.print();
}
function printExcel() {
  // Export only the table (with grand total), exclude KPIs and pagination
  const table = document.querySelector('.modern');
  const grandTotal = document.getElementById('grand-total-row-container');
  let html = '';
  if (table) {
    // Add colgroup for professional column widths
    const colgroup = `<colgroup>
      <col style='width: 13%'> <!-- Date -->
      <col style='width: 15%'> <!-- Gross Net Amount -->
      <col style='width: 13%'> <!-- Cash -->
      <col style='width: 13%'> <!-- Visa -->
      <col style='width: 18%'> <!-- Store Name -->
      <col style='width: 13%'> <!-- Expense Amount -->
      <col style='width: 15%'> <!-- Total Amount -->
      <col style='width: 10%'> <!-- Actions (hidden in print) -->
    </colgroup>`;
    // Insert colgroup after <table ...>
    html += table.outerHTML.replace(/<table([^>]*)>/, `<table$1>${colgroup}`);
  }
  if (grandTotal) html += grandTotal.innerHTML;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dashboard.xls';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

function switchTab(tab) {
  const salesTab = document.getElementById('tabSales');
  const suppliersTab = document.getElementById('tabSuppliers');
  const salesContent = document.getElementById('tabContentSales');
  const suppliersContent = document.getElementById('tabContentSuppliers');
  if (tab === 'sales') {
    salesTab.classList.add('tab-active');
    suppliersTab.classList.remove('tab-active');
    salesContent.style.display = '';
    suppliersContent.style.display = 'none';
  } else if (tab === 'suppliers') {
    salesTab.classList.remove('tab-active');
    suppliersTab.classList.add('tab-active');
    salesContent.style.display = 'none';
    suppliersContent.style.display = '';
  }
}

function updateTabSlider() {
  const tabMenu = document.querySelector('.tab-menu');
  const slider = tabMenu.querySelector('.tab-slider');
  const activeTab = tabMenu.querySelector('.tab-active');
  if (activeTab && slider) {
    const rect = activeTab.getBoundingClientRect();
    const parentRect = tabMenu.getBoundingClientRect();
    slider.style.left = (rect.left - parentRect.left) + 'px';
    slider.style.width = rect.width + 'px';
  }
}

// Patch switchTab to update slider
const origSwitchTab = window.switchTab;
window.switchTab = function(tab) {
  origSwitchTab(tab);
  setTimeout(updateTabSlider, 10);
};
window.addEventListener('DOMContentLoaded', updateTabSlider);
window.addEventListener('resize', updateTabSlider);

// --- Supplier Invoice Transactions logic ---
let supplierEditId = null;
let supplierData = [];
let supplierSearchTerm = '';

function getSelectedRestaurantId() {
  const sel = document.getElementById('restaurantSelect');
  return sel && sel.value ? sel.value : null;
}

async function loadSupplierData() {
  const restaurantId = getSelectedRestaurantId();
  if (!restaurantId) { supplierData = []; renderSupplierTable(); return; }
  try {
    const res = await fetch(`/api/suppliers?restaurantId=${restaurantId}`);
    supplierData = await res.json();
    // Sort by date/time descending on initial load only
    supplierData.sort((a, b) => {
      const ad = a.transactionDate ? new Date(a.transactionDate) : new Date(0);
      const bd = b.transactionDate ? new Date(b.transactionDate) : new Date(0);
      if (bd - ad !== 0) return bd - ad;
      return (b.id || 0) - (a.id || 0);
    });
  } catch (e) {
    supplierData = [];
  }
  renderSupplierTable();
}

document.addEventListener('DOMContentLoaded', () => {
  loadRestaurants();
  setupSearchInput();

  // --- KPI tooltip logic for Grand Gross Net Amount ---
  const netVal = document.getElementById('netVal');
  const tooltip = document.getElementById('netKpiTooltip');
  let hideTimer = null;
  if (netVal && tooltip) {
    netVal.addEventListener('mouseenter', () => {
      // Calculate cash and visa percentages from current KPI values
      let c = 0, v = 0;
      const filteredData = getFilteredData();
      filteredData.forEach(x => {
        c += x.cashAmount || 0;
        v += x.visaAmount || 0;
      });
      const n = c + v;
      const cashPct = n > 0 ? (c / n * 100) : 0;
      const visaPct = n > 0 ? (v / n * 100) : 0;
      document.getElementById('tooltipCashPct').textContent = cashPct.toFixed(1) + '%';
      document.getElementById('tooltipVisaPct').textContent = visaPct.toFixed(1) + '%';
      tooltip.style.display = 'block';
    });
    netVal.addEventListener('mouseleave', () => {
      hideTimer = setTimeout(() => { tooltip.style.display = 'none'; }, 120);
    });
    tooltip.addEventListener('mouseenter', () => {
      if (hideTimer) clearTimeout(hideTimer);
      tooltip.style.display = 'block';
    });
    tooltip.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  }

  const supplierSearchInput = document.getElementById('supplierTableSearch');
  if (supplierSearchInput) {
    supplierSearchInput.addEventListener('input', e => {
      supplierSearchTerm = e.target.value.trim().toLowerCase();
      renderSupplierTable();
    });
  }
});

function getFilteredData() {
  let data = allData;
  if (dateFrom || dateTo) {
    data = data.filter(x => {
      if (!x.date) return false;
      let recordDate = x.date;
      if (typeof recordDate !== 'string') recordDate = String(recordDate);
      let dateOnly = recordDate.substring(0, 10).trim();
      let inRange = true;
      if (dateFrom && dateOnly < dateFrom) inRange = false;
      if (dateTo && dateOnly > dateTo) inRange = false;
      return inRange;
    });
  }
  if (!searchTerm) return data;
  return data.filter(x => {
    return (
      (x.date && String(x.date).toLowerCase().includes(searchTerm)) ||
      (x.storeName && x.storeName.toLowerCase().includes(searchTerm)) ||
      (x.cashAmount && fmt(x.cashAmount).toLowerCase().includes(searchTerm)) ||
      (x.visaAmount && fmt(x.visaAmount).toLowerCase().includes(searchTerm)) ||
      (x.netsaleAmount && fmt(x.netsaleAmount).toLowerCase().includes(searchTerm)) ||
      (x.expenseAmount && fmt(x.expenseAmount).toLowerCase().includes(searchTerm)) ||
      (x.totalAmount && fmt(x.totalAmount).toLowerCase().includes(searchTerm))
    );
  });
}

let supplierPage = 1, supplierPageSize = 15;

function renderSupplierPagination(filteredLength) {
  const pagination = document.getElementById('supplierPagination');
  const pageCount = Math.ceil(filteredLength / supplierPageSize);
  let html = '';
  if (pageCount > 1) {
    html += `<button onclick="gotoSupplierPage(${supplierPage-1})" ${supplierPage===1?'disabled':''}>Prev</button>`;
    for(let i=1;i<=pageCount;i++) {
      html += `<button onclick="gotoSupplierPage(${i})" ${i===supplierPage?'style=\'font-weight:bold\'':''}>${i}</button>`;
    }
    html += `<button onclick="gotoSupplierPage(${supplierPage+1})" ${supplierPage===pageCount?'disabled':''}>Next</button>`;
  }
  pagination.innerHTML = html;
}

function gotoSupplierPage(page) {
  const selectedRestaurantId = getSelectedRestaurantId();
  let filtered = supplierData.filter(row => row.restaurantId == selectedRestaurantId);
  if (supplierSearchTerm) {
    filtered = filtered.filter(row =>
      (row.supplierName && row.supplierName.toLowerCase().includes(supplierSearchTerm)) ||
      (row.transactionDate && row.transactionDate.toLowerCase().includes(supplierSearchTerm)) ||
      (row.invoiceNumber && row.invoiceNumber.toLowerCase().includes(supplierSearchTerm)) ||
      (row.checkNumber && row.checkNumber.toLowerCase().includes(supplierSearchTerm)) ||
      (row.invoiceAmount && String(row.invoiceAmount).toLowerCase().includes(supplierSearchTerm)) ||
      (row.notes && row.notes.toLowerCase().includes(supplierSearchTerm))
    );
  }
  const pageCount = Math.ceil(filtered.length / supplierPageSize);
  if(page < 1 || page > pageCount) return;
  supplierPage = page;
  renderSupplierTable();
}

function renderSupplierTable() {
  const tbody = document.getElementById('supplierRows');
  tbody.innerHTML = '';
  const selectedRestaurantId = getSelectedRestaurantId();
  let totalAmount = 0;
  // Filter by restaurant and search term
  let filtered = supplierData.filter(row => row.restaurantId == selectedRestaurantId);
  if (supplierSearchTerm) {
    filtered = filtered.filter(row =>
      (row.supplierName && row.supplierName.toLowerCase().includes(supplierSearchTerm)) ||
      (row.transactionDate && row.transactionDate.toLowerCase().includes(supplierSearchTerm)) ||
      (row.invoiceNumber && row.invoiceNumber.toLowerCase().includes(supplierSearchTerm)) ||
      (row.checkNumber && row.checkNumber.toLowerCase().includes(supplierSearchTerm)) ||
      (row.invoiceAmount && String(row.invoiceAmount).toLowerCase().includes(supplierSearchTerm)) ||
      (row.notes && row.notes.toLowerCase().includes(supplierSearchTerm))
    );
  }
  // Pagination logic
  const pageCount = Math.ceil(filtered.length / supplierPageSize);
  if (supplierPage > pageCount) supplierPage = pageCount || 1;
  const start = (supplierPage - 1) * supplierPageSize;
  const pageData = filtered.slice(start, start + supplierPageSize);
  pageData.forEach((row) => {
    totalAmount += Number(row.invoiceAmount) || 0;
    const highlight = (supplierEditId === row.id)
      ? ' style="background:#38bdf8 !important;color:#fff !important;border:2.5px solid #2563eb !important;box-shadow:0 0 8px 0 rgba(37,99,235,0.2);"'
      : (supplierDeleteId === row.id)
        ? ' style="background:#dc2626 !important;color:#fff !important;border:2.5px solid #dc2626 !important;box-shadow:0 0 8px #dc2626;"'
        : '';
    let deleteBtnHtml;
    if (supplierDeleteId === row.id) {
      deleteBtnHtml = `<button class='action-btn delete-btn' style='background:#dc2626;color:#fff;' onclick='confirmDeleteSupplierRow("${row.id}")'>Confirm Delete</button>`;
    } else {
      deleteBtnHtml = `<button class='action-btn delete-btn' onclick='deleteSupplierRow("${row.id}")'>Delete</button>`;
    }
    tbody.innerHTML += `<tr${highlight}>
      <td>${row.supplierName}</td>
      <td>${row.transactionDate}</td>
      <td>${row.invoiceNumber}</td>
      <td>${row.checkNumber}</td>
      <td>$${Number(row.invoiceAmount).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
      <td>${row.notes||''}</td>
      <td>
        <button class='action-btn edit-btn' onclick='editSupplierRow("${row.id}")'>Edit</button>
        ${deleteBtnHtml}
      </td>
    </tr>`;
  });
  // Set grand total in the tfoot
  const grandTotalCell = document.getElementById('supplier-grand-total');
  if (grandTotalCell) {
    grandTotalCell.textContent = `$${totalAmount.toLocaleString(undefined, {minimumFractionDigits:2,maximumFractionDigits:2})}`;
  }
  renderSupplierPagination(filtered.length);
  renderSupplierKpiAndGraphs(filtered);
}

function clearSupplierForm() {
  supplierEditId = null;
  supplierForm.reset();
}

document.getElementById('restaurantSelect').addEventListener('change', loadSupplierData);

document.getElementById('supplierForm').onsubmit = async function(e) {
  e.preventDefault();
  const selectedRestaurantId = getSelectedRestaurantId();
  const transactionDateInput = document.getElementById('transactionDate');
  const prevDateValue = transactionDateInput ? transactionDateInput.value : '';
  const row = {
    restaurantId: selectedRestaurantId,
    supplierName: document.getElementById('supplierName').value,
    transactionDate: prevDateValue,
    invoiceNumber: document.getElementById('invoiceNumber').value,
    checkNumber: document.getElementById('checkNumber').value,
    invoiceAmount: document.getElementById('invoiceAmount').value,
    notes: document.getElementById('notes').value
  };
  try {
    let resp, savedId = null;
    if (supplierEditId) {
      // Update existing
      const editingRow = supplierData.find(r => r.id == supplierEditId);
      if (editingRow && editingRow.id) {
        resp = await fetch(`/api/suppliers/${editingRow.id}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(row)
        });
        savedId = editingRow.id;
      }
      supplierEditId = null;
    } else {
      // Create new
      resp = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(row)
      });
      if (resp.ok) {
        const data = await resp.json();
        savedId = data.id;
      }
      supplierEditId = null;
    }
    if (!resp || !resp.ok) {
      const text = resp ? await resp.text() : 'No response';
      alert('Error saving supplier transaction: ' + text);
      console.error('Supplier save error:', text);
      return;
    }
  } catch (e) {
    alert('Error saving supplier transaction: ' + e);
    console.error('Supplier save error:', e);
    return;
  }
  supplierForm.reset();
  // Restore the transaction date input value after reset
  if (transactionDateInput) transactionDateInput.value = prevDateValue;
  await loadSupplierData();
  renderSupplierTable(); // Re-highlight after reload
};

window.editSupplierRow = function(id) {
  const row = supplierData.find(r => r.id == id);
  if (!row) return;
  document.getElementById('supplierName').value = row.supplierName;
  document.getElementById('transactionDate').value = row.transactionDate;
  document.getElementById('invoiceNumber').value = row.invoiceNumber;
  document.getElementById('checkNumber').value = row.checkNumber;
  document.getElementById('invoiceAmount').value = row.invoiceAmount;
  document.getElementById('notes').value = row.notes;
  supplierEditId = row.id;
  renderSupplierTable(); // Refresh to show highlight
};

let supplierDeleteId = null;

function ensureDeleteModalStyles() {
  if (document.getElementById('delete-modal-style')) return;
  const style = document.createElement('style');
  style.id = 'delete-modal-style';
  style.textContent = `
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(30,41,59,0.35); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .modal-box { background: #fff; color: #0f172a; border-radius: 18px; box-shadow: 0 8px 32px rgba(37,99,235,0.18); padding: 32px 32px 24px 32px; min-width: 340px; max-width: 90vw; text-align: center; position: relative; }
    .modal-box h2 { font-size: 1.25rem; font-weight: 700; margin-bottom: 10px; color: #dc2626; }
    .modal-box p { font-size: 1.05rem; margin-bottom: 22px; color: #334155; }
    .modal-btn-row { display: flex; gap: 16px; justify-content: center; }
    .modal-btn { padding: 10px 28px; border-radius: 10px; font-size: 1rem; border: none; cursor: pointer; font-weight: 600; transition: background .15s; }
    .modal-btn-cancel { background: #e5e7eb; color: #374151; }
    .modal-btn-cancel:hover { background: #cbd5e1; }
    .modal-btn-delete { background: #dc2626; color: #fff; }
    .modal-btn-delete:hover { background: #b91c1c; }
  `;
  document.head.appendChild(style);
}

function showDeleteModal(id) {
  ensureDeleteModalStyles();
  // Remove any existing modal
  const old = document.getElementById('delete-modal-overlay');
  if (old) old.remove();
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'delete-modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <h2>Confirm Deletion</h2>
      <p>Are you sure you want to <b>permanently delete</b> this sales transaction record? This action cannot be undone.</p>
      <div class="modal-btn-row">
        <button class="modal-btn modal-btn-cancel" id="modal-cancel-btn">Cancel</button>
        <button class="modal-btn modal-btn-delete" id="modal-delete-btn">Delete</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('modal-cancel-btn').onclick = () => overlay.remove();
  document.getElementById('modal-delete-btn').onclick = async () => {
    overlay.remove();
    await confirmDelTx(id);
  };
}

function delTx(id) {
  deleteId = id;
  renderTable();
  showDeleteModal(id);
}

async function confirmDelTx(id) {
  await fetch('/api/sales/' + id, { method: 'DELETE' });
  deleteId = null;
  await loadData();
}

// --- Supplier KPI, Word Cloud, and Heat Map logic ---
function renderSupplierKpiAndGraphs(filteredData) {
  // KPI
  const supplierKpiVal = document.getElementById('supplierKpiVal');
  let total = 0;
  const supplierTotals = {};
  filteredData.forEach(row => {
    const amount = Number(row.invoiceAmount) || 0;
    total += amount;
    if (row.supplierName) {
      supplierTotals[row.supplierName] = (supplierTotals[row.supplierName] || 0) + amount;
    }
  });
  if (supplierKpiVal) {
    supplierKpiVal.textContent = `$${total.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  }
  // Heat Map
  const sortedSuppliers = Object.entries(supplierTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const heatMapLabels = sortedSuppliers.map(([name]) => name);
  const heatMapData = sortedSuppliers.map(([, value]) => value);
  if (window.supplierHeatMapChart) {
    window.supplierHeatMapChart.destroy();
  }
  const ctx = document.getElementById('supplierHeatMap').getContext ? document.getElementById('supplierHeatMap').getContext('2d') : null;
  if (ctx && heatMapLabels.length > 0) {
    window.supplierHeatMapChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: heatMapLabels,
        datasets: [{
          label: 'Total Invoice Amount',
          data: heatMapData,
          backgroundColor: heatMapData.map(v => `rgba(249,115,22,${0.3 + 0.7 * (v/Math.max(...heatMapData))})`),
          borderRadius: 8,
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                const val = context.raw;
                const pct = total > 0 ? (val/total*100).toFixed(1) : 0;
                return `${context.label}: $${val.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} (${pct}%)`;
              }
            }
          }
        },
        scales: {
          x: { beginAtZero: true, grid: { color: '#e5e7eb' } },
          y: { grid: { color: '#e5e7eb' } }
        },
        responsive: false,
        maintainAspectRatio: false,
      }
    });
  } else if (document.getElementById('supplierHeatMap')) {
    document.getElementById('supplierHeatMap').innerHTML = '<div style="color:#888;text-align:center;padding-top:40px;">No data</div>';
  }
}

// --- Print functions for Supplier Invoices ---
function printSupplierPDF() {
  // Hide form, search, nav, and tabs for print
  const form = document.getElementById('supplierForm');
  const search = document.getElementById('supplierTableSearch');
  const pag = document.getElementById('supplierPagination');
  const tabs = document.querySelector('.tab-menu');
  if (form) form.style.display = 'none';
  if (search) search.style.display = 'none';
  if (pag) pag.style.display = 'none';
  if (tabs) tabs.style.display = 'none';
  // Print only KPI, graph, and table
  window.print();
  // Restore after print
  setTimeout(() => {
    if (form) form.style.display = '';
    if (search) search.style.display = '';
    if (pag) pag.style.display = '';
    if (tabs) tabs.style.display = '';
  }, 500);
}

function printSupplierExcel() {
  // Export only the supplier table (with grand total)
  const table = document.getElementById('supplierTable');
  let html = '';
  if (table) {
    html += table.outerHTML;
  }
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'supplier_invoices.xls';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// Remove arrows from number inputs
window.addEventListener('DOMContentLoaded',()=>{
  ['doordashAmount','grubhubAmount','ubereatsAmount','onlineAmount'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){el.setAttribute('inputmode','decimal');el.setAttribute('pattern','[0-9]*');el.addEventListener('wheel',e=>e.target.blur());}
  });
});

function setDateRange(range) {
  const fromInput = document.getElementById('dateFrom');
  const toInput = document.getElementById('dateTo');
  const today = new Date();
  let from, to;
  if (range === 'today') {
    from = to = today;
  } else if (range === 'week') {
    const day = today.getDay();
    from = new Date(today);
    from.setDate(today.getDate() - day);
    to = new Date(today);
    to.setDate(from.getDate() + 6);
  } else if (range === 'month') {
    from = new Date(today.getFullYear(), today.getMonth(), 1);
    to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  } else if (range === 'year') {
    from = new Date(today.getFullYear(), 0, 1);
    to = new Date(today.getFullYear(), 11, 31);
  }
  // Format as yyyy-mm-dd
  const fmt = d => d.toISOString().slice(0, 10);
  fromInput.value = fmt(from);
  toInput.value = fmt(to);
  filterTable();
}

document.addEventListener('DOMContentLoaded', function() {
  var from = document.getElementById('dateFrom');
  var to = document.getElementById('dateTo');
  if (from) from.addEventListener('change', filterTable);
  if (to) to.addEventListener('change', filterTable);
});

// Helper to get current date/time in Eastern Time (America/New_York) in ISO format (yyyy-MM-ddTHH:mm:ss)
function getEasternIsoString() {
  const now = new Date();
  const eastern = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const pad = n => n.toString().padStart(2, '0');
  return eastern.getFullYear() + '-' +
    pad(eastern.getMonth() + 1) + '-' +
    pad(eastern.getDate()) + 'T' +
    pad(eastern.getHours()) + ':' +
    pad(eastern.getMinutes()) + ':' +
    pad(eastern.getSeconds());
}

// Add CSS for the custom modal if not present
function ensureDeleteModalStyles() {
  if (document.getElementById('delete-modal-style')) return;
  const style = document.createElement('style');
  style.id = 'delete-modal-style';
  style.textContent = `
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(30,41,59,0.35); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .modal-box { background: #fff; color: #0f172a; border-radius: 18px; box-shadow: 0 8px 32px rgba(37,99,235,0.18); padding: 32px 32px 24px 32px; min-width: 340px; max-width: 90vw; text-align: center; position: relative; }
    .modal-box h2 { font-size: 1.25rem; font-weight: 700; margin-bottom: 10px; color: #dc2626; }
    .modal-box p { font-size: 1.05rem; margin-bottom: 22px; color: #334155; }
    .modal-btn-row { display: flex; gap: 16px; justify-content: center; }
    .modal-btn { padding: 10px 28px; border-radius: 10px; font-size: 1rem; border: none; cursor: pointer; font-weight: 600; transition: background .15s; }
    .modal-btn-cancel { background: #e5e7eb; color: #374151; }
    .modal-btn-cancel:hover { background: #cbd5e1; }
    .modal-btn-delete { background: #dc2626; color: #fff; }
    .modal-btn-delete:hover { background: #b91c1c; }
  `;
  document.head.appendChild(style);
}

function showSupplierDeleteModal(id) {
  ensureDeleteModalStyles();
  const old = document.getElementById('delete-modal-overlay');
  if (old) old.remove();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'delete-modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <h2>Confirm Deletion</h2>
      <p>Are you sure you want to <b>permanently delete</b> this supplier expense transaction record? This action cannot be undone.</p>
      <div class="modal-btn-row">
        <button class="modal-btn modal-btn-cancel" id="modal-cancel-btn">Cancel</button>
        <button class="modal-btn modal-btn-delete" id="modal-delete-btn">Delete</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('modal-cancel-btn').onclick = () => {
    overlay.remove();
    supplierDeleteId = null;
    renderSupplierTable();
  };
  document.getElementById('modal-delete-btn').onclick = async () => {
    overlay.remove();
    await confirmDeleteSupplierRow(id);
  };
}

window.deleteSupplierRow = function(id) {
  supplierDeleteId = id;
  renderSupplierTable();
  showSupplierDeleteModal(id);
};

async function confirmDeleteSupplierRow(id) {
  const row = supplierData.find(r => r.id == id);
  if (row && row.id) {
    try {
      await fetch(`/api/suppliers/${row.id}`, { method: 'DELETE' });
    } catch (e) {}
  }
  supplierDeleteId = null;
  await loadSupplierData();
  renderSupplierTable();
};
