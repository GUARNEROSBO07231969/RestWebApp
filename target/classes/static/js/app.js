let chart, editId=null;
const expenseAmount = document.getElementById('expenseAmount');
function fmt(v){return '$'+Number(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
function recalcTotal(){
  const c=+cashAmount.value||0, v=+visaAmount.value||0, s=+expenseAmount.value||0;
  calcTotal.value=fmt(c+v-s);
  const net = +cashAmount.value + +visaAmount.value;
  netSaleAmount.value = fmt(net);
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
  if (!searchTerm) return allData;
  return allData.filter(x => {
    return (
      (x.date && x.date.toLowerCase().includes(searchTerm)) ||
      (x.storeName && x.storeName.toLowerCase().includes(searchTerm)) ||
      (x.cashAmount && fmt(x.cashAmount).toLowerCase().includes(searchTerm)) ||
      (x.visaAmount && fmt(x.visaAmount).toLowerCase().includes(searchTerm)) ||
      (x.netSaleAmount && fmt(x.netSaleAmount).toLowerCase().includes(searchTerm)) ||
      (x.expenseAmount && fmt(x.expenseAmount).toLowerCase().includes(searchTerm)) ||
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
  let c=0,v=0,s=0;
  const filteredData = getFilteredData();
  // Calculate grand totals from filteredData
  filteredData.forEach(x=>{
    c+=x.cashAmount||0;
    v+=x.visaAmount||0;
    s+=(x.expenseAmount||0);
  });
  const n = c + v; // total gross amount
  const t = n - s; // total amount
  const start = (currentPage-1)*pageSize;
  const pageData = filteredData.slice(start, start+pageSize);
  rows.innerHTML = '';
  pageData.forEach(x=>{
    const totalAmount = (x.cashAmount||0)+(x.visaAmount||0)-(x.expenseAmount||0);
    const netAmount = x.netSaleAmount || ((x.cashAmount||0)+(x.visaAmount||0));
    rows.innerHTML+=`<tr><td>${x.date??''}</td><td>${fmt(netAmount)}</td><td>${fmt(x.cashAmount)}</td><td>${fmt(x.visaAmount)}</td><td>${x.storeName??''}</td><td>${fmt(x.expenseAmount||0)}</td><td>${fmt(totalAmount)}</td><td><button class="action-btn edit-btn" onclick="editTx(${x.id},${netAmount},${x.cashAmount},${x.visaAmount},'${x.storeName??''}',${x.expenseAmount||0})">Edit</button> <button class="action-btn delete-btn" onclick="delTx(${x.id})">Delete</button></td></tr>`
  });
  // Append grand total row as last row in the table
  rows.innerHTML += `<tr class='grand-total-row'>
    <td class='grand-label'>Grand Total</td>
    <td>${fmt(n)}</td>
    <td>${fmt(c)}</td>
    <td>${fmt(v)}</td>
    <td>&nbsp;</td>
    <td>${fmt(s)}</td>
    <td>${fmt(t)}</td>
    <td>&nbsp;</td>
  </tr>`;
  renderPagination(filteredData.length);
  updateSortIndicators();
  netVal.textContent=fmt(n);spentVal.textContent=fmt(s);totalVal.textContent=fmt(t);
  // --- KPI Percentages with labels and contrasting colors ---
  // Gross Net Amount: always 100% (of itself)
  const netPct = n > 0 ? 100 : 0;
  // Expense: as % of gross net
  const spentPct = n > 0 ? (s/n*100) : 0;
  // Total Amount: profit margin % (total/gross net)
  const totalPct = n > 0 ? (t/n*100) : 0;
  // Set with label and color for contrast
  document.getElementById('netPct').innerHTML = `<span style='color:#fff;background:#0ea5e9;padding:2px 8px;border-radius:8px;font-size:0.98em;font-weight:600;display:inline-block;margin-top:2px;'>Gross Margin: ${netPct.toFixed(0)}%</span>`;
  document.getElementById('spentPct').innerHTML = `<span style='color:#fff;background:#f97316;padding:2px 8px;border-radius:8px;font-size:0.98em;font-weight:600;display:inline-block;margin-top:2px;'>Expense Ratio: ${spentPct.toFixed(1)}%</span>`;
  document.getElementById('totalPct').innerHTML = `<span style='color:#fff;background:#9333ea;padding:2px 8px;border-radius:8px;font-size:0.98em;font-weight:600;display:inline-block;margin-top:2px;'>Profit Margin: ${totalPct.toFixed(1)}%</span>`;
  if(chart) { chart.destroy(); chart = null; }
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

function editTx(id,net,c,v,store,s){editId=id;netSaleAmount.value=fmt(net);cashAmount.value=c;visaAmount.value=v;storeName.value=store||'';expenseAmount.value=s;recalcTotal()}
function cancelEdit(){editId=null;netSaleAmount.value='';cashAmount.value='';visaAmount.value='';storeName.value='';expenseAmount.value='';calcTotal.value=''}

async function saveTx(){
  const expenseAmountInput = document.getElementById('expenseAmount');
  const netSaleAmountInput = document.getElementById('netSaleAmount');
  const body={
    restaurantId:+restaurantSelect.value,
    cashAmount:+cashAmount.value||0,
    visaAmount:+visaAmount.value||0,
    storeName:storeName.value||null,
    netSaleAmount: +(netSaleAmountInput.value.replace(/[^\d.\-]/g, '')) || (+cashAmount.value||0)+(+visaAmount.value||0),
    expenseAmount:+expenseAmountInput.value||0
  };
  if(editId){
    await fetch('/api/sales/'+editId,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  }else{
    await fetch('/api/sales',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  }
  cancelEdit();
  await loadData();
}
async function delTx(id){await fetch('/api/sales/'+id,{method:'DELETE'});await loadData();}

document.addEventListener('DOMContentLoaded',loadRestaurants);

let sortColumn = null, sortAsc = true;

function updateSortIndicators() {
  const columns = ['date','cashAmount','visaAmount','netSaleAmount','storeName','expenseAmount','totalAmount'];
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

// --- Supplier Invoice Transactions logic ---
let supplierEditId = null;
let supplierData = [];

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
  } catch (e) {
    supplierData = [];
  }
  renderSupplierTable();
}

function renderSupplierTable() {
  const tbody = document.getElementById('supplierRows');
  tbody.innerHTML = '';
  const selectedRestaurantId = getSelectedRestaurantId();
  let totalAmount = 0;
  const filtered = supplierData.filter(row => row.restaurantId == selectedRestaurantId);
  filtered.forEach((row, idx) => {
    totalAmount += Number(row.invoiceAmount) || 0;
    tbody.innerHTML += `<tr>
      <td>${row.supplierName}</td>
      <td>${row.transactionDate}</td>
      <td>${row.invoiceNumber}</td>
      <td>${row.checkNumber}</td>
      <td>$${Number(row.invoiceAmount).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
      <td>${row.notes||''}</td>
      <td>
        <button class='action-btn edit-btn' onclick='editSupplierRow(${idx})'>Edit</button>
        <button class='action-btn delete-btn' onclick='deleteSupplierRow(${idx})'>Delete</button>
      </td>
    </tr>`;
  });
  // Add grand total row
  if (filtered.length > 0) {
    tbody.innerHTML += `<tr class='grand-total-row'>
      <td class='grand-label'>Grand Total</td>
      <td></td>
      <td></td>
      <td></td>
      <td><strong>$${totalAmount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></td>
      <td></td>
      <td></td>
    </tr>`;
  }
}

function clearSupplierForm() {
  supplierEditId = null;
  supplierForm.reset();
}

document.getElementById('restaurantSelect').addEventListener('change', loadSupplierData);

document.getElementById('supplierForm').onsubmit = async function(e) {
  e.preventDefault();
  const selectedRestaurantId = getSelectedRestaurantId();
  const row = {
    restaurantId: selectedRestaurantId,
    supplierName: document.getElementById('supplierName').value,
    transactionDate: document.getElementById('transactionDate').value,
    invoiceNumber: document.getElementById('invoiceNumber').value,
    checkNumber: document.getElementById('checkNumber').value,
    invoiceAmount: document.getElementById('invoiceAmount').value,
    notes: document.getElementById('notes').value
  };
  try {
    let resp;
    if (supplierEditId !== null && supplierData[supplierEditId] && supplierData[supplierEditId].id) {
      // Update existing
      resp = await fetch(`/api/suppliers/${supplierData[supplierEditId].id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(row)
      });
    } else {
      // Create new
      resp = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(row)
      });
    }
    if (!resp.ok) {
      const text = await resp.text();
      alert('Error saving supplier transaction: ' + text);
      console.error('Supplier save error:', text);
      return;
    }
  } catch (e) {
    alert('Error saving supplier transaction: ' + e);
    console.error('Supplier save error:', e);
    return;
  }
  supplierEditId = null;
  supplierForm.reset();
  await loadSupplierData();
};

window.editSupplierRow = function(idx) {
  const row = supplierData[idx];
  document.getElementById('supplierName').value = row.supplierName;
  document.getElementById('transactionDate').value = row.transactionDate;
  document.getElementById('invoiceNumber').value = row.invoiceNumber;
  document.getElementById('checkNumber').value = row.checkNumber;
  document.getElementById('invoiceAmount').value = row.invoiceAmount;
  document.getElementById('notes').value = row.notes;
  supplierEditId = idx;
};

window.deleteSupplierRow = async function(idx) {
  if (supplierData[idx] && supplierData[idx].id) {
    try {
      await fetch(`/api/suppliers/${supplierData[idx].id}`, { method: 'DELETE' });
    } catch (e) {}
  }
  supplierEditId = null;
  await loadSupplierData();
};

document.addEventListener('DOMContentLoaded', loadSupplierData);
