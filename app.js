const tools = [
  {
    name: "JSON 格式化",
    description: "格式化、压缩并校验 JSON 内容。",
    tags: ["json", "格式化", "开发"],
    url: "./tools/json-formatter/"
  },
  {
    name: "时间戳转换",
    description: "Unix 时间戳与可读时间互转。",
    tags: ["时间", "timestamp", "转换"],
    url: "./tools/timestamp-converter/"
  }
];

const grid = document.querySelector("#tools-grid");
const searchInput = document.querySelector("#search");
const template = document.querySelector("#tool-card-template");

function render(list) {
  grid.innerHTML = "";

  if (list.length === 0) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "没有匹配的工具，试试其他关键词。";
    grid.appendChild(p);
    return;
  }

  list.forEach((tool) => {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector(".card-title").textContent = tool.name;
    fragment.querySelector(".card-desc").textContent = tool.description;
    fragment.querySelector(".card-tags").textContent = `标签：${tool.tags.join(" / ")}`;

    const link = fragment.querySelector(".card-link");
    link.href = tool.url;
    link.setAttribute("aria-label", `打开 ${tool.name}`);

    grid.appendChild(fragment);
  });
}

function filterTools(keyword) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return tools;
  }

  return tools.filter((tool) => {
    const haystack = `${tool.name} ${tool.description} ${tool.tags.join(" ")}`.toLowerCase();
    return haystack.includes(normalized);
  });
}

searchInput.addEventListener("input", (event) => {
  const result = filterTools(event.target.value);
  render(result);
});

render(tools);
