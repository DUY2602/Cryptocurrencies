import fallbackNews from "../data/news.json";

export async function fetchNews() {
  console.log("[news] Using local news data");
  return [...fallbackNews];
}
