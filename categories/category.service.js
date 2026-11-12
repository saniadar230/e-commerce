// ======== CategoryService ===========
// --- service needs to know the repository --- Dependancy injection, instance, class
// --- service has to create the instance for repository to use it 

// object references vs object copies -- remember


import { NotFoundError } from "../apiError.js";
import { CategoryRepository } from "./category.repository.js";


class CategoryService {
    constructor(repository) {
        this.repository = repository;
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
        const { data, total } = await this.repository.findAll({ limit, offset })

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
        const category = await this.repository.findById(id)

        if (!category) {
            throw new NotFoundError("category not found")
        }

        return category;
    }

    async create(data) {
        if (data.parent_id !== null) {
            const parent = await this.repository.findById(data.parent_id)

            if (!parent) {
                throw new NotFoundError("parent category not found")
            }
        }
        return this.repository.create(data)
    }

    async delete(id) {
        const deleted = await this.repository.delete(id)

        if (!deleted) {
            throw new NotFoundError("category not found")
        }

        return deleted;
    }

}


// instance for repository --- 
const categoryRepository = new CategoryRepository();

// the repository instance is given to the service. ----- dependency injection.
export const categoryService = new CategoryService(categoryRepository);