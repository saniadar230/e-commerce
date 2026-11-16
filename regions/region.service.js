import { RegionRepository } from "./region.repository.js"
import { buildMeta, getPagination } from "../common/pagination.js"

class RegionService {
    constructor(regionService) {
        this.regionRepositoryIns = regionService
    }

    async create(data) {
        return this.regionRepositoryIns.create(data)
    }

    async getAll(query) {
        const { page, limit, offset } = getPagination(query)
        const { data, total } = await this.regionRepositoryIns.findAll({ limit, offset })
        return {
            data, meta: buildMeta({ page, limit, total })
        }
    }

    async getById(id) {
        const region = await this.regionRepositoryIns.findById(id)
        if (!region) {
            throw new NotFoundError("region not found");
        }
        return region
    }
    async update(id, data) {
        const updated = await this.regionRepositoryIns.patch(id, data);
        if (!updated) {
            throw new NotFoundError("region not found");
        }
        return updated;
    }

    async remove(id) {
        const isDeleted = await this.regionRepositoryIns.delete(id);
        if (!isDeleted) {
            throw new NotFoundError("region not found");
        }
        return isDeleted;
    }

}
const regionRepositoryIns = new RegionRepository()
export const regionServiceInstance = new RegionService(regionRepositoryIns)