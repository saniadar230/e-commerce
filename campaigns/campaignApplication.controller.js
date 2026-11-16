import { campaignApplicationService } from "./campaignApplication.service.js";

class CampaignApplicationController {
    constructor(service) {
        this.service = service;
        this.create = this.create.bind(this);
        this.getByCampaign = this.getByCampaign.bind(this);
        this.remove = this.remove.bind(this);
    }

    async create(req, res, next) {
        try {
            const data = await this.service.create(req.params.id, req.body);
            res.status(201).json({ data });
        } catch (err) { next(err); }
    }

    async getByCampaign(req, res, next) {
        try {
            const data = await this.service.getByCampaign(req.params.id);
            res.status(200).json({ data });
        } catch (err) { next(err); }
    }

    async remove(req, res, next) {
        try {
            await this.service.remove(req.params.id, req.params.applicationId);
            res.status(204).send();
        } catch (err) { next(err); }
    }
}

export const campaignApplicationController = new CampaignApplicationController(campaignApplicationService);