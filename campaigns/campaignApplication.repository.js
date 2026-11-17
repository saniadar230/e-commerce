import { BaseRepository } from "../common/BaseRepository.js";
import pool from "../db/db.js";

export class CampaignApplicationRepository extends BaseRepository {
    constructor() {
        super("campaign_applications", []);
    }

    async create(data) {
        const sql = `insert into ${this.tableName}
            (campaign_id, promotion_id, region_id, scope, category_id, product_id, variant_id)
            values ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
        const result = await pool.query(sql, [
            data.campaign_id,
            data.promotion_id,
            data.region_id ?? null,
            data.scope,
            data.category_id ?? null,
            data.product_id ?? null,
            data.variant_id ?? null,
        ]);
        return result.rows[0];
    }

    async findByCampaignId(campaignId) {
        // ---- query: applications + promotion name + region name (region can be NULL) ----
        const sql = `
            select ca.*, p.name as promotion_name, r.name as region_name
            from ${this.tableName} ca
            JOIN promotions p ON p.id = ca.promotion_id
            LEFT JOIN regions r ON r.id = ca.region_id
            where ca.campaign_id = $1
            order by ca.id`;
        const result = await pool.query(sql, [campaignId]);
        return result.rows;
    }

    // scoped by campaign, so /campaigns/1/applications/5 can't delete an application of campaign 2
    async deleteApplication(campaignId, applicationId) {
        const sql = `delete from ${this.tableName} where campaign_id = $1 AND id = $2 returning *`;
        const result = await pool.query(sql, [campaignId, applicationId]);
        return result.rows[0] ?? null;
    }
}