// ======== CategoryService ===========
// --- service needs to know the repository --- Dependancy injection, instance, class
// --- service has to create the instance for repository to use it

// object references vs object copies -- remember

import { NotFoundError } from "../helperFunctions/apiError.js";
import { CategoryRepository } from "./category.repository.js";

class CategoryService {
  constructor(repository) {
    this.categoryRepository = repository;
  }

  async findAll(query = {}) {
    //  read page and limit, fall back to defaults if missing/invalid
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    // limit is kept between 1 and 100
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);

    //  how many rows to skip
    const offset = (page - 1) * limit;

    // findAll() is inherited from BaseRepository.
    // this.repository refers to the CategoryRepository instance,
    // which extends BaseRepository.
    // Therefore, the instance can access the inherited findAll() method.
    const { data, total } = await this.categoryRepository.findAll({ limit, offset });

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
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundError("category not found");
    }

    return category;
  }

  async create(data) {
    if (data.parent_id !== null) {
      const parent = await this.categoryRepository.findById(data.parent_id);

      if (!parent) {
        throw new NotFoundError("parent category not found");
      }
    }
    return this.categoryRepository.create(data);
  }

  async updateCategories(id, data) {
    const updated = await this.categoryRepository.patch(id, data);

    if (!updated) {
      throw new NotFoundError("Category not found");
    }

    return updated;
  }

  async delete(id) {
    const deleted = await this.categoryRepository.delete(id);

    if (!deleted) {
      throw new NotFoundError("category not found");
    }

    return deleted;
  }

  // ========== top level categories
  async findTopLevelCategories() {
    // empty list is a valid answer (no categories yet), so no 404 here
    return this.categoryRepository.getTopLevelCategories();
  }

  // ======== breadcrumb: category + all its ancestors
  async findAncestorsById(id) {
    const ancestors = await this.categoryRepository.getAllAncestors(id);

    // result always includes the category itself, so empty = id doesn't exist
    if (ancestors.length === 0) {
      throw new NotFoundError("category not found");
    }

    return ancestors;
  }

  // ======== category + all its descendants
  async findDescendantsById(id) {
    const descendants = await this.categoryRepository.getAllDescendants(id);

    // same reason: parent is included, so empty = id doesn't exist
    if (descendants.length === 0) {
      throw new NotFoundError("category not found");
    }

    return descendants;
  }

  // ======== direct children of a parent
  async findDirectChildren(parentId) {
    // a leaf category has no children (valid), so check the parent itself first
    await this.findById(parentId); // throws 404 if parent doesn't exist

    return this.categoryRepository.getDirectChildren(parentId);
  }

  // ======== full tree (nested) for mega menu
  async findCategoryTree() {
    // rows come ordered by path, so parents always come before children
    const rows = await this.categoryRepository.getAllCategoriesdByPath();

    // step 1: put every row in a map by id, with an empty children list
    const map = new Map();
    rows.forEach((row) => map.set(row.id, { ...row, children: [] }));

    // step 2: attach each row to its parent (or to roots if no parent)
    const roots = [];
    map.forEach((node) => {
      if (node.parent_id === null) {
        roots.push(node);
      } else {
        map.get(node.parent_id).children.push(node);
      }
    });

    return roots;
  }


}

// instance for repository ---
const categoryRepository = new CategoryRepository();

// the repository instance is given to the service. ----- dependency injection.
export const categoryService = new CategoryService(categoryRepository);
