namespace ApiOos.Interfaces.Repositories;

using ApiOos.Models;

public interface IContactInquiryRepository
{
    Task<ContactInquiry> CreateAsync(ContactInquiry inquiry);
    Task<IEnumerable<ContactInquiry>> GetAllAsync();
}
