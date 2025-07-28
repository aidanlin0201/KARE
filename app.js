const SHEET_ID = "19DPtEHwT6A34jnN9Og95H9uLJtDlm7R6AR99VIzJcOE";
const API_KEY = "AIzaSyBmw7V8F7DNAGC9MlxkKHl6tkaGFFWNTvQ"; 
const RANGE = "精油資料庫!A1:Z1000"; // 調整為你的欄位範圍

const oilList = document.getElementById("oil-list");
const blendList = document.getElementById("blend-list");
const blendTotal = document.getElementById("blend-total");
let oils = [];

// 讀取 Google Sheets
async function fetchData() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const [headers, ...rows] = data.values;
  oils = rows.map(r => ({
    name: r[0],
    en: r[1],
    detail: headers.reduce((obj, h, i) => { obj[h] = r[i] || ""; return obj; }, {})
  }));
  renderList(oils);
}

// 渲染精油清單
function renderList(data) {
  oilList.innerHTML = "";
  data.forEach((oil, i) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <input type="checkbox" class="blend-checkbox" data-name="${oil.name}">
      <span class="title" onclick="toggleDetail(${i})">${oil.name} (${oil.en})</span>
      <div class="detail" id="detail-${i}">
        ${Object.entries(oil.detail).map(([k,v]) => `<p><b>${k}：</b>${v}</p>`).join("")}
      </div>
    `;
    oilList.appendChild(item);
  });

  document.querySelectorAll(".blend-checkbox").forEach(cb => {
    cb.addEventListener("change", updateBlend);
  });
}

function toggleDetail(i) {
  const el = document.getElementById(`detail-${i}`);
  el.style.display = (el.style.display === "none" || !el.style.display) ? "block" : "none";
}

// 搜尋
document.getElementById("search").addEventListener("input", (e) => {
  const keywords = e.target.value.toLowerCase().split(",").map(k => k.trim()).filter(k => k);
  const filtered = oils.filter(oil =>
    keywords.some(k => oil.name.toLowerCase().includes(k) || oil.en.toLowerCase().includes(k))
  );
  renderList(filtered.length ? filtered : oils);
});

// 更新調配
function updateBlend() {
  const selected = document.querySelectorAll(".blend-checkbox:checked");
  blendList.innerHTML = "";
  selected.forEach(cb => {
    const row = document.createElement("div");
    row.innerHTML = `${cb.dataset.name}：<input type='number' value='0' min='0' class='blend-input' oninput='calcTotal()'> ml`;
    blendList.appendChild(row);
  });
  calcTotal();
}

function calcTotal() {
  const inputs = document.getElementsByClassName("blend-input");
  let total = 0;
  for (let i = 0; i < inputs.length; i++) {
    total += parseFloat(inputs[i].value) || 0;
  }
  blendTotal.innerText = total.toFixed(2);
}

// 保存到 Google Sheets（需開啟 Apps Script Webhook）
const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzxwACQy_3OahRwjxJarlcuI8aqLcHQdsAQenMkaRcHpzkPc3Cs-yPCLsKoNsLIPdXv/exec";

document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("save-btn");
  saveBtn.addEventListener("click", async () => {
    const keywords = document.getElementById("search").value;
    const checkboxes = document.querySelectorAll(".blend-checkbox:checked");
    const inputs = document.getElementsByClassName("blend-input");
    const total = parseFloat(document.getElementById("blend-total").innerText) || 0;
    let oils = [];
    for (let i = 0; i < checkboxes.length; i++) {
      oils.push(`${checkboxes[i].dataset.name} ${inputs[i].value}ml`);
    }

    if (!keywords || oils.length === 0) {
      alert("請輸入症狀並選擇精油");
      return;
    }

    const payload = { keywords, oils: oils.join("，"), total };
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      });
      const result = await res.json();
      if (result.status === "success") {
        alert("已保存到 Google Sheets");
      } else {
        alert("保存失敗");
      }
    } catch (e) {
      alert("請檢查 Apps Script 是否正確部署並允許匿名訪問");
      console.error(e);
    }
  });
});


fetchData();
