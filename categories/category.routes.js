import { Router } from "express"

import { validate } from "../middleware/validate.js"
import { categoryController as controller } from '../categories/category.controller.js'
import { createCategorySchema, categoryIdParamSchema, listQuerySchema } from "../categories/category.validator.js"


const router = Router()

// get
router.get("/", validate(listQuerySchema, "query"), controller.getAll)

router.post("/", validate(createCategorySchema), controller.create)

router.get("/:id", validate(categoryIdParamSchema, "params"), controller.getById)

router.delete("/:id", validate(categoryIdParamSchema, "params"), controller.delete)

export default router