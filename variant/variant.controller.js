import { variantService } from "./variant.service.js";
import { successReponse } from "../helperFunctions/apiResponse.js";
import { removeResponseFields } from "../helperFunctions/helperFunctions.js";

class VariantController {
    constructor(service) {
        this.service = service;
        this.getAll = this.getAll.bind(this)
        this.create = this.create.bind(this);
        this.getByProduct = this.getByProduct.bind(this);
        this.getById = this.getById.bind(this);
        this.update = this.update.bind(this);
        this.remove = this.remove.bind(this);
    }

    // GET /variants?page=1&limit=10
    async getAll(req, res) {
        // result = { data, meta }
        const result = await this.service.findAll(req.query)

        return successReponse(
            res,
            removeResponseFields(result.data),
            200,
            "variants fetched successfully",
            result.meta // pagination info
        )
    }

    // POST /variants
    async create(req, res) {
        const data = await this.service.create(req.body);

        console.log("----- variant atrr", data);

        return successReponse(
            res,
            removeResponseFields(data),
            201,
            "variant created successfully"
        )
    }

    // GET /variants/by-product?product_id=...
    async getByProduct(req, res) {
        const data = await this.service.getByProduct(req.query.product_id);

        return successReponse(
            res,
            removeResponseFields(data),
            200,
            "variants fetched successfully"
        )
    }

    // GET /variants/:id
    async getById(req, res) {
        const data = await this.service.getById(req.params.id);

        return successReponse(
            res,
            removeResponseFields(data),
            200,
            "variant fetched successfully"
        )
    }

    // PATCH /variants/:id
    async update(req, res) {
        const data = await this.service.update(req.params.id, req.body);

        return successReponse(
            res,
            removeResponseFields(data),
            200,
            "variant updated successfully"
        )
    }

    // DELETE /variants/:id
    async remove(req, res) {
        await this.service.remove(req.params.id);

        // 200 with a message instead of 204, because 204 cannot have a body
        return successReponse(res, null, 200, "variant deleted successfully")
    }
}

export const variantController = new VariantController(variantService);