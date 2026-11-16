//  attributeValue.service.js

import { AttributeRepository } from "./attribute.repository.js";
import { AttributeValueRepository } from "./attributeValue.repository.js";
import { NotFoundError } from "../apiError.js";
import { getPagination, buildMeta } from "../common/pagination.js";

class AttributeValueService {
    // this refers to the newly created service object  
    //  {
    // repository: attributeValueRepository
    // };
    constructor(attributeInstance, attributeValueInstance) {
        this.attributeRepository = attributeInstance
        this.attributeValueRepository = attributeValueInstance
    }

    // before creating attribute values attribute must exits
    // ===== relationship check (used by create, update and list) =====
    // attributeValue can only belong to a attribute that exists

    // -- findbyId coming from base repository -- attribute value 
    async #ensureAttributeExists(attributeId) {
        const attribute = await this.attributeRepository.findById(attributeId);

        if (!attribute) {
            throw new NotFoundError("attribute not found");
        }
    }

    async create(data) {
        //  attribute must exist
        await this.#ensureAttributeExists(data.attribute_id);

        //  then create the attributeValue
        return this.attributeValueRepository.create(data);
    }

    async getAll(query) {
        const { page, limit, offset } = getPagination(query)

        if (query.attribute_id) {
            await this.#ensureAttributeExists(query.attribute_id)
        }

        const { data, total } = await this.attributeValueRepository.findAll({
            limit, offset, attribute_id: query.attribute_id,
        });
        return { data, meta: buildMeta({ page, limit, total }) };
    }

    async getById(id) {
        const value = await this.attributeValueRepository.findById(id)
        if (!value) {
            throw new NotFoundError("attribute value not found");
        }
        return value;
    }

    async update(id, data) {
        const updated = await this.attributeValueRepository.patch(id, data)

        if (!updated) {
            throw new NotFoundError("attrbute value not found")
        }
        return updated
    }

    async delete(id) {
        const isDeleted = await this.attributeValueRepository.delete(id)

        if (!isDeleted) {
            throw new NotFoundError("attribute value not found")
        }

        return isDeleted
    }
}

const attributeRepository = new AttributeRepository()
const attributeValueRepository = new AttributeValueRepository()


// constructor recieves two arguments -- attributeRepository, attributeValueRepository
export const attributeValueService = new AttributeValueService(attributeRepository, attributeValueRepository)