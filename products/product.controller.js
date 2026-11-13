// ========= productController ============
// read the data from req
// call the service
// sends the res

import { productService } from "./product.service.js";


class ProductController {
  constructor(service) {
    this.service = service

    // routes lose `this` -> bind each method to ITSELF (name on the left = name on the right)
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

      return res.status(201).json({
        message: "product created successfully",
        data: product
      })
    } catch (error) {
      next(error)
    }
  }

  // GET /products?page=1&limit=10&category_id=3
  async getAll(req, res, next) {
    try {
      // result = { data, meta }
      const result = await this.service.findAll(req.query)

      return res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }

  // GET /products/:id
  async getById(req, res, next) {
    try {
      const product = await this.service.findById(req.params.id)

      return res.status(200).json({ data: product })
    } catch (error) {
      next(error)
    }
  }

  // PATCH /products/:id
  async update(req, res, next) {
    try {
      const product = await this.service.update(req.params.id, req.body)

      return res.status(200).json({
        message: "product updated successfully",
        data: product
      })
    } catch (error) {
      next(error)
    }
  }

  // DELETE /products/:id
  async delete(req, res, next) {
    try {
      const isDeleted = await this.service.delete(req.params.id)

      // 200 
      return res.status(200).json({ isDeleted })
    } catch (error) {
      next(error)
    }
  }
}

export const productController = new ProductController(productService)