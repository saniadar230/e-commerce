import { attributeValueService } from "./attributeValue.service.js";

class AttributeValueController {
    constructor(service) {
        this.service = service;
        this.create = this.create.bind(this);
        this.getAll = this.getAll.bind(this);
        this.getById = this.getById.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
    }

    async create(req, res, next) {
        try {
            const data = await this.service.create(req.body);
            res.status(201).json({ data });
        } catch (err) { next(err); }
    }

    async getAll(req, res, next) {
        try {
            const result = await this.service.getAll(req.query);
            res.status(200).json(result);
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

    async delete(req, res, next) {
        try {
            await this.service.delete(req.params.id);
            res.status(204).send();
        } catch (err) { next(err); }
    }
}

export const attributeValueController = new AttributeValueController(attributeValueService);