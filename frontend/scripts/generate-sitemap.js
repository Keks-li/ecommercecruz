import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://cruzaroent.com';
const API_URL = process.env.VITE_API_URL || 'https://api.cruzaroent.com/api';

const staticCategories = [
  'Phones',
  'Refrigerators',
  'Washing',
  'AC Units',
  'Microwaves',
];

async function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];
  let products = [];
  let dynamicCategories = new Set(staticCategories);

  try {
    const endpoint = API_URL.endsWith('/api') ? `${API_URL}/products` : `${API_URL}/api/products`;
    const res = await fetch(endpoint, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      products = Array.isArray(data) ? data : data.products || [];
      products.forEach((p) => {
        if (p.category) dynamicCategories.add(p.category);
      });
      console.log(`Fetched ${products.length} products for sitemap.`);
    } else {
      console.warn(`API returned status ${res.status}. Falling back to default entries.`);
    }
  } catch (err) {
    console.warn(`Could not reach API to fetch dynamic products: ${err.message}. Using fallback catalog.`);
    products = [{ id: 1 }];
  }

  const urls = [];

  // Home
  urls.push(`  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.00</priority>
  </url>`);

  // Categories
  Array.from(dynamicCategories).forEach((cat) => {
    urls.push(`  <url>
    <loc>${BASE_URL}/category/${encodeURIComponent(cat)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>`);
  });

  // Products
  products
    .filter((p) => p && p.id && p.status !== 'SUSPENDED')
    .forEach((p) => {
      urls.push(`  <url>
    <loc>${BASE_URL}/product/${p.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.90</priority>
  </url>`);
    });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.join('\n')}
</urlset>
`;

  const targetPath = path.resolve(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(targetPath, xml, 'utf8');
  console.log(`Successfully generated sitemap at: ${targetPath}`);
}

generateSitemap();
