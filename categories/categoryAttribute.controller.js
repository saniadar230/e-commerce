import { categoryAttributeServiceIns } from "./categoryAttribute.service.js"

class CategoryAttributeController {
    constructor(service) {
        // router call these without this soo we need to bind with this 
        this.service = service
        this.create = this.create.bind(this)
        this.getByCategory = this.getByCategory.bind(this)
        this.remove = this.remove.bind(this)
    }


    async create(req, res, next) {
        try {
            const data = await this.service.create(req.params.id, req.body)
            res.status(201).json({ data })
        } catch (error) {
            next(error)
        }
    }


    async getByCategory(req, res, next) {
        try {
            const data = await this.service.getByCategory(req.params.id)
            res.status(200).json({ data })
        } catch (error) {
            next(error)
        }
    }

    async remove(req, res, next) {
        try {
            const data = await this.service.removeCategoryAttribute(req.params.id, req.params.attributeId)
            res.status(204).send()
        } catch (error) {
            next(error)
        }
    }
}

export const categoryAttributeController = new CategoryAttributeController(categoryAttributeServiceIns)