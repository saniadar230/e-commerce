// order.service.js
import withTransaction from "../../helperFunctions/withTransaction.js";
import stripe from "../../config/stripe.js";
import {
  removeResponseFields,
} from "../../helperFunctions/helperFunctions.js";
import { getPagination, buildMeta } from "../../common/pagination.js";
import CartRepository from "../cart/cart.repository.js";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from "../../helperFunctions/apiError.js";

// All money values (prices, discounts, totals) are integer cents.
// node-pg returns bigint/numeric columns as strings, so convert with Number().
export class OrderService {
  constructor(orderRepository, cartRepository) {
    this.orderRepository = orderRepository;
    this.cartRepository = cartRepository;
  }

  // ---------- helpers ----------
  #assertPageInRange(pageNo, pageSize, totalRecords) {
    const totalPages = Math.ceil(totalRecords / pageSize);
    // totalPages === 0 means no orders: return an empty page, not an error
    if (totalPages > 0 && pageNo > totalPages) {
      throw new ValidationError(
        `Page number cannot be greater than total number of pages: ${totalPages}`
      );
    }
  }

  // ---------- LIST ----------
  async getAllOrders(pageNo, pageSize, sortBy, customer_id) {
    const totalRecords = await this.orderRepository.countAll();
    this.#assertPageInRange(pageNo, pageSize, totalRecords);

    const { limit, offset } = getPagination(pageNo, pageSize);
    const orders = await this.orderRepository.findAll(sortBy, limit, offset, customer_id);

    return {
      pagination: buildMeta({ page: pageNo, limit: pageSize, total: totalRecords }),
      data: removeResponseFields(orders),
    };
  }

  async getCustomerOrders(customerId, pageNo, pageSize, sortBy) {
    const totalRecords = await this.orderRepository.countByCustomer(customerId);
    this.#assertPageInRange(pageNo, pageSize, totalRecords);

    const { limit, offset } = getPagination(pageNo, pageSize);
    const orders = await this.orderRepository.findByCustomer(
      customerId,
      sortBy,
      limit,
      offset
    );

    return {
      pagination: buildMeta(pageNo, pageSize, totalRecords),
      data: removeResponseFields(orders),
    };
  }

  // ---------- SINGLE ORDER ----------
  async getOrderById(orderId, customerId = null) {
    const order = await this.orderRepository.findById(orderId, customerId);
    if (!order) throw new NotFoundError("Order not found");

    const [items, payments] = await Promise.all([
      this.orderRepository.findItems(orderId),
    ]);

    const [cleanOrder] = removeResponseFields([order]);
    return { ...cleanOrder, items };
  }

  // ---------- CREATE ORDER ----------
  #priceCartLines(rows) {
    console.log(rows)
    let totalCents = 0;

    const items = rows.map((row) => {
      if (row.variant_stock < row.cart_product_quantity) {
        throw new ConflictError(`Insufficient stock for ${row.name}`);
      }

      const unitPrice = Number(row.variantprice);
      totalCents += unitPrice * row.cart_product_quantity;

      return {
        variant_id: row.variant_id,
        product_name: row.productname,
        quantity: row.cart_product_quantity,
        unit_price: row.variantprice,
      };
    });

    return { items, totalCents };
  }

  // before creating order -- customer should exist
  async createOrder(customerId, status, customerName, customerEmail, customerPhoneNum, delivery_address, paymentType) {
    const repo = this.orderRepository;

    return withTransaction(async (client) => {
      // 1. Customer, region and cart checks
      if (!(await repo.lockCustomer(client, customerId)))
        throw new NotFoundError("Customer not found");

      // Lock the cart once so nobody else can check it out twice
      const cart = await repo.lockActiveCart(client, customerId);
      if (!cart) throw new NotFoundError("Cart not found");


      const cartProducts = await this.cartRepository.findCartProductsWithoutPagination(client, cart.id);
      if (cartProducts.length === 0) throw new NotFoundError("No products were found in the cart")

      // 3. Validate stock and compute prices
      const { items, totalCents } = this.#priceCartLines(cartProducts);
      if (totalCents <= 0)
        throw new ConflictError("Order total must be greater than zero");

      // 4. Order + payment + items (prices snapshotted)
      const order = await repo.insertOrder(
        client, customerId, "unpaid", totalCents, customerName, customerEmail, customerPhoneNum, delivery_address, paymentType
      );
      await repo.insertItems(client, order.id, items);

      // 5. Decrement stock (WHERE guard is a safety net on top of row locks)
      for (const item of items) {
        const updated = await repo.decrementStock(
          client,
          item.variant_id,
          item.quantity
        );
        if (updated === 0)
          throw new ConflictError(`Insufficient stock for ${item.name}`);
      }

      // 6. Close the cart so it can't be checked out again
      await repo.markCartConverted(client, cart.id);

      return {
        order_id: order.id,
        payment_type: order.paymentType,
        status: order.status,
        created_at: order.created_at,
        total_amount: totalCents,
        items,
      };
    });
  }
}


