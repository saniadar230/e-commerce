import * as cartService from "./cart.service.js";
import { successReponse } from "../apiResponse.js";

export async function getCart(req, res, next) {
  const { customer_id } = req.body;

  const response = await cartService.getCart(customer_id);

  return successReponse(
    res,
    response.data,
    200,
    "Cart was retrieved successfully!",
    response.pagination
  );
}

export async function addCartItem(req, res, next) {
  const { variant_id, customer_id } = req.body;

  const response = await cartService.addCartItem(variant_id, customer_id);

  return successReponse(
    res,
    response,
    200,
    "Item was inserted into the bag succesfully!"
  );
}

export async function updateCartItem(req, res, next) {
  const { customer_id, quantity } = req.body;
  const { variantId } = req.params;

  const response = await cartService.updateCartItem(
    variantId,
    customer_id,
    quantity
  );

  return successReponse(res, response, 200, "Cart was updated successfully!");
}

export async function removeCartItem(req, res, next) {
  const { customer_id } = req.body;
  const { variantId } = req.params;

  const response = await cartService.removeCartItem(variantId, customer_id);

  return successReponse(
    res,
    response,
    200,
    "Item was removed from the cart successfully!"
  );
}
