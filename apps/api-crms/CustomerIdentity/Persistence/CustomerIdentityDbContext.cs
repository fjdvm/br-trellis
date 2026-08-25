using Microsoft.EntityFrameworkCore;

namespace api_crms.CustomerIdentity.Persistence;

public sealed class CustomerIdentityDbContext(DbContextOptions<CustomerIdentityDbContext> options)
    : DbContext(options)
{
    public DbSet<Customer> Customers => Set<Customer>();

    public DbSet<SourceReference> SourceReferences => Set<SourceReference>();

    public DbSet<IdentityMatchCandidate> IdentityMatchCandidates => Set<IdentityMatchCandidate>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Customer>(customer =>
        {
            customer.ToTable("customer");
            customer.HasKey(entity => entity.Id);
            customer.Property(entity => entity.Id).HasColumnName("id");
            customer.Property(entity => entity.CreatedAt).HasColumnName("created_at");
            customer.Property(entity => entity.Name).HasColumnName("name");
            customer.Property(entity => entity.Email).HasColumnName("email");
            customer.Property(entity => entity.Phone).HasColumnName("phone");
            customer.Property(entity => entity.DeletedAt).HasColumnName("deleted_at");
        });

        modelBuilder.Entity<SourceReference>(sourceReference =>
        {
            sourceReference.ToTable("source_reference");
            sourceReference.HasKey(entity => entity.Id);
            sourceReference.Property(entity => entity.Id).HasColumnName("id");
            sourceReference.Property(entity => entity.CustomerId).HasColumnName("customer_id");
            sourceReference.Property(entity => entity.SourceSystem).HasColumnName("source_system");
            sourceReference.Property(entity => entity.SourceId).HasColumnName("source_id");
            sourceReference.Property(entity => entity.MatchConfidence).HasColumnName("match_confidence");
            sourceReference.Property(entity => entity.Status)
                .HasColumnName("status")
                .HasConversion(
                    status => status == SourceReferenceStatus.Linked ? "linked" : "pending_review",
                    value => value == "linked"
                        ? SourceReferenceStatus.Linked
                        : SourceReferenceStatus.PendingReview);
            sourceReference.Property(entity => entity.CreatedAt).HasColumnName("created_at");
            sourceReference.Property(entity => entity.DeletedAt).HasColumnName("deleted_at");
            sourceReference.HasIndex(entity => new { entity.SourceSystem, entity.SourceId }).IsUnique();

            sourceReference.HasOne(entity => entity.Customer)
                .WithMany(entity => entity.SourceReferences)
                .HasForeignKey(entity => entity.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<IdentityMatchCandidate>(candidate =>
        {
            candidate.ToTable("identity_match_candidate");
            candidate.HasKey(entity => entity.Id);
            candidate.Property(entity => entity.Id).HasColumnName("id");
            candidate.Property(entity => entity.SourceReferenceId).HasColumnName("source_reference_id");
            candidate.Property(entity => entity.CandidateCustomerId).HasColumnName("candidate_customer_id");
            candidate.Property(entity => entity.ConfidenceScore).HasColumnName("confidence_score");
            candidate.Property(entity => entity.CreatedAt).HasColumnName("created_at");
            candidate.Property(entity => entity.DeletedAt).HasColumnName("deleted_at");
            candidate.HasIndex(entity => entity.SourceReferenceId);
            candidate.HasOne(entity => entity.SourceReference)
                .WithMany(entity => entity.IdentityMatchCandidates)
                .HasForeignKey(entity => entity.SourceReferenceId)
                .OnDelete(DeleteBehavior.Restrict);
            candidate.HasOne(entity => entity.CandidateCustomer)
                .WithMany()
                .HasForeignKey(entity => entity.CandidateCustomerId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
