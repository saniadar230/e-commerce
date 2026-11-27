import pool from "../../db/db.js";
import { NotFoundError, ValidationError } from "../../helperFunctions/apiError.js";
import { VariantRepository } from "./variant.repository.js";
import { ProductRepository } from "../products/product.repository.js";
import { AttributeRepository } from "../../attributes/attribute.repository.js";

import { getPagination, buildMeta } from "../../common/pagination.js";
// for check the allowed attributes for particular product
import withTransaction from "../../helperFunctions/withTransaction.js";


// variants -- relation with in the sense of before variants 
// -> products should exists, attributes should exists, attribute_values should exist
// need variant attribute value table

// variant_attribute_values. Without it, a variant is just a row with price and stock, and nothing says what makes it different.
class VariantService {
  // dependency injection: the 4 repositories come from outside
  constructor(
    variantRepository,
    attributeRepository,
    productRepository,
  ) {
    this.variantRepository = variantRepository;
    this.attributeRepository = attributeRepository;

    this.productRepository = productRepository;
  }

  #formatVariants(data) {
    const products = new Map();

    for (const row of data) {

      // Create product if it doesn't exist
      if (!products.has(row.product_id)) {
        products.set(row.product_id, {
          id: row.product_id,
          description: row.description,
          image_url: row.image_url,
          variants: []
        });
      }

      const product = products.get(row.product_id);

      // Check if variant already exists
      let variant = product.variants.find(
        v => v.id === row.variant_id
      );

      // Create variant if it doesn't exist
      if (!variant) {
        variant = {
          id: row.variant_id,
          quantity: row.quantity,
          price: row.price,
          attributes: []
        };

        product.variants.push(variant);
      }

      // Add attribute to the variant
      variant.attributes.push({
        name: row.name,
        value: row.value
      });
    }

    return Array.from(products.values());
  }

  // -------- get all variants ------

  async findAll(query) {
    const { page, limit, offset } = getPagination(query);
    const { product_id, search, searchColumn } = query;

    const { data, total } = await this.variantRepository.findAll({
      limit,
      offset,
      search,
      searchColumn,
      isDeleted: false,
      product_id
    });

    const formattedData = this.#formatVariants(data);

    return {
      data: formattedData,
      meta: buildMeta({ page, limit, total })
    };
  }

  // ---------- private helpers ----------
  async #ensureProductExists(productId) {
    const product = await this.productRepository.findById(productId);
    if (!product) throw new NotFoundError("product not found");
  }

  // product table has category id
  // category_attributes -- attribute_id


  // ---------- create (variant + its attribute links in ONE transaction) ----------
  // ----- product variant
  // Is the attribute allowed for this product's category? 
  // Did the user send every attribute that the category requires?
  // Is the attribute currently active in the database?
  // Does this exact combination already exist for this product?


  //========= Find which attributes are allowed for the product -- productId, attributes


  async create(data) {
    return withTransaction(async (client) => {
      await this.#ensureProductExists(data.product_id);

      const variant = await this.variantRepository.create(data, client);
      const attributes = await this.attributeRepository.bulkCreateAttributes(variant.id, data.attributes, client);


      return [variant, attributes];
    }
    )
  }

  // ---------- reads ----------
  async getByProduct(productId) {
    await this.#ensureProductExists(productId);
    return this.variantRepository.findByProductId(productId);
  }
  async getById(id) {
    const rows = await this.variantRepository.findById(id);

    if (!rows.length) {
      throw new NotFoundError("variant not found");
    }

    return {
      id: rows[0].id,
      product_id: rows[0].product_id,
      quantity: rows[0].quantity,
      price: rows[0].price,

      attributes: rows.map(row => ({
        id: row.attribute_id,
        name: row.attribute_name,
        value: row.attribute_value
      }))
    };
  }

  // ---------- update (PATCH) ----------
  async update(id, data) {
    const variant = await this.variantRepository.patch(id, data);
    if (!variant) throw new NotFoundError("variant not found");
    return variant;
  }

  // ---------- remove (links first, then the variant, in ONE transaction) ----------
  async remove(id) {
    const deleted = await this.variantRepository.delete(id);
    if (!deleted) throw new NotFoundError("variant not found"); // triggers ROLLBACK
    return deleted;
  }
}

// ---------- create instances ----------
const variantRepository = new VariantRepository();
const attributeRepository = new AttributeRepository()
const productRepository = new ProductRepository();

export const variantService = new VariantService(
  variantRepository,
  attributeRepository,
  productRepository,
);
