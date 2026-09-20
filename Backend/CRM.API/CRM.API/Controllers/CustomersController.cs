using CRM.API.Data;
using CRM.API.DTOs.Customer;
using CRM.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    [ApiExplorerSettings(IgnoreApi = true)]
    // Legacy compatibility controller. New CRM screens use /api/Organizations.
    public class CustomersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CustomersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET: api/Customers
        // Get all customers
        // =========================================================

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CustomerResponse>>> GetCustomers()
        {
            var customers = await _context.Customers
                .AsNoTracking()
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new CustomerResponse
                {
                    Id = c.Id,
                    Name = c.Name,
                    Email = c.Email,
                    Phone = c.Phone,
                    Company = c.Company,
                    Address = c.Address,
                    Status = c.Status,
                    Notes = c.Notes,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .ToListAsync();

            return Ok(customers);
        }

        // =========================================================
        // GET: api/Customers/5
        // Get customer by ID
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<ActionResult<CustomerResponse>> GetCustomer(int id)
        {
            var customer = await _context.Customers
                .AsNoTracking()
                .Where(c => c.Id == id)
                .Select(c => new CustomerResponse
                {
                    Id = c.Id,
                    Name = c.Name,
                    Email = c.Email,
                    Phone = c.Phone,
                    Company = c.Company,
                    Address = c.Address,
                    Status = c.Status,
                    Notes = c.Notes,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (customer == null)
            {
                return NotFound(new
                {
                    message = "Customer not found."
                });
            }

            return Ok(customer);
        }

        // =========================================================
        // GET: api/Customers/search?search=Ahmed
        // Search customers
        // =========================================================

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<CustomerResponse>>> SearchCustomers(
            [FromQuery] string search)
        {
            if (string.IsNullOrWhiteSpace(search))
            {
                return BadRequest(new
                {
                    message = "Search term is required."
                });
            }

            search = search.Trim();

            var customers = await _context.Customers
                .AsNoTracking()
                .Where(c =>
                    c.Name.Contains(search) ||
                    (c.Email != null && c.Email.Contains(search)) ||
                    (c.Company != null && c.Company.Contains(search)) ||
                    (c.Phone != null && c.Phone.Contains(search)))
                .OrderBy(c => c.Name)
                .Select(c => new CustomerResponse
                {
                    Id = c.Id,
                    Name = c.Name,
                    Email = c.Email,
                    Phone = c.Phone,
                    Company = c.Company,
                    Address = c.Address,
                    Status = c.Status,
                    Notes = c.Notes,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .ToListAsync();

            return Ok(customers);
        }

        // =========================================================
        // POST: api/Customers
        // Create customer
        // =========================================================

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<CustomerResponse>> CreateCustomer(
            CreateCustomerRequest request)
        {
            var customer = new Customer
            {
                Name = request.Name.Trim(),
                Email = request.Email?.Trim().ToLower(),
                Phone = request.Phone?.Trim(),
                Company = request.Company?.Trim(),
                Address = request.Address?.Trim(),
                Status = request.Status.Trim(),
                Notes = request.Notes?.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.Customers.Add(customer);

            await _context.SaveChangesAsync();

            var response = new CustomerResponse
            {
                Id = customer.Id,
                Name = customer.Name,
                Email = customer.Email,
                Phone = customer.Phone,
                Company = customer.Company,
                Address = customer.Address,
                Status = customer.Status,
                Notes = customer.Notes,
                CreatedAt = customer.CreatedAt,
                UpdatedAt = customer.UpdatedAt
            };

            return CreatedAtAction(
                nameof(GetCustomer),
                new { id = customer.Id },
                response);
        }

        // =========================================================
        // PUT: api/Customers/5
        // Update customer
        // =========================================================

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCustomer(
            int id,
            UpdateCustomerRequest request)
        {
            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
            {
                return NotFound(new
                {
                    message = "Customer not found."
                });
            }

            customer.Name = request.Name.Trim();
            customer.Email = request.Email?.Trim().ToLower();
            customer.Phone = request.Phone?.Trim();
            customer.Company = request.Company?.Trim();
            customer.Address = request.Address?.Trim();
            customer.Status = request.Status.Trim();
            customer.Notes = request.Notes?.Trim();
            customer.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Customer updated successfully."
            });
        }

        // =========================================================
        // DELETE: api/Customers/5
        // Delete customer
        // =========================================================

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCustomer(int id)
        {
            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
            {
                return NotFound(new
                {
                    message = "Customer not found."
                });
            }

            _context.Customers.Remove(customer);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Customer deleted successfully."
            });
        }

        // =========================================================
        // GET: api/Customers/paged
        // Pagination + Search + Status Filter
        // =========================================================

        [HttpGet("paged")]
        public async Task<IActionResult> GetCustomersPaged(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? search = null,
            [FromQuery] string? status = null)
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _context.Customers
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim();

                query = query.Where(c =>
                    c.Name.Contains(search) ||
                    (c.Email != null && c.Email.Contains(search)) ||
                    (c.Company != null && c.Company.Contains(search)) ||
                    (c.Phone != null && c.Phone.Contains(search)));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(c => c.Status == status);
            }

            var totalItems = await query.CountAsync();

            var customers = await query
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new CustomerResponse
                {
                    Id = c.Id,
                    Name = c.Name,
                    Email = c.Email,
                    Phone = c.Phone,
                    Company = c.Company,
                    Address = c.Address,
                    Status = c.Status,
                    Notes = c.Notes,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                items = customers,
                page,
                pageSize,
                totalItems,
                totalPages = (int)Math.Ceiling(
                    totalItems / (double)pageSize)
            });
        }
    }
}