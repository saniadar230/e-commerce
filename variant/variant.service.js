import pool from "../db/db.js";
import { NotFoundError, ValidationError } from "../helperFunctions/apiError.js";
import { VariantRepository } from "./variant.repository.js";
import { VariantAttributeValueRepository } from "./variantAttributeValue.repository.js";
import { ProductRepository } from "../products/product.repository.js";
import { AttributeValueRepository } from "../attributes/attributeValue.repository.js";

import { getPagination, buildMeta } from "../common/pagination.js";
// for check the allowed attributes for particular product
import { CategoryAttributeRepository } from "../categories/categoryAttribute.repository.js"


// variants -- relation with in the sense of before variants 
// -> products should exists, attributes should exists, attribute_values should exist
// need variant attribute value table

// variant_attribute_values. Without it, a variant is just a row with price and stock, and nothing says what makes it different.
class VariantService {
  // dependency injection: the 4 repositories come from outside
  constructor(
    variantRepository,
    variantAttributeValueRepository,
    productRepository,
    attributeValueRepository,
    categoryAttributeIns,
  ) {
    this.variantRepository = variantRepository;
    this.variantAttributeValueRepository = variantAttributeValueRepository;
    this.productRepository = productRepository;
    this.attributeValueRepository = attributeValueRepository;
    this.categoryAttribute = categoryAttributeIns;
  }


  // -------- get all variants ------

  async findAll(query) {
    const { page, limit, offset } = getPagination(query);
    const { data, total } = await this.variantRepository.findAll({
      limit,
      offset,
      isActive
    });
    // query.is_active may arrive as "true"/"false" (string) or a boolean

    return { data, meta: buildMeta({ page, limit, total }) };
  }

  // ---------- private helpers ----------
  async #ensureProductExists(productId) {
    const product = await this.productRepository.findById(productId);
    if (!product) throw new NotFoundError("product not found");
  }

  // product table has category id
  // category_attributes -- attribute_id

  async #ensureAttributesAllowed(productId, attributes) {
    const product = await this.productRepository.findById(productId)
    // now product(object) row gave us the category id, take that id and fetch the attributes from category attributes table 
    const categoryId = product.category_id;
    const allowedAttributes = await this.categoryAttribute.findByCategoryId(categoryId);

    // check the incoming attribute matches to data -- incoming == attributes --- to matched ==allowedAttributes
    // --- attributes must be allowed, each attribute sent must be allowed and active in the category

    for (const attribute of attributes) {
      const row = allowedAttributes.find((element) => element.id === attribute.attribute_id)
      if (!row) throw new ValidationError("Attribute is not allowed for this category");
      if (!row.is_active) throw new ValidationError("Attribute is not active");
    }


    // ---- rule 2: every required attribute must be sent(only consider where required is ture) ---- -- given two arrays attributes, allowedAttributes (db)
    const requiredRow = allowedAttributes.filter((element) => element.required)
    for (const attribute of requiredRow) {
      const required = attributes.some((element) => element.attribute_id === attribute.id)
      if (!required) throw new ValidationError(`Attribute "${attribute.name}" is required`);
    }

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
  // ----- product variant
  // Is the attribute allowed for this product's category? 
  // Did the user send every attribute that the category requires?
  // Is the attribute currently active in the database?
  // Does this exact combination already exist for this product?


  //========= Find which attributes are allowed for the product -- productId, attributes


  async create(data) {
    await this.#ensureProductExists(data.product_id);
    await this.#ensureValuesMatchAttributes(data.attributes);
    await this.#ensureAttributesAllowed(data.product_id, data.attributes);

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
    const variant = await this.variantRepository.patch(id, data);
    if (!variant) throw new NotFoundError("variant not found");
    return variant;
  }

  // ---------- remove (links first, then the variant, in ONE transaction) ----------
  async remove(id) {
    // entire transaction must run on the same connection.
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
const categoryAttribute = new CategoryAttributeRepository()

export const variantService = new VariantService(
  variantRepository,
  variantAttributeValueRepository,
  productRepository,
  attributeValueRepository,
  categoryAttribute,
);
