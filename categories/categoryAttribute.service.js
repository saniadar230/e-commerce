import { AttributeRepository } from "../attributes/attribute.repository.js"
import { CategoryRepository } from "./category.repository.js"
import { CategoryAttributeRepository } from "./categoryAttribute.repository.js"
import { NotFoundError } from "../apiError.js";


class CategoryAttributeService {
    constructor(categoryInstance, attributeInstance, categoryAttributeInstance) {
        this.categoryRepository = categoryInstance;
        this.attributeRepository = attributeInstance;
        this.categoryAttributeRepository = categoryAttributeInstance
    }

    async #ensureCategoryExists(categoryId) {
        const category = await this.categoryRepository.findById(categoryId)
        if (!category) throw new NotFoundError("category not found");
    }

    async #ensureAttributeExists(attributeId) {
        const attribute = await this.attributeRepository.findById(attributeId)
        if (!attribute) {
            throw new NotFoundError("attribute nott found")
        }
    }

    async create(categoryId, data) {
        await this.#ensureCategoryExists(categoryId);
        await this.#ensureAttributeExists(data.attribute_id);

        return this.categoryAttributeRepository.create({ category_id: categoryId, ...data });
    }

    // The fix is to check the category first, then return the list
    async getByCategory(categoryId) {
        await this.#ensureCategoryExists(categoryId);
        return this.categoryAttributeRepository.findByCategoryId(categoryId);
    }

    // // ======= findByCategoryId returns an array, and an array is always truthy, even when empty. So the 404 can never fire.
    // async getByCategory(categoryId) {
    //     const category = await this.categoryAttributeRepository.findByCategoryId(categoryId)
    //     if (!category) {
    //         throw new NotFoundError("category not found")
    //     }
    // }

    async removeCategoryAttribute(categoryId, attributeId) {
        const isDeleted = await this.categoryAttributeRepository.deleteCategoryAttribute(categoryId, attributeId)

        if (!isDeleted) {
            throw new NotFoundError("categoryAttribute not found")
        }
    }
}

// instances are created

const categoryRepository = new CategoryRepository()
const attributeRepository = new AttributeRepository()
const categoryAttributeRepository = new CategoryAttributeRepository()

// service instance -------- parameters match the arguments by position:
// They are the actual values (your three repository objects) being passed into the constructor.
export const categoryAttributeServiceIns = new CategoryAttributeService(categoryRepository, attributeRepository, categoryAttributeRepository)