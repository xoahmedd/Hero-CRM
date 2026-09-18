using Application.Common;
using Application.DTOs.Customer;
using Application.Repos_Interfaces;
using AutoMapper;
using Domain.Entities.Customers;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hero_CRM.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class CustomersController : ControllerBase
    {
        private readonly IGenericRepository<Customer> _customerRepo;
        private readonly IMapper _mapper;

        public CustomersController(IGenericRepository<Customer> customerRepo, IMapper mapper)
        {
            _customerRepo = customerRepo;
            _mapper = mapper;
        }

        // GET: api/Customers
        [HttpGet]
        public async Task<IActionResult> GetCustomers(
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null,
            [FromQuery] string? search = null,
            [FromQuery] CustomerStatus? status = null)
        {
            if (pageIndex.HasValue || pageSize.HasValue || !string.IsNullOrWhiteSpace(search) || status.HasValue)
            {
                var s = search?.Trim();

                var pagedCustomers = await _customerRepo.GetPagedAsync(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    predicate: c =>
                        (string.IsNullOrWhiteSpace(s) || (
                            c.Name.Contains(s) ||
                            (c.Email != null && c.Email.Contains(s)) ||
                            (c.Company != null && c.Company.Contains(s)) ||
                            (c.Phone != null && c.Phone.Contains(s))
                        )) &&
                        (!status.HasValue || c.Status == status.Value),
                    orderBy: q => q.OrderByDescending(c => c.CreatedAt));

                var data = _mapper.Map<IEnumerable<CustomerResponse>>(pagedCustomers.Data);
                return Ok(new Pagination<CustomerResponse>(
                    pagedCustomers.PageIndex,
                    pagedCustomers.PageSize,
                    pagedCustomers.Count,
                    data));
            }

            var customers = await _customerRepo.GetQueryable()
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(_mapper.Map<IEnumerable<CustomerResponse>>(customers));
        }

        // GET: api/Customers/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<CustomerResponse>> GetCustomer(int id)
        {
            var customer = await _customerRepo.GetByIdAsync(id);

            if (customer == null)
            {
                return NotFound(new
                {
                    message = "Customer not found."
                });
            }

            var response = _mapper.Map<CustomerResponse>(customer);
            return Ok(response);
        }


        // POST: api/Customers
        [HttpPost]
        public async Task<ActionResult<CustomerResponse>> CreateCustomer(CreateCustomerRequest request)
        {
            var customer = _mapper.Map<Customer>(request);

            await _customerRepo.AddAsync(customer);
            await _customerRepo.SaveChangesAsync();

            var response = _mapper.Map<CustomerResponse>(customer);

            return CreatedAtAction(
                nameof(GetCustomer),
                new { id = customer.Id },
                response);
        }

        // PUT: api/Customers/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateCustomer(int id, UpdateCustomerRequest request)
        {
            var customer = await _customerRepo.GetByIdAsync(id);

            if (customer == null)
            {
                return NotFound(new
                {
                    message = "Customer not found."
                });
            }

            _mapper.Map(request, customer);

            _customerRepo.Update(customer);
            await _customerRepo.SaveChangesAsync();

            return Ok(new
            {
                message = "Customer updated successfully."
            });
        }

        // DELETE: api/Customers/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteCustomer(int id)
        {
            var customer = await _customerRepo.GetByIdAsync(id);

            if (customer == null)
            {
                return NotFound(new
                {
                    message = "Customer not found."
                });
            }

            _customerRepo.Delete(customer);
            await _customerRepo.SaveChangesAsync();

            return Ok(new
            {
                message = "Customer deleted successfully."
            });
        }
    }
}
