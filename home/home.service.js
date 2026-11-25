import pool from "../db/db.js";

const LIMIT = 9;

const stockStatus = (stock) =>
  Number(stock) > 0 ? "in_stock" : "out_of_stock";

async function findByCategory() {
  const result = await pool.query(`
      WITH RECURSIVE tree AS (
        SELECT id, id AS root_id, name AS root_name
          FROM categories
         WHERE parent_id IS NULL

        UNION ALL

        SELECT c.id, t.root_id, t.root_name
          FROM categories c
          JOIN tree t ON c.parent_id = t.id
      )
      SELECT t.root_id AS id, t.root_name AS name, COUNT(p.id)::int AS total_products
        FROM tree t
        LEFT JOIN products p ON p.category_id = t.id
       GROUP BY t.root_id, t.root_name
       ORDER BY t.root_name`);
  return result.rows;
}

// Product ids sold most in the last 30 days (completed orders)
async function findBestSellerIds() {
  const result = await pool.query(
    `SELECT v.product_id AS id
       FROM order_items oi
       JOIN orders   o ON o.id = oi.order_id
                      AND o.status = 'completed'
                      AND o.created_at >= NOW() - INTERVAL '30 days'
       JOIN variants v ON v.id = oi.variant_id
      GROUP BY v.product_id
      ORDER BY SUM(oi.quantity) DESC, v.product_id
      LIMIT $1`,
    [LIMIT]
  );
  return result.rows.map((r) => r.id);
}

// Product ids whose first variant was added most recently
async function findLatestArrivalIds() {
  const result = await pool.query(
    `SELECT product_id AS id
       FROM variants
      GROUP BY product_id
      ORDER BY MIN(created_at) DESC, product_id
      LIMIT $1`,
    [LIMIT]
  );
  return result.rows.map((r) => r.id);
}

// Turns product ids into cards: category, cheapest-variant price, promotion, stock.
// $1 = uuid[] of product ids, $2 = region_id (null = all-region promotions only)
async function priceProducts(ids, regionId) {
  if (ids.length === 0) return [];

  const result = await pool.query(
    `SELECT DISTINCT ON (v.id)
            p.id AS product_id, p.name, c.name AS category,
            v.id AS variant_id, v.sku,
            ROUND(v.price * 100)::bigint AS price, v.stock,
            pr.discount_type, pr.discount_value
       FROM variants v
       JOIN products   p ON p.id = v.product_id
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN variant_current_promotions vcp
              ON vcp.variant_id = v.id
             AND (vcp.region_id = $2::uuid OR vcp.region_id IS NULL)
       LEFT JOIN campaign_applications ca ON ca.id = vcp.campaign_application_id
       LEFT JOIN promotions pr            ON pr.id = ca.promotion_id
      WHERE p.id = ANY($1::uuid[])
      ORDER BY v.id, vcp.region_id NULLS LAST`, // a region-specific pointer beats the default
    [ids, regionId ?? null]
  );

  // One row per variant -> one card per product, shown at its cheapest variant
  const byProduct = new Map();
  for (const r of result.rows) {
    const base = Number(r.price);
    let off = 0;
    if (r.discount_type === "percentage") {
      off = Math.round((base * Number(r.discount_value)) / 100);
    } else if (r.discount_type) {
      off = Math.round(Number(r.discount_value) * 100);
    }
    off = Math.min(off, base);
    const final = base - off;

    const p = byProduct.get(r.product_id) ?? {
      id: r.product_id,
      name: r.name,
      category: r.category,
      price_from: base,
      final_from: final,
      on_sale: off > 0,
      stock_total: 0,
      variants: [],
    };
    if (
      final < p.final_from ||
      (final === p.final_from && base > p.price_from)
    ) {
      p.price_from = base;
      p.final_from = final;
      p.on_sale = off > 0;
    }
    p.stock_total += r.stock;
    p.variants.push({
      id: r.variant_id,
      sku: r.sku,
      price: base,
      stock: Number(r.stock),
    });
    byProduct.set(r.product_id, p);
  }

  // keep the best-seller / new-arrival order
  return ids
    .filter((id) => byProduct.has(id))
    .map((id) => {
      const p = byProduct.get(id);
      return {
        ...p,
        discount_percent: p.on_sale
          ? Math.round((1 - p.final_from / p.price_from) * 100)
          : 0,
        stock_status: stockStatus(p.stock_total),
      };
    });
}

export async function getHome(regionId) {
  const [categories, bestIds, newIds] = await Promise.all([
    findByCategory(),
    findBestSellerIds(),
    findLatestArrivalIds(),
  ]);

  const [bestSellers, latestArrivals] = await Promise.all([
    priceProducts(bestIds, regionId),
    priceProducts(newIds, regionId),
  ]);

  return {
    categories,
    best_sellers: bestSellers,
    new_arrivals: latestArrivals,
  };
}
