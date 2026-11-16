import { BaseRepository } from "../common/BaseRepository.js";
import { NotFoundError } from "../apiError.js";
import { CampaignApplicationRepository } from "./campaignApplication.repository.js";
import { CampaignRepository } from "./campaign.repository.js";
import { PromotionRepository } from "../promotions/promotion.repository.js";
import { RegionRepository } from "../regions/region.repository.js";
import { CategoryRepository } from "../categories/category.repository.js";
import { ProductRepository } from "../products/product.repository.js";

class CampaignApplicationService {
    // one object instead of 7 positional arguments, so the order can't be mixed up
    constructor({ applicationRepository, campaignRepository, promotionRepository,
        regionRepository, categoryRepository, productRepository, variantRepository }) {
        this.applicationRepository = applicationRepository;
        this.campaignRepository = campaignRepository;
        this.promotionRepository = promotionRepository;
        this.regionRepository = regionRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.variantRepository = variantRepository;
    }

    async #ensureExists(repository, id, label) {
        const row = await repository.findById(id);
        if (!row) throw new NotFoundError(`${label} not found`);
    }

    // the target to check depends on the scope
    async #ensureTargetExists(data) {
        if (data.scope === "category") await this.#ensureExists(this.categoryRepository, data.category_id, "category");
        if (data.scope === "product") await this.#ensureExists(this.productRepository, data.product_id, "product");
        if (data.scope === "variant") await this.#ensureExists(this.variantRepository, data.variant_id, "variant");
        // global has no target
    }

    async create(campaignId, data) {
        await this.#ensureExists(this.campaignRepository, campaignId, "campaign");
        await this.#ensureExists(this.promotionRepository, data.promotion_id, "promotion");
        if (data.region_id) await this.#ensureExists(this.regionRepository, data.region_id, "region");
        await this.#ensureTargetExists(data);

        return this.applicationRepository.create({ campaign_id: campaignId, ...data });
    }

    async getByCampaign(campaignId) {
        await this.#ensureExists(this.campaignRepository, campaignId, "campaign");
        return this.applicationRepository.findByCampaignId(campaignId);
    }

    async remove(campaignId, applicationId) {
        const isDeleted = await this.applicationRepository.deleteApplication(campaignId, applicationId);
        if (!isDeleted) throw new NotFoundError("application not found");
        return isDeleted;
    }
}

export const campaignApplicationService = new CampaignApplicationService({
    applicationRepository: new CampaignApplicationRepository(),
    campaignRepository: new CampaignRepository(),
    promotionRepository: new PromotionRepository(),
    regionRepository: new RegionRepository(),
    categoryRepository: new CategoryRepository(),
    productRepository: new ProductRepository(),
    // variants CRUD isn't finished, so the generic base class is enough for findById
    variantRepository: new BaseRepository("variants", []),
});