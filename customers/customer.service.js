import { NotFoundError, ConflictError, ValidationError } from "../helperFunctions/apiError.js";
import { getPagination, buildMeta } from "../common/pagination.js"; // adjust path
import CustomerRepository from "./customer.repository.js";

class CustomerService {
  constructor(customerRepository = new CustomerRepository()) {
    this.customerRepository = customerRepository;
  }

  async getAllCustomers(query) {
    // page / limit / offset math lives in one place
    const { page, limit, offset } = getPagination(query);
    const { search = "", sortBy = "asc" } = query;

    const { data, total } = await this.customerRepository.findAll({
      limit,
      offset,
      search,
      sortBy,
    });

    const meta = buildMeta({ page, limit, total });

    // an empty result on page 1 is fine; only reject pages past the end
    if (total > 0 && page > meta.totalPages)
      throw new ValidationError(
        `Page number cannot be greater than total number of pages: ${meta.totalPages}`
      );

    return { data, meta };
  }

  async getCustomerById(id) {
    const customer = await this.customerRepository.findById(id);
    if (!customer)
      throw new NotFoundError(`Customer with Id:${id} does not exist`);
    return customer;
  }

  async createCustomer(customerData) {
    const existing = await this.customerRepository.findByEmail(customerData.email);
    if (existing)
      throw new ConflictError("Customer with this email already exists");

    return this.customerRepository.create(customerData);
  }

  async updateCustomer(id, updateData) {
    const customer = await this.customerRepository.patch(id, updateData);
    if (!customer)
      throw new NotFoundError(`Customer with Id:${id} does not exist`);
    return customer;
  }

  async deleteCustomer(id) {
    const customer = await this.customerRepository.delete(id);
    if (!customer)
      throw new NotFoundError(`Customer with ID:${id} does not exist`);
  }
}

export default CustomerService;