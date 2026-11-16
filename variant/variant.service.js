import pool from "../db/db.js";
import { NotFoundError, ValidationError } from "../apiError.js";
import { VariantRepository } from "./variant.repository.js";
import { VariantAttributeValueRepository } from "./variantAttributeValue.repository.js";
import { ProductRepository } from "../products/product.repository.js";
import { AttributeValueRepository } from "../attributes/attributeValue.repository.js";

class VariantService {
  // dependency injection: the 4 repositories come from outside
  constructor(
    variantRepository,
    variantAttributeValueRepository,
    productRepository,
    attributeValueRepository,
  ) {
    this.variantRepository = variantRepository;
    this.variantAttributeValueRepository = variantAttributeValueRepository;
    this.productRepository = productRepository;
    this.attributeValueRepository = attributeValueRepository;
  }

  // ---------- private helpers ----------
  async #ensureProductExists(productId) {
    const product = await this.productRepository.findById(productId);
    if (!product) throw new NotFoundError("product not found");
  }

  // each attribute_value must belong to the attribute it is sent with
  async #ensureValuesMatchAttributes(attributes) {
    for (const { attribute_id, attribute_value_id } of attributes) {
      const value =
        await this.attributeValueRepository.findById(attribute_value_id);
      if (!value) throw new NotFoundError("attribute value not found");
      if (value.attribute_id !== attribute_id) {
        throw new ValidationError(
          "attribute value does not belong to this attribute",
        );
      }
    }
  }

  // ---------- create (variant + its attribute links in ONE transaction) ----------
  async create(data) {
    await this.#ensureProductExists(data.product_id);
    await this.#ensureValuesMatchAttributes(data.attributes);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const variant = await this.variantRepository.create(data, client);
      await this.variantAttributeValueRepository.createMany(
        variant.id,
        data.attributes,
        client,
      );
      await client.query("COMMIT");
      return variant;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release(); // always give the connection back to the pool
    }
  }

  // ---------- reads ----------
  async getByProduct(productId) {
    await this.#ensureProductExists(productId);
    return this.variantRepository.findByProductId(productId);
  }

  async getById(id) {
    const variant = await this.variantRepository.findById(id);
    if (!variant) throw new NotFoundError("variant not found");

    const attributes =
      await this.variantAttributeValueRepository.findByVariantId(id);
    return { ...variant, attributes };
  }

  // ---------- update (PATCH) ----------
  async update(id, data) {
    const variant = await this.variantRepository.update(id, data);
    if (!variant) throw new NotFoundError("variant not found");
    return variant;
  }

  // ---------- remove (links first, then the variant, in ONE transaction) ----------
  async remove(id) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await this.variantAttributeValueRepository.deleteByVariantId(id, client);
      const deleted = await this.variantRepository.delete(id, client);
      if (!deleted) throw new NotFoundError("variant not found"); // triggers ROLLBACK
      await client.query("COMMIT");
      return deleted;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}

// ---------- create instances ----------
const variantRepository = new VariantRepository();
const variantAttributeValueRepository = new VariantAttributeValueRepository();
const productRepository = new ProductRepository();
const attributeValueRepository = new AttributeValueRepository();

export const variantService = new VariantService(
  variantRepository,
  variantAttributeValueRepository,
  productRepository,
  attributeValueRepository,
);
