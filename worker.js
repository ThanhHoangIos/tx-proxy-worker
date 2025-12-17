export default {
  async fetch(request) {
    const target = "https://sunwinsaygex-8616.onrender.com/api/sun";
    const res = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const data = await res.text();
    return new Response(data, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
      }
    });
  }
};
