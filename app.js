import { createApp, computed, reactive, ref } from "https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js";

const STORAGE_KEY = "purchaseRecords.v2";

createApp({
  setup() {
    const records = ref(loadRecords());

    const form = reactive({
      item: "",
      purchaseDate: "",
      price: ""
    });

    const totalCost = computed(() => {
      const total = records.value.reduce((sum, row) => sum + Number(row.price || 0), 0);
      return formatCurrency(total);
    });

    function loadRecords() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    function saveRecords() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value));
    }

    function formatCurrency(val) {
      return `¥${Number(val).toFixed(2)}`;
    }

    function computeDaysUsed(purchaseDate) {
      const today = new Date();
      const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const purchase = new Date(`${purchaseDate}T00:00:00`);
      const diff = Math.floor((dayStart.getTime() - purchase.getTime()) / (24 * 60 * 60 * 1000));
      return Math.max(1, diff + 1);
    }

    function dailyCost(record) {
      const days = computeDaysUsed(record.purchaseDate);
      return formatCurrency(record.price / days);
    }

    function addRecord() {
      const item = form.item.trim();
      const purchaseDate = form.purchaseDate;
      const price = Number(form.price);

      if (!item || !purchaseDate || Number.isNaN(price) || price <= 0) {
        alert("请输入有效数据：物品名称、购买日期、价格（>0）。");
        return;
      }

      records.value.unshift({
        id: crypto.randomUUID(),
        item,
        purchaseDate,
        price: Number(price.toFixed(2))
      });

      saveRecords();

      form.item = "";
      form.purchaseDate = "";
      form.price = "";
    }

    function removeRecord(id) {
      records.value = records.value.filter((row) => row.id !== id);
      saveRecords();
    }

    function clearAll() {
      if (!confirm("确定要清空所有记录吗？")) return;
      records.value = [];
      saveRecords();
    }

    return {
      form,
      records,
      totalCost,
      addRecord,
      removeRecord,
      clearAll,
      computeDaysUsed,
      formatCurrency,
      dailyCost
    };
  },
  template: `
    <main class="container">
      <header class="hero">
        <h1>✨ 购买记录 · 每日成本计算器</h1>
        <p>Vue 3 驱动，记录价格与购买日期，自动计算“用到今天”每天花了多少钱。</p>
      </header>

      <section class="glass card form-card">
        <h2>新增记录</h2>
        <form class="form-grid" @submit.prevent="addRecord">
          <label>
            物品名称
            <input v-model="form.item" type="text" placeholder="例如：人体工学椅" required />
          </label>
          <label>
            购买日期
            <input v-model="form.purchaseDate" type="date" required />
          </label>
          <label>
            价格（元）
            <input v-model="form.price" type="number" min="0.01" step="0.01" placeholder="例如：1599" required />
          </label>
          <button class="btn primary" type="submit">+ 保存记录</button>
        </form>
      </section>

      <section class="glass card list-card">
        <div class="list-head">
          <h2>记录列表</h2>
          <div class="head-actions">
            <span class="total">总支出：{{ totalCost }}</span>
            <button class="btn danger" type="button" @click="clearAll">清空全部</button>
          </div>
        </div>

        <p v-if="records.length === 0" class="empty">暂无记录，先添加第一条吧 🚀</p>

        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>物品</th>
                <th>购买日期</th>
                <th>价格</th>
                <th>已使用天数</th>
                <th>每日成本</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in records" :key="row.id">
                <td>{{ index + 1 }}</td>
                <td>{{ row.item }}</td>
                <td>{{ row.purchaseDate }}</td>
                <td>{{ formatCurrency(row.price) }}</td>
                <td>{{ computeDaysUsed(row.purchaseDate) }}</td>
                <td>{{ dailyCost(row) }}</td>
                <td>
                  <button class="btn sm danger" type="button" @click="removeRecord(row.id)">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  `
}).mount("#app");
