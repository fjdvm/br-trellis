namespace ApiOos.Repositories;

using ApiOos.Data;
using ApiOos.Interfaces.Repositories;
using ApiOos.Models;
using Microsoft.EntityFrameworkCore;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        return await _context.Users
            .Include(u => u.Addresses)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users
            .Include(u => u.Addresses)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
    }

    public async Task<User?> GetByRefreshTokenAsync(string token)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.RefreshToken == token);
    }

    public async Task<User?> GetByResetTokenAsync(string token)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.PasswordResetToken == token);
    }

    public async Task<User> CreateAsync(User user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<User> UpdateAsync(User user)
    {
        user.UpdatedAt = DateTime.UtcNow;
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<IEnumerable<Address>> GetAddressesAsync(Guid userId)
    {
        return await _context.Addresses
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    public async Task<Address> AddAddressAsync(Address address)
    {
        if (address.IsDefault)
        {
            var existingDefaults = await _context.Addresses
                .Where(a => a.UserId == address.UserId && a.IsDefault)
                .ToListAsync();
            foreach (var existing in existingDefaults)
            {
                existing.IsDefault = false;
            }
        }

        _context.Addresses.Add(address);
        await _context.SaveChangesAsync();
        return address;
    }

    public async Task<Address?> GetAddressByIdAsync(Guid addressId)
    {
        return await _context.Addresses.FindAsync(addressId);
    }

    public async Task<Address> UpdateAddressAsync(Address address)
    {
        if (address.IsDefault)
        {
            var existingDefaults = await _context.Addresses
                .Where(a => a.UserId == address.UserId && a.Id != address.Id && a.IsDefault)
                .ToListAsync();
            foreach (var existing in existingDefaults)
            {
                existing.IsDefault = false;
            }
        }

        _context.Addresses.Update(address);
        await _context.SaveChangesAsync();
        return address;
    }

    public async Task DeleteAddressAsync(Guid addressId)
    {
        var address = await _context.Addresses.FindAsync(addressId);
        if (address != null)
        {
            _context.Addresses.Remove(address);
            await _context.SaveChangesAsync();
        }
    }
}
