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

  async create(data) {
    return this.productRepository.create(data);
  }

  // ===== paginated list (+ optional category filter) =====
  async findAll(query = {}) {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
    const offset = (page - 1) * limit;
    const searchColumn = "name";

    const { data, total } = await this.productRepository.findAll({
      limit,
      offset,
      search: query.search ?? null,
      searchColumn,
    });

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id) {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundError("product not found");
    }

    return product;
  }

  async update(id, data) {
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
