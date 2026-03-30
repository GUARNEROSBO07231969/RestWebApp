
let chart, editId=null;
function fmt(v){return '$'+Number(v).toFixed(2)}
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
async function loadRestaurants(){const r=await fetch('/api/restaurants').then(r=>r.json());const sel=document.getElementById('restaurantSelect');sel.innerHTML='';r.forEach(x=>{const o=document.createElement('option');o.value=x.id;o.text=x.name;sel.appendChild(o)});if(r.length){sel.value=r[0].id;loadData();}}

async function loadData(){const id=document.getElementById('restaurantSelect').value;const d=await fetch('/api/sales?restaurantId='+id).then(r=>r.json());rows.innerHTML='';let c=0,v=0,s=0,t=0;d.forEach(x=>{c+=x.cashAmount;v+=x.visaAmount;s+=x.spent;t+=x.totalAmount;rows.innerHTML+=`<tr><td>${x.date??''}</td><td>${fmt(x.cashAmount)}</td><td>${fmt(x.visaAmount)}</td><td>${fmt(x.spent)}</td><td>${fmt(x.totalAmount)}</td><td><button class="action-btn edit-btn" onclick="editTx(${x.id},${x.cashAmount},${x.visaAmount},${x.spent})">Edit</button> <button class="action-btn delete-btn" onclick="delTx(${x.id})">Delete</button></td></tr>`});
  cashVal.textContent=fmt(c);visaVal.textContent=fmt(v);spentVal.textContent=fmt(s);totalVal.textContent=fmt(t);
  if(chart) chart.destroy();
  const tt = t || 1; // avoid div by zero in tooltip
  chart=new Chart(document.getElementById('pie'),{type:'doughnut',data:{datasets:[{data:[c,v,s],backgroundColor:['#22c55e','#2563eb','#f97316']}]},options:{cutout:'70%',plugins:{legend:{display:false},tooltip:{callbacks:{label:(ctx)=> Math.round((ctx.raw/tt)*100)+'%'}}}},plugins:[centerText]});
}

function editTx(id,c,v,s){editId=id;cashAmount.value=c;visaAmount.value=v;spentAmount.value=s;recalcTotal()}
function cancelEdit(){editId=null;cashAmount.value='';visaAmount.value='';spentAmount.value='';calcTotal.value=''}

async function saveTx(){const body={restaurantId:+restaurantSelect.value,cashAmount:+cashAmount.value||0,visaAmount:+visaAmount.value||0,spent:+spentAmount.value||0};
  if(editId){await fetch('/api/sales/'+editId,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}else{await fetch('/api/sales',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}cancelEdit();await loadData();}
async function delTx(id){await fetch('/api/sales/'+id,{method:'DELETE'});await loadData();}

document.addEventListener('DOMContentLoaded',loadRestaurants);
