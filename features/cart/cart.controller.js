import { successReponse } from "../../helperFunctions/apiResponse.js";
import { removeResponseFields } from "../../helperFunctions/helperFunctions.js";
import CartService from "./cart.service.js";

class CartController {
  constructor(cartService = new CartService()) {
    this.cartService = cartService;
  }

  // arrow functions keep `this` when the router passes them as callbacks
  getCart = async (req, res) => {
    const { customer_id } = req.body;

    const { data, meta } = await this.cartService.getCart(customer_id, req.query);

    return successReponse(
      res,
      removeResponseFields(data),
      200,
      "Cart was retrieved successfully!",
      meta
    );
  };

  // ----------- cart item creation
  addCartItem = async (req, res) => {
    const { variant_id, customer_id } = req.body;
    const { cart_id, item } = await this.cartService.addCartItem(
      variant_id,
      customer_id
    );

    return successReponse(
      res,
      { cart_id, item: removeResponseFields([item])[0] },
      200,
      "Item was inserted into the bag succesfully!"
    );
  };

  updateCartItem = async (req, res) => {
    const { customer_id, quantity } = req.body;
    const { variantId } = req.params;

    const { cart_id, item } = await this.cartService.updateCartItem(
      variantId,
      customer_id,
      quantity
    );

    return successReponse(
      res,
      {
        cart_id,
        // item is null when it was removed (quantity 0) -> empty array
        item: item ? removeResponseFields([item])[0] : [],
      },
      200,
      "Cart was updated successfully!"
    );
  };

  removeCartItem = async (req, res) => {
    const { customer_id } = req.body;
    const { variantId } = req.params;

    const { cart_id, item } = await this.cartService.removeCartItem(
      variantId,
      customer_id
    );

    return successReponse(
      res,
      { cart_id, item: removeResponseFields([item])[0] },
      204,
      "Item was removed from the cart successfully!"
    );
  };
}

export default new CartController();