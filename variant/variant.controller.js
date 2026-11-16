import { variantService } from "./variant.service.js";

class VariantController {
    constructor(service) {
        this.service = service;
        this.create = this.create.bind(this);
        this.getByProduct = this.getByProduct.bind(this);
        this.getById = this.getById.bind(this);
        this.update = this.update.bind(this);
        this.remove = this.remove.bind(this);
    }

    async create(req, res, next) {
        try {
            const data = await this.service.create(req.body);
            res.status(201).json({ data });
        } catch (err) { next(err); }
    }

    async getByProduct(req, res, next) {
        try {
            const data = await this.service.getByProduct(req.query.product_id);
            res.status(200).json({ data });
        } catch (err) { next(err); }
    }

    async getById(req, res, next) {
        try {
            const data = await this.service.getById(req.params.id);
            res.status(200).json({ data });
        } catch (err) { next(err); }
    }

    async update(req, res, next) {
        try {
            const data = await this.service.update(req.params.id, req.body);
            res.status(200).json({ data });
        } catch (err) { next(err); }
    }

    async remove(req, res, next) {
        try {
            await this.service.remove(req.params.id);
            res.status(204).send();
        } catch (err) { next(err); }
    }
}

export const variantController = new VariantController(variantService);