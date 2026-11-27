// ========= productController ============
// read the data from req
// call the service
// sends the res

import { productService } from "./product.service.js";
import { successReponse } from "../../helperFunctions/apiResponse.js";
import { removeResponseFields } from "../../helperFunctions/helperFunctions.js";

class ProductController {
  constructor(service) {
    this.service = service

    // routes lose `this` -> bind each method to ITSELF
    this.create = this.create.bind(this)
    this.getAll = this.getAll.bind(this)
    this.getById = this.getById.bind(this)
    this.update = this.update.bind(this)
    this.delete = this.delete.bind(this)
  }

  // POST /products
  async create(req, res, next) {
    try {
      const product = await this.service.create(req.body)

      return successReponse(
        res,
        removeResponseFields(product),
        201,
        "product created successfully"
      )
    } catch (error) {
      next(error)
    }
  }

  // GET /products?page=1&limit=10&search=abc
  async getAll(req, res) {
    // result = { data, meta }
    const result = await this.service.findAll(req.query)

    return successReponse(
      res,
      removeResponseFields(result.data),
      200,
      "products fetched successfully",
      result.meta // pagination info (page, limit, total, totalPages)
    )
  }

  // GET /products/:id
  async getById(req, res) {
    const product = await this.service.findById(req.params.id)

    return successReponse(
      res,
      removeResponseFields(product),
      200,
      "product fetched successfully"
    )
  }

  // PATCH /products/:id
  async update(req, res) {
    const product = await this.service.update(req.params.id, req.body)

    return successReponse(
      res,
      removeResponseFields(product),
      200,
      "product updated successfully"
    )
  }

  // DELETE /products/:id
  async delete(req, res) {
    await this.service.delete(req.params.id)

    // nothing to return, so data is null
    return successReponse(res, null,
      200, "product deleted successfully")
  }
}

export const productController = new ProductController(productService)