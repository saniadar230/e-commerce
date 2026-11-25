// home.controller.js
import * as homeService from "./home.service.js";
import { successReponse } from "../helperFunctions/apiResponse.js";

export async function getHome(req, res) {
  const { region_id } = req.query;
  const result = await homeService.getHome(region_id);
  return successReponse(
    res,
    result,
    200,
    "Home products were retrieved successfully"
  );
}
