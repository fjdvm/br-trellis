namespace ApiOos.Interfaces.Repositories;

using ApiOos.Models;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByRefreshTokenAsync(string token);
    Task<User?> GetByResetTokenAsync(string token);
    Task<User> CreateAsync(User user);
    Task<User> UpdateAsync(User user);

    Task<IEnumerable<Address>> GetAddressesAsync(Guid userId);
    Task<Address> AddAddressAsync(Address address);
    Task<Address?> GetAddressByIdAsync(Guid addressId);
    Task<Address> UpdateAddressAsync(Address address);
    Task DeleteAddressAsync(Guid addressId);
}
