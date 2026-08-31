namespace ApiOos.Data;

using ApiOos.Enums;
using ApiOos.Models;

using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Address> Addresses => Set<Address>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<ContactInquiry> ContactInquiries => Set<ContactInquiry>();
    public DbSet<ProductReview> ProductReviews => Set<ProductReview>();
    public DbSet<JobPosting> JobPostings => Set<JobPosting>();
    public DbSet<JobApplication> JobApplications => Set<JobApplication>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.FullName).IsRequired().HasMaxLength(100);
            e.Property(u => u.Email).IsRequired().HasMaxLength(256);
            e.Property(u => u.PasswordHash).IsRequired();
            e.HasMany(u => u.Addresses)
             .WithOne(a => a.User)
             .HasForeignKey(a => a.UserId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(u => u.Cart)
             .WithOne(c => c.User)
             .HasForeignKey<Cart>(c => c.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Address>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Label).IsRequired().HasMaxLength(50);
            e.Property(a => a.Street).IsRequired().HasMaxLength(200);
            e.Property(a => a.City).IsRequired().HasMaxLength(100);
            e.Property(a => a.Province).IsRequired().HasMaxLength(100);
            e.Property(a => a.PostalCode).IsRequired().HasMaxLength(20);
        });

        modelBuilder.Entity<Product>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => p.SKU).IsUnique();
            e.Property(p => p.Name).IsRequired().HasMaxLength(150);
            e.Property(p => p.Description).IsRequired().HasMaxLength(2000);
            e.Property(p => p.Price).HasPrecision(18, 2);
            e.Property(p => p.SKU).IsRequired().HasMaxLength(50);
            e.Property(p => p.Category).HasConversion<string>();
            e.Property(p => p.Images).HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>()
            );
        });

        modelBuilder.Entity<Cart>(e =>
        {
            e.HasKey(c => c.Id);
            e.HasMany(c => c.Items)
             .WithOne(i => i.Cart)
             .HasForeignKey(i => i.CartId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CartItem>(e =>
        {
            e.HasKey(ci => ci.Id);
            e.HasOne(ci => ci.Product)
             .WithMany()
             .HasForeignKey(ci => ci.ProductId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Order>(e =>
        {
            e.HasKey(o => o.Id);
            e.HasIndex(o => o.OrderNumber).IsUnique();
            e.Property(o => o.OrderNumber).IsRequired().HasMaxLength(50);
            e.Property(o => o.Subtotal).HasPrecision(18, 2);
            e.Property(o => o.ShippingFee).HasPrecision(18, 2);
            e.Property(o => o.Tax).HasPrecision(18, 2);
            e.Property(o => o.TotalAmount).HasPrecision(18, 2);
            e.Property(o => o.Status).HasConversion<string>();
            e.HasOne(o => o.User)
             .WithMany(u => u.Orders)
             .HasForeignKey(o => o.UserId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasMany(o => o.Items)
             .WithOne(i => i.Order)
             .HasForeignKey(i => i.OrderId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderItem>(e =>
        {
            e.HasKey(oi => oi.Id);
            e.Property(oi => oi.UnitPrice).HasPrecision(18, 2);
            e.Property(oi => oi.ProductName).IsRequired().HasMaxLength(150);
            e.Property(oi => oi.ProductSKU).IsRequired().HasMaxLength(50);
        });

        modelBuilder.Entity<Payment>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Amount).HasPrecision(18, 2);
            e.Property(p => p.PaymentMethod).HasConversion<string>();
            e.Property(p => p.Status).HasConversion<string>();
            e.HasOne(p => p.Order)
             .WithOne(o => o.Payment)
             .HasForeignKey<Payment>(p => p.OrderId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ContactInquiry>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Name).IsRequired().HasMaxLength(100);
            e.Property(c => c.Email).IsRequired().HasMaxLength(256);
            e.Property(c => c.Subject).IsRequired().HasMaxLength(200);
            e.Property(c => c.Message).IsRequired().HasMaxLength(4000);
        });

        modelBuilder.Entity<ProductReview>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.Rating).IsRequired();
            e.Property(r => r.Comment).IsRequired().HasMaxLength(500);

            e.HasOne(r => r.Product)
             .WithMany()
             .HasForeignKey(r => r.ProductId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(r => r.User)
             .WithMany()
             .HasForeignKey(r => r.UserId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(r => new { r.UserId, r.ProductId }).IsUnique();
        });

        modelBuilder.Entity<JobPosting>(e =>
        {
            e.HasKey(j => j.Id);
            e.Property(j => j.Title).IsRequired().HasMaxLength(150);
            e.Property(j => j.Description).IsRequired().HasMaxLength(4000);
            e.Property(j => j.Requirements).HasMaxLength(4000);
            e.Property(j => j.Location).IsRequired().HasMaxLength(100);
            e.Property(j => j.Department).IsRequired().HasMaxLength(100);
            e.Property(j => j.Type).IsRequired().HasMaxLength(50);
        });

        modelBuilder.Entity<JobApplication>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Name).IsRequired().HasMaxLength(100);
            e.Property(a => a.Email).IsRequired().HasMaxLength(256);
            e.Property(a => a.Phone).IsRequired().HasMaxLength(30);
            e.Property(a => a.CoverLetter).HasMaxLength(4000);
            e.Property(a => a.ResumeUrl).IsRequired().HasMaxLength(500);

            e.HasOne(a => a.JobPosting)
             .WithMany()
             .HasForeignKey(a => a.JobPostingId)
             .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
