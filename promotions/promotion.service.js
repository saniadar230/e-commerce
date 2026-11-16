import { NotFoundError } from "../apiError.js";
import { PromotionRepository } from "./promotion.repository.js";
import { getPagination, buildMeta } from "../common/pagination.js";

class PromotionService {
    constructor(promotionRepositoryInstance) {
        this.promotionRepository = promotionRepositoryInstance;
    }

    async create(data) {
        return this.promotionRepository.create(data);
    }

    async getAll(query) {
        const { page, limit, offset } = getPagination(query);
        const { data, total } = await this.promotionRepository.findAll({ limit, offset });
        return { data, meta: buildMeta({ page, limit, total }) };
    }

    async getById(id) {
        const promotion = await this.promotionRepository.findById(id);
        if (!promotion) throw new NotFoundError("promotion not found");
        return promotion;
    }

    async update(id, data) {
        const updated = await this.promotionRepository.patch(id, data);
        if (!updated) throw new NotFoundError("promotion not found");
        return updated;
    }

    async remove(id) {
        const isDeleted = await this.promotionRepository.delete(id);
        if (!isDeleted) throw new NotFoundError("promotion not found");
        return isDeleted;
    }
}

const promotionRepositoryIns = new PromotionRepository();
export const promotionService = new PromotionService(promotionRepositoryIns);