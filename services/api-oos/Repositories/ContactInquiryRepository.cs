namespace ApiOos.Repositories;

using ApiOos.Data;
using ApiOos.Interfaces.Repositories;
using ApiOos.Models;
using Microsoft.EntityFrameworkCore;

public class ContactInquiryRepository : IContactInquiryRepository
{
    private readonly AppDbContext _context;

    public ContactInquiryRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ContactInquiry> CreateAsync(ContactInquiry inquiry)
    {
        _context.ContactInquiries.Add(inquiry);
        await _context.SaveChangesAsync();
        return inquiry;
    }

    public async Task<IEnumerable<ContactInquiry>> GetAllAsync()
    {
        return await _context.ContactInquiries.OrderByDescending(c => c.CreatedAt).ToListAsync();
    }
}
