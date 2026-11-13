// ======== ProductService ===========
// product depends on category (products.category_id) -> service needs TWO repositories
// both are injected through the constructor (dependency injection)

import { NotFoundError } from "../apiError.js";
import { ProductRepository } from "./product.repository.js";
import { CategoryRepository } from "../categories/category.repository.js";


class ProductService {
  constructor(productRepository, categoryRepository) {
    this.repository = productRepository;
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
    return this.repository.create(data);
  }

  // ===== paginated list (+ optional category filter) =====
  async findAll(query = {}) {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
    const offset = (page - 1) * limit;

    // category_id is optional -> null means "no filter"
    const categoryId = parseInt(query.category_id, 10) || null;

    // filtering by a category that doesn't exist -> 404 (not an empty list)
    if (categoryId !== null) {
      await this.#ensureCategoryExists(categoryId);
    }

    const { data, total } = await this.repository.findAll({ limit, offset, categoryId });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id) {
    const product = await this.repository.findById(id);

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

    const updated = await this.repository.patch(id, data);

    if (!updated) {
      throw new NotFoundError("product not found");
    }

    return updated;
  }

  async delete(id) {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new NotFoundError("product not found");
    }

    return deleted;
  }
}


// instances: both repositories are given to the service ----- dependency injection
const productRepository = new ProductRepository();
const categoryRepository = new CategoryRepository();

export const productService = new ProductService(productRepository, categoryRepository);