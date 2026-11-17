import { NotFoundError } from "../helperFunctions/apiError.js";
import { AttributeRepository } from "./attribute.repository.js";
import { getPagination, buildMeta } from "../common/pagination.js";

class AttributeService {
  constructor(attributeInstance) {
    this.attributeRepository = attributeInstance;
  }

  async create(data) {
    return this.attributeRepository.create(data);
  }

  async getAll(query) {
    const { page, limit, offset } = getPagination(query);
    const { data, total } = await this.attributeRepository.findAll({
      limit,
      offset,
    });
    return { data, meta: buildMeta({ page, limit, total }) };
  }

  async getById(id) {
    const attribute = await this.attributeRepository.findById(id);
    if (!attribute) throw new NotFoundError("attribute not found");
    return attribute;
  }

  async updateAttribute(id, data) {
    const updated = await this.attributeRepository.patch(id, data);
    if (!updated) throw new NotFoundError("attribute not found");
    return updated;
  }

  async deleteAttribute(id) {
    const isDeleted = await this.attributeRepository.delete(id);
    if (!isDeleted) throw new NotFoundError("attribute not found");
    return isDeleted;
  }
}

const attributeRepository = new AttributeRepository();
export const attributeService = new AttributeService(attributeRepository);
