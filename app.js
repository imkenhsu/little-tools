import { createApp, computed, reactive, ref } from "https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js";
import {
  computeDaysUsed,
  createRecordId,
  dailyCost,
  exportRecords,
  formatCurrency,
  importRecords,
  isFutureDate,
  isValidDateInput,
  loadRecords,
  normalizeCategory,
  parsePositivePrice,
  saveRecords
} from "./purchase-utils.js";

createApp({
  setup() {
    const records = ref(loadRecords());
    const form = reactive({
      item: "",
      category: "",
      purchaseDate: "",
      price: ""
    });
    const editForm = reactive({
      id: "",
      item: "",
      category: "",
      purchaseDate: "",
      price: ""
    });
    const filters = reactive({
      query: "",
      sortBy: "purchaseDate-desc",
      category: "all"
    });
    const editingId = ref("");
    const notice = ref("");
    const noticeType = ref("info");
    const importText = ref("");
    const today = new Date();
    const maxDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const totalCost = computed(() => {
      const total = records.value.reduce((sum, row) => sum + Number(row.price || 0), 0);
      return formatCurrency(total);
    });
    const totalCount = computed(() => records.value.length);
    const categories = computed(() => {
      const values = new Set(records.value.map((row) => row.category));
      return ["all", ...Array.from(values).sort((left, right) => left.localeCompare(right, "zh-CN"))];
    });
    const categoryStats = computed(() => {
      const groups = new Map();

      for (const row of records.value) {
        const current = groups.get(row.category) || { category: row.category, count: 0, total: 0 };
        current.count += 1;
        current.total += row.price;
        groups.set(row.category, current);
      }

      return Array.from(groups.values())
        .sort((left, right) => right.total - left.total)
        .map((entry) => ({
          ...entry,
          totalText: formatCurrency(entry.total)
        }));
    });
    const topCategory = computed(() => categoryStats.value[0]?.category || "未分类");
    const filteredRecords = computed(() => {
      const query = filters.query.trim().toLowerCase();
      const category = filters.category;
      const items = records.value.filter((row) => {
        const matchesQuery = query
          ? `${row.item} ${row.category}`.toLowerCase().includes(query)
          : true;
        const matchesCategory = category === "all" ? true : row.category === category;
        return matchesQuery && matchesCategory;
      });

      items.sort((left, right) => {
        switch (filters.sortBy) {
          case "purchaseDate-asc":
            return left.purchaseDate.localeCompare(right.purchaseDate);
          case "price-desc":
            return right.price - left.price;
          case "price-asc":
            return left.price - right.price;
          case "item-asc":
            return left.item.localeCompare(right.item, "zh-CN");
          case "category-asc":
            return left.category.localeCompare(right.category, "zh-CN");
          case "purchaseDate-desc":
          default:
            return right.purchaseDate.localeCompare(left.purchaseDate);
        }
      });

      return items;
    });
    const visibleCount = computed(() => filteredRecords.value.length);

    function resetForm(target) {
      target.item = "";
      target.category = "";
      target.purchaseDate = "";
      target.price = "";
    }

    function showNotice(message, type = "info") {
      notice.value = message;
      noticeType.value = type;
    }

    function validateRecordInput(item, purchaseDate, price) {
      if (!item || !purchaseDate || !price || !isValidDateInput(purchaseDate)) {
        showNotice("请输入有效数据：物品名称、购买日期、价格（>0）。", "error");
        return false;
      }

      if (isFutureDate(purchaseDate)) {
        showNotice("购买日期不能晚于今天。", "error");
        return false;
      }

      return true;
    }

    if (records.value.length > 0) {
      saveRecords(records.value);
    }

    function addRecord() {
      const item = form.item.trim();
      const category = normalizeCategory(form.category);
      const purchaseDate = form.purchaseDate;
      const price = parsePositivePrice(form.price);

      if (!validateRecordInput(item, purchaseDate, price)) {
        return;
      }

      records.value.unshift({
        id: createRecordId(),
        item,
        category,
        purchaseDate,
        price
      });

      saveRecords(records.value);
      resetForm(form);
      showNotice(`已添加：${item}`, "success");
    }

    function removeRecord(id) {
      const target = records.value.find((row) => row.id === id);
      records.value = records.value.filter((row) => row.id !== id);
      if (editingId.value === id) {
        cancelEdit();
      }
      saveRecords(records.value);
      showNotice(target ? `已删除：${target.item}` : "记录已删除。", "success");
    }

    function clearAll() {
      if (!confirm("确定要清空所有记录吗？")) return;
      records.value = [];
      cancelEdit();
      saveRecords(records.value);
      showNotice("所有记录已清空。", "success");
    }

    function displayDaysUsed(purchaseDate) {
      const days = computeDaysUsed(purchaseDate);
      return days ?? "--";
    }

    function startEdit(record) {
      editingId.value = record.id;
      editForm.id = record.id;
      editForm.item = record.item;
      editForm.category = record.category;
      editForm.purchaseDate = record.purchaseDate;
      editForm.price = String(record.price);
      showNotice(`正在编辑：${record.item}`, "info");
    }

    function cancelEdit() {
      editingId.value = "";
      editForm.id = "";
      resetForm(editForm);
    }

    function saveEdit() {
      const item = editForm.item.trim();
      const category = normalizeCategory(editForm.category);
      const purchaseDate = editForm.purchaseDate;
      const price = parsePositivePrice(editForm.price);

      if (!validateRecordInput(item, purchaseDate, price)) {
        return;
      }

      records.value = records.value.map((row) => (
        row.id === editForm.id
          ? { ...row, item, category, purchaseDate, price }
          : row
      ));

      saveRecords(records.value);
      cancelEdit();
      showNotice(`已更新：${item}`, "success");
    }

    function handleExport() {
      const data = exportRecords(records.value);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `purchase-records-${maxDate}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showNotice("记录已导出为 JSON 文件。", "success");
    }

    function handleImport() {
      const { records: imported, error } = importRecords(importText.value);
      if (error) {
        showNotice(error, "error");
        return;
      }

      const merged = [...imported, ...records.value];
      const deduped = [];
      const seen = new Set();

      for (const row of merged) {
        const key = `${row.item}|${row.category}|${row.purchaseDate}|${row.price}`;
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(row);
      }

      records.value = deduped;
      saveRecords(records.value);
      importText.value = "";
      showNotice(`已导入 ${imported.length} 条记录。`, "success");
    }

    return {
      categories,
      categoryStats,
      editForm,
      editingId,
      filters,
      form,
      handleExport,
      handleImport,
      importText,
      notice,
      noticeType,
      maxDate,
      records,
      filteredRecords,
      totalCount,
      totalCost,
      topCategory,
      visibleCount,
      addRecord,
      cancelEdit,
      removeRecord,
      clearAll,
      displayDaysUsed,
      saveEdit,
      startEdit,
      formatCurrency,
      dailyCost
    };
  },
  template: `
    <main class="container">
      <section class="hero-shell">
        <header class="hero">
          <p class="eyebrow">Purchase Ledger</p>
          <h1>购买记录 · 每日成本计算器</h1>
          <p class="hero-copy">把零散消费整理成清晰账本，直接看到总支出、分类分布和单件物品每天的使用成本。</p>
          <div class="hero-metrics">
            <article class="metric-card">
              <span class="metric-label">总支出</span>
              <strong class="metric-value">{{ totalCost }}</strong>
            </article>
            <article class="metric-card">
              <span class="metric-label">记录数量</span>
              <strong class="metric-value">{{ totalCount }}</strong>
            </article>
            <article class="metric-card">
              <span class="metric-label">主分类</span>
              <strong class="metric-value">{{ topCategory }}</strong>
            </article>
          </div>
        </header>

        <section class="glass card compose-card">
          <div class="section-head">
            <div>
              <p class="section-kicker">Quick Add</p>
              <h2>新增记录</h2>
            </div>
            <span class="section-hint">支持分类、日期和价格校验</span>
          </div>

          <p v-if="notice" class="notice" :class="'notice-' + noticeType">{{ notice }}</p>

          <form class="form-grid" @submit.prevent="addRecord">
            <label>
              物品名称
              <input v-model="form.item" type="text" placeholder="例如：人体工学椅" required />
            </label>
            <label>
              分类
              <input v-model="form.category" type="text" placeholder="例如：办公 / 数码 / 家居" />
            </label>
            <label>
              购买日期
              <input v-model="form.purchaseDate" :max="maxDate" type="date" required />
            </label>
            <label>
              价格（元）
              <input v-model="form.price" type="number" min="0.01" step="0.01" placeholder="例如：1599" required />
            </label>
            <button class="btn primary submit-btn" type="submit">保存记录</button>
          </form>
        </section>
      </section>

      <section class="glass card dashboard-card">
        <div class="list-head">
          <div>
            <p class="section-kicker">Records</p>
            <h2>记录总览</h2>
          </div>
          <div class="head-actions">
            <span class="total">当前显示 {{ visibleCount }} / {{ totalCount }}</span>
            <button class="btn ghost toolbar-btn" type="button" @click="handleExport">导出 JSON</button>
            <button class="btn danger toolbar-btn" type="button" @click="clearAll">清空全部</button>
          </div>
        </div>

        <div class="dashboard-grid">
          <aside class="sidebar-stack">
            <section class="panel">
              <div class="section-head">
                <div>
                  <p class="section-kicker">Filter</p>
                  <h3>筛选与排序</h3>
                </div>
              </div>
              <div class="toolbar">
                <label>
                  搜索物品
                  <input v-model="filters.query" type="search" placeholder="输入关键字筛选" />
                </label>
                <label>
                  排序方式
                  <select v-model="filters.sortBy">
                    <option value="purchaseDate-desc">购买日期：最新优先</option>
                    <option value="purchaseDate-asc">购买日期：最早优先</option>
                    <option value="price-desc">价格：从高到低</option>
                    <option value="price-asc">价格：从低到高</option>
                    <option value="item-asc">物品名称：A-Z</option>
                    <option value="category-asc">分类：A-Z</option>
                  </select>
                </label>
                <label>
                  分类筛选
                  <select v-model="filters.category">
                    <option v-for="category in categories" :key="category" :value="category">
                      {{ category === "all" ? "全部分类" : category }}
                    </option>
                  </select>
                </label>
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <p class="section-kicker">Categories</p>
                  <h3>分类统计</h3>
                </div>
              </div>
              <ul v-if="categoryStats.length > 0" class="stats-list">
                <li v-for="entry in categoryStats" :key="entry.category">
                  <span>{{ entry.category }}</span>
                  <span>{{ entry.count }} 条 / {{ entry.totalText }}</span>
                </li>
              </ul>
              <p v-else class="empty">暂无分类数据。</p>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <p class="section-kicker">Import</p>
                  <h3>导入记录</h3>
                </div>
              </div>
              <textarea
                v-model="importText"
                rows="7"
                placeholder="粘贴之前导出的 JSON 数组"
              ></textarea>
              <button class="btn primary import-btn" type="button" @click="handleImport">导入并合并</button>
            </section>
          </aside>

          <section class="panel table-panel">
            <p v-if="records.length === 0" class="empty state-copy">暂无记录，先添加第一条吧。</p>
            <p v-else-if="filteredRecords.length === 0" class="empty state-copy">没有匹配结果，换个关键字试试。</p>

            <div v-else class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>物品</th>
                    <th>分类</th>
                    <th>购买日期</th>
                    <th>价格</th>
                    <th>已使用天数</th>
                    <th>每日成本</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in filteredRecords" :key="row.id">
                    <td>{{ index + 1 }}</td>
                    <td>
                      <input
                        v-if="editingId === row.id"
                        v-model="editForm.item"
                        type="text"
                        placeholder="物品名称"
                      />
                      <span v-else>{{ row.item }}</span>
                    </td>
                    <td>
                      <input
                        v-if="editingId === row.id"
                        v-model="editForm.category"
                        type="text"
                        placeholder="分类"
                      />
                      <span v-else class="tag">{{ row.category }}</span>
                    </td>
                    <td>
                      <input
                        v-if="editingId === row.id"
                        v-model="editForm.purchaseDate"
                        :max="maxDate"
                        type="date"
                      />
                      <span v-else>{{ row.purchaseDate }}</span>
                    </td>
                    <td>
                      <input
                        v-if="editingId === row.id"
                        v-model="editForm.price"
                        type="number"
                        min="0.01"
                        step="0.01"
                      />
                      <span v-else>{{ formatCurrency(row.price) }}</span>
                    </td>
                    <td>{{ editingId === row.id ? displayDaysUsed(editForm.purchaseDate) : displayDaysUsed(row.purchaseDate) }}</td>
                    <td>{{ editingId === row.id ? dailyCost({ purchaseDate: editForm.purchaseDate, price: Number(editForm.price) }) : dailyCost(row) }}</td>
                    <td>
                      <div class="row-actions">
                        <button
                          v-if="editingId === row.id"
                          class="btn sm primary"
                          type="button"
                          @click="saveEdit"
                        >
                          保存
                        </button>
                        <button
                          v-if="editingId === row.id"
                          class="btn sm ghost"
                          type="button"
                          @click="cancelEdit"
                        >
                          取消
                        </button>
                        <button
                          v-else
                          class="btn sm ghost"
                          type="button"
                          @click="startEdit(row)"
                        >
                          编辑
                        </button>
                        <button class="btn sm danger" type="button" @click="removeRecord(row.id)">删除</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </main>
  `
}).mount("#app");
