// ========= categoryController ============
// read the data from req
// call the service
// sends the res


import { categoryService } from "./category.service.js";


class CategoryController {
    // CategoryController needs to recieve the service via its controller
    constructor(service) { // parameter 
        this.service = service


        // IMPORTANT: routes pass controller.create without the object (router.post("/", controller.create))
        // so `this` would be lost -- bind keeps `this` pointing to the controller
        this.create = this.create.bind(this)
        this.getAll = this.getAll.bind(this)
        this.getById = this.getById.bind(this)
        this.delete = this.delete.bind(this)
    }

    async getAll(req, res, next) {
        try {
            const result = await this.service.findAll(req.query)

            return res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    }

    async getById(req, res, next) {
        try {
            const category = await this.service.findById(req.params.id)

            return res.status(200).json({ data: category })

        } catch (error) {
            next(error)
        }
    }
    async create(req, res, next) {
        // call the service.create
        try {
            const category = await this.service.create(req.body)

            return res.status(201).json({
                message: "category created successfully",
                data: category
            })
        } catch (error) {
            next(error)
        }

    }

    async delete(req, res, next) {
        try {
            const deleted = await this.service.delete(req.params.id)

            return res.status(200).json({ deleted })

        } catch (error) {
            next(error)
        }
    }
}

export const categoryController = new CategoryController(categoryService) // value of service parameter 