import fallbackNews from "../data/news.json";

const DEFAULT_IMAGE = "/hero.jpg";

function toSummary(text, max = 180) {
  if (!text) return "";
  const plain = text.replace(/<[^>]+>/g, "").trim();
  if (plain.length <= max) return plain;
  return plain.slice(0, max).trim() + "...";
}

function toFullHtml(row) {
  if (row.full_content) return row.full_content;
  const text = row.content || "";
  if (text.includes("<")) return text;
  return `<p>${text}</p>`;
}

export function normalizeArticle(row) {
  const full_content = toFullHtml(row);
  const summary = row.summary || toSummary(row.content || full_content);

  return {
    id: row.id,
    title: row.title,
    summary,
    full_content,
    content: summary,
    category: row.category,
    date: row.date,
    image_url: row.image_url || DEFAULT_IMAGE,
    source_url: row.source_url ?? null,
    source_name: row.source_name ?? null,
    author: row.author ?? null,
    tags: row.tags ?? [],
    featured: row.featured ?? false,
    trending: row.trending ?? false,
    read_time: row.read_time ?? null,
  };
}

export async function fetchNews() {
  return fallbackNews.map(normalizeArticle);
}

export async function fetchNewsById(id) {
  const local = fallbackNews.find((a) => String(a.id) === String(id));
  if (local) return normalizeArticle(local);
  return null;
}

export default { fetchNews, fetchNewsById, normalizeArticle };
