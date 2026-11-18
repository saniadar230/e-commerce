// ======== ProductService ===========
// product depends on category (products.category_id) -> service needs TWO repositories
// both are injected through the constructor (dependency injection)

import { NotFoundError, ConflictError } from "../helperFunctions/apiError.js";
import { ProductRepository } from "./product.repository.js";
import { CategoryRepository } from "../categories/category.repository.js";

class ProductService {
  constructor(repository, categoryRepository) {
    this.productRepository = repository;
    this.categoryRepository = categoryRepository;
  }

  // ===== relationship check (used by create, update and list) =====
  // product can only belong to a category that exists
  async #ensureCategoryExists(categoryId) {
    const category = await this.categoryRepository.findById(categoryId);

    if (!category) {
      throw new NotFoundError("category not found");
    }
  }

  async create(data) {
    // 1. category must exist
    await this.#ensureCategoryExists(data.category_id);
    // 2. then create the product
    return this.productRepository.create(data);
  }

  // ===== paginated list (+ optional category filter) =====
  async findAll(query = {}) {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
    const offset = (page - 1) * limit;

    // a filter on a category that doesn't exist should be a 404, not an empty list
    if (query.category_id) {
      await this.#ensureCategoryExists(query.category_id);
    }

    const { data, total } = await this.productRepository.findAll({
      limit, offset,
      categoryId: query.category_id ?? null,
      search: query.search ?? null,
    });

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
  async findById(id) {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundError("product not found");
    }

    return product;
  }

  async update(id, data) {
    // moving the product to another category -> that category must exist
    if (data.category_id !== undefined) {
      await this.#ensureCategoryExists(data.category_id);
    }

    const updated = await this.productRepository.patch(id, data);

    if (!updated) {
      throw new NotFoundError("product not found");
    }

    return updated;
  }

  async delete(id) {
    try {
      const deleted = await this.productRepository.delete(id);
      if (!deleted) throw new NotFoundError("product not found");
      return deleted;
    } catch (error) {
      // 23503 = foreign key violation (variants still point to this product)
      if (error.code === "23503") {
        throw new ConflictError("product has variants, delete them first");
      }
      throw error;
    }
  }
}

// instances: both repositories are given to the service ----- dependency injection
const productRepository = new ProductRepository();
const categoryRepository = new CategoryRepository();

export const productService = new ProductService(
  productRepository,
  categoryRepository
);
