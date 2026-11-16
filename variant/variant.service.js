import pool from "../db/db.js";
import { NotFoundError, ValidationError } from "../apiError.js";
import { VariantRepository } from "./variant.repository.js";
import { VariantAttributeValueRepository } from './variantAttributeValue.repository.js'
import { ProductRepository } from '../products/product.repository.js'
import { AttributeValueRepository } from "../attributes/attributeValue.repository.js"
// + import the 4 repositories: Variant, VariantAttributeValue, Product, AttributeValue

class VariantService {
    // inject 4 repositories: variant, variantAttributeValue, product, attributeValue
    constructor(/* ... */) { }

    async #ensureProductExists(productId) {
        // same pattern as before -> NotFoundError("product not found")
    }

    async #ensureValuesMatchAttributes(attributes) {
        // for each { attribute_id, attribute_value_id }:
        //   find the value row with attributeValueRepository.findById
        //   if missing -> NotFoundError
        //   if value.attribute_id !== attribute_id -> ValidationError
    }

    async create(data) {
        // 1. await this.#ensureProductExists(data.product_id)
        // 2. await this.#ensureValuesMatchAttributes(data.attributes)
        // 3. TRANSACTION:
        //      const client = await pool.connect();
        //      try {
        //          await client.query("BEGIN");
        //          const variant = await this.variantRepository.create(data, client);
        //          await this.variantAttributeValueRepository.createMany(variant.id, data.attributes, client);
        //          await client.query("COMMIT");
        //          return variant;
        //      } catch (err) {
        //          await client.query("ROLLBACK");
        //          throw err;
        //      } finally {
        //          client.release();
        //      }
    }

    async getByProduct(productId) { /* ensure product exists, then findByProductId */ }

    async getById(id) {
        // findById -> NotFoundError if missing
        // attributes = await this.variantAttributeValueRepository.findByVariantId(id)
        // return { ...variant, attributes }
    }

    async update(id, data) { /* patch -> NotFoundError if null */ }

    async remove(id) {
        // delete the links first (deleteByVariantId), then the variant, in one transaction
    }
}


// create instances for Variant, VariantAttributeValue, Product, AttributeValue
const variantRepository = new VariantRepository()
const variantAttributValue = new VariantAttributeValueRepository()