import { NotFoundError } from "../apiError.js";
import { CampaignRepository } from "./campaign.repository.js";
import { getPagination, buildMeta } from "../common/pagination.js";

class CampaignService {
    constructor(campaignRepositoryInstance) {
        this.campaignRepository = campaignRepositoryInstance;
    }

    async create(data) {
        return this.campaignRepository.create(data);
    }

    async getAll(query) {
        const { page, limit, offset } = getPagination(query);
        const { data, total } = await this.campaignRepository.findAll({ limit, offset });
        return { data, meta: buildMeta({ page, limit, total }) };
    }

    async getById(id) {
        const campaign = await this.campaignRepository.findById(id);
        if (!campaign) throw new NotFoundError("campaign not found");
        return campaign;
    }

    async update(id, data) {
        const updated = await this.campaignRepository.patch(id, data);
        if (!updated) throw new NotFoundError("campaign not found");
        return updated;
    }

    async remove(id) {
        const isDeleted = await this.campaignRepository.delete(id);
        if (!isDeleted) throw new NotFoundError("campaign not found");
        return isDeleted;
    }
}

const campaignRepository = new CampaignRepository();
export const campaignService = new CampaignService(campaignRepository);