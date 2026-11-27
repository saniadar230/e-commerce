import withTransaction from "../../helperFunctions/withTransaction.js";
import { ConflictError, NotFoundError } from "../../helperFunctions/apiError.js";
import CartRepository from "./cart.repository.js";
import { getPagination, buildMeta } from "../../common/pagination.js"; // adjust path


class CartService {
  constructor(cartRepository = new CartRepository()) {
    this.cartRepository = cartRepository;
  }

  // ===== private helpers (shared checks) =====
  async #assertCustomerExists(customerId, options) {
    const customer = await this.cartRepository.findActiveCustomer(customerId, options);
    if (!customer) throw new NotFoundError("Customer not found");
  }

  async #getVariantOrThrow(variantId, options) {
    console.log(variantId, options, '----------------- variant options')
    const variant = await this.cartRepository.findVariant(variantId, options);

    console.log("================ after create repo find varaint")
    if (!variant) throw new NotFoundError("Variant not found");
    return variant;
  }

  async #getActiveCartOrThrow(customerId, options) {
    const cart = await this.cartRepository.findActiveCart(customerId, {
      ...options,
      forUpdate: true,
    });
    if (!cart) throw new NotFoundError("Active cart not found");
    return cart;
  }

  // ===== get cart (paginated) =====
  async getCart(customer_id, query) {
    // page / limit / offset math lives in one place
    const { page, limit, offset } = getPagination(query);

    // 1. Find the active cart
    const cart = await this.cartRepository.findActiveCart(customer_id);

    // no cart yet = empty cart, not an error
    if (!cart) return { data: [], meta: buildMeta({ page, limit, total: 0 }) };

    // 2. Get this page of its products
    const { data, total } = await this.cartRepository.findCartProducts(cart.id, {
      limit,
      offset,
    });

    const meta = buildMeta({ page, limit, total });

    // an empty result on page 1 is fine; only reject pages past the end
    if (total > 0 && page > meta.totalPages)
      throw new ValidationError(
        `Page number cannot be greater than total number of pages: ${meta.totalPages}`
      );

    return { data, meta };
  }

  // ===== add cart item =====
  async addCartItem(variant_id, customer_id) {
    return withTransaction(async (client) => {
      // 1. Customer exists and is not deleted

      await this.#assertCustomerExists(customer_id, { client, forShare: true });
      // 2. Variant exists and is not deleted
      const variant = await this.#getVariantOrThrow(variant_id, { client });
      if (variant.quantity < 1) {
        throw new ConflictError("Variant is out of stock");
      }

      // 3. Find or create the active cart
      const cart = await this.cartRepository.create(customer_id, { client });
      const cart_id = cart.id;

      // 4. Insert the item or increment quantity atomically
      const item = await this.cartRepository.addItem(
        cart_id,
        variant_id,
        variant.quantity,
        { client }
      );

      if (!item) {
        throw new ConflictError(
          "Cart quantity cannot exceed 10 or available inventory"
        );
      }
      await this.cartRepository.touch(cart_id, { client });

      return { cart_id, item };
    });
  }

  // ===== update item =====
  async updateCartItem(variant_id, customer_id, quantity) {
    return withTransaction(async (client) => {
      // 1. Customer exists and is not deleted
      await this.#assertCustomerExists(customer_id, { client });

      // 2. Variant exists and is not deleted
      const variant = await this.#getVariantOrThrow(variant_id, { client });

      if (quantity > variant.quantity) {
        throw new ConflictError("Requested quantity exceeds available inventory");
      }

      // 3. Active cart (locked)
      const cart = await this.#getActiveCartOrThrow(customer_id, { client });
      const cart_id = cart.id;

      // 4a. quantity 0 removes the item, nothing left to return
      if (quantity === 0) {
        const removed = await this.cartRepository.removeItem(cart_id, variant_id, {
          client,
        });
        if (!removed) throw new NotFoundError("Cart item not found");

        await this.cartRepository.touch(cart_id, { client });

        return { cart_id, item: null };
      }

      // 4b. anything else updates the item
      const item = await this.cartRepository.updateItemQuantity(
        cart_id,
        variant_id,
        quantity,
        { client }
      );
      if (!item) throw new NotFoundError("Cart item not found");

      await this.cartRepository.touch(cart_id, { client });

      return { cart_id, item };
    });
  }

  // ===== remove item =====
  async removeCartItem(variant_id, customer_id) {
    // 1. Customer exists and is not deleted
    await this.#assertCustomerExists(customer_id);

    // 2. Variant exists and is not deleted
    await this.#getVariantOrThrow(variant_id);

    // 3. Find the active cart
    const cart = await this.#getActiveCartOrThrow(customer_id);
    const cart_id = cart.id;

    // 4. Delete the variant from the cart
    const item = await this.cartRepository.removeItem(cart_id, variant_id);

    if (!item) throw new NotFoundError("Cart item not found");

    await this.cartRepository.touch(cart_id);

    return { cart_id, item };
  }
}

export default CartService;