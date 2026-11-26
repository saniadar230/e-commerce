import { successReponse } from "../helperFunctions/apiResponse.js";
import { removeResponseFields } from "../helperFunctions/helperFunctions.js";
import CustomerService from "./customer.service.js";

class CustomerController {
  constructor(customerService = new CustomerService()) {
    this.customerService = customerService;
  }

  // arrow functions keep `this` when the router passes them as callbacks
  getAllCustomers = async (req, res) => {
    const { data, meta } = await this.customerService.getAllCustomers(req.query);

    return successReponse(
      res,
      removeResponseFields(data),
      200,
      "Customers were retrieved successfully!",
      meta
    );
  };

  getCustomerById = async (req, res) => {
    const customer = await this.customerService.getCustomerById(req.params.id);

    return successReponse(
      res,
      removeResponseFields([customer])[0],
      200,
      "Customer was retrieved successfully!"
    );
  };

  createCustomer = async (req, res) => {
    const { name, email, delivery_address } = req.body;

    const customer = await this.customerService.createCustomer({
      name,
      email,
      delivery_address,
    });

    return successReponse(
      res,
      removeResponseFields([customer])[0],
      201,
      "Customer was created successfully!"
    );
  };

  updateCustomer = async (req, res) => {
    const { name, delivery_address } = req.body;

    // only fields that were sent
    const updateData = {};
    if (name) updateData.name = name;
    if (delivery_address) updateData.delivery_address = delivery_address;

    const customer = await this.customerService.updateCustomer(
      req.params.id,
      updateData
    );

    return successReponse(
      res,
      removeResponseFields([customer])[0],
      200,
      "Customer was updated successfully!"
    );
  };

  deleteCustomer = async (req, res) => {
    await this.customerService.deleteCustomer(req.params.id);

    return successReponse(res, {}, 204, "Customer was deleted successfully!");
  };
}

export default new CustomerController();