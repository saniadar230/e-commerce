import { Router } from "express"

import { validate } from "../middleware/validate.js"
import { categoryController as controller } from '../categories/category.controller.js'
import { createCategorySchema, categoryIdParamSchema, listQuerySchema, updateCategorySchema, linkAttributeSchema, unlinkParamSchema } from "../categories/category.validator.js"
import { categoryAttributeController } from "./categoryAttribute.controller.js"


const router = Router()

// get
router.get("/", validate(listQuerySchema, "query"), controller.getAll)

router.post("/", validate(createCategorySchema), controller.create)


router.get("/top-level", controller.getTopLevel)
router.get("/tree", controller.getTree)



router.get("/:id", validate(categoryIdParamSchema, "params"), controller.getById)

router.patch("/:id", validate(categoryIdParamSchema, "params"), validate(updateCategorySchema), controller.updateCategories)


router.delete("/:id", validate(categoryIdParamSchema, "params"), controller.delete)

// ================== category attributes ==============

router.post("/:id/attributes", validate(categoryIdParamSchema, "params"), validate(linkAttributeSchema), categoryAttributeController.create);
router.get("/:id/attributes", validate(categoryIdParamSchema, "params"), categoryAttributeController.getByCategory);
router.delete("/:id/attributes/:attributeId", validate(unlinkParamSchema, "params"), categoryAttributeController.remove);




router.get("/:id/breadcrumb", validate(categoryIdParamSchema, "params"), controller.getBreadcrumb)
router.get("/:id/descendants", validate(categoryIdParamSchema, "params"), controller.getDescendants)
router.get("/:id/children", validate(categoryIdParamSchema, "params"), controller.getChildren)
export default router