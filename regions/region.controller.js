import { regionServiceInstance } from "./region.service.js"


class RegionController {
    constructor(service) {
        this.regionController = service

        this.create = this.create.bind(this)
        this.getAll = this.getAll.bind(this)
        this.getById = this.getById.bind(this)
        this.update = this.update.bind(this)
        this.remove = this.remove.bind(this)
    }

    async create(req, res, next) {
        try {
            const region = await this.regionController.create(req.body)
            res.status(201).json({ data: region })
        } catch (error) {
            next(error)
        }
    }

    async getAll(req, res, next) {
        try {
            const result = await this.regionController.getAll(req.query);
            res.status(200).json(result);
        } catch (error) { next(error); }
    }

    async getById(req, res, next) {
        try {
            const data = await this.regionController.getById(req.params.id);
            res.status(200).json({ data });
        } catch (error) { next(error); }
    }

    async update(req, res, next) {
        try {
            const data = await this.regionController.update(req.params.id, req.body);
            res.status(200).json({ data });
        } catch (error) { next(error); }
    }

    async remove(req, res, next) {
        try {
            await this.regionController.remove(req.params.id);
            res.status(204).send();
        } catch (error) { next(error); }
    }
}


export const regionController = new RegionController(regionServiceInstance)
