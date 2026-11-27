// order.controller.js
import { successReponse } from "../../helperFunctions/apiResponse.js";
import { OrderService } from "./order.service.js";
import { OrderRepository } from "./order.repository.js";
import CartRepository from "../cart/cart.repository.js";


export class OrderController {
  constructor(orderService) {
    this.orderService = orderService;
  }

  // Admin
  getAllOrders = async (req, res) => {
    const { pageNo, pageSize, sortBy, customer_id } = req.query;
    const result = await this.orderService.getAllOrders(pageNo, pageSize, sortBy, customer_id);
    return successReponse(res, result.data, 200, "Orders were retrieved successfully", result.pagination);
  };

  getOrderById = async (req, res) => {
    const result = await this.orderService.getOrderById(req.params.orderId);
    return successReponse(res, result, 200, "Order was retrieved successfully");
  };

  // Customer
  createOrder = async (req, res) => {
    const { customerId, status, customerName, customerEmail, customerPhoneNum, delivery_address, paymentType } = req.body;
    const result = await this.orderService.createOrder(customerId, status, customerName, customerEmail, customerPhoneNum, delivery_address, paymentType);
    return successReponse(res, result, 201, "Order was created successfully");
  };

  getCustomerOrders = async (req, res) => {
    const { customer_id, pageNo, pageSize, sortBy } = req.query;
    const result = await this.orderService.getCustomerOrders(customer_id, pageNo, pageSize, sortBy);
    return successReponse(res, result.data, 200, "Orders were retrieved successfully", result.pagination);
  };

  getCustomerOrderById = async (req, res) => {
    const result = await this.orderService.getOrderById(req.params.orderId, req.query.customer_id);
    return successReponse(res, result, 200, "Order was retrieved successfully");
  };

  cancelOrder = async (req, res) => {
    const result = await this.orderService.cancelOrder(req.params.orderId, req.body.customer_id);
    return successReponse(res, result, 200, "Order was cancelled");
  };
}

export const orderController = new OrderController(
  new OrderService(new OrderRepository(), new CartRepository())
);