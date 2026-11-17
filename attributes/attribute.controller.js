import { attributeService } from "./attribute.service.js";

class AttributeController {
    constructor(service) {
        this.service = service;
        // routes call these without `this`, so bind them
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
            res.status(200).json(result); // { data, meta }
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
            const data = await this.service.updateAttribute(req.params.id, req.body);
            res.status(200).json({ data });
        } catch (err) { next(err); }
    }

    async delete(req, res, next) {
        try {
            await this.service.deleteAttribute(req.params.id);
            res.status(204).send();
        } catch (err) { next(err); }
    }
}

export const attributeController = new AttributeController(attributeService);