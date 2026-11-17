import { promotionService } from "./promotion.service.js";

class PromotionController {
    constructor(service) {
        this.promotionService = service;
        this.create = this.create.bind(this);
        this.getAll = this.getAll.bind(this);
        this.getById = this.getById.bind(this);
        this.update = this.update.bind(this);
        this.remove = this.remove.bind(this);
    }

    async create(req, res, next) {
        try {
            const data = await this.promotionService.create(req.body);
            res.status(201).json({ data });
        } catch (err) { next(err); }
    }

    async getAll(req, res, next) {
        try {
            const result = await this.promotionService.getAll(req.query);
            res.status(200).json(result);
        } catch (err) { next(err); }
    }

    async getById(req, res, next) {
        try {
            const data = await this.promotionService.getById(req.params.id);
            res.status(200).json({ data });
        } catch (err) { next(err); }
    }

    async update(req, res, next) {
        try {
            const data = await this.promotionService.update(req.params.id, req.body);
            res.status(200).json({ data });
        } catch (err) { next(err); }
    }

    async remove(req, res, next) {
        try {
            await this.promotionService.remove(req.params.id);
            res.status(204).send();
        } catch (err) { next(err); }
    }
}

export const promotionController = new PromotionController(promotionService);