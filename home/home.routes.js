// home.routes.js
import express from "express";
import { validate } from "../middleware/validate.js";
import * as homeController from "./home.controller.js";
import { homeQuerySchema } from "./home.schema.js";

const homeRouter = express.Router();
homeRouter.get("/", validate(homeQuerySchema, "query"), homeController.getHome);
export default homeRouter;
