using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Contact> Contacts => Set<Contact>();

    public DbSet<SourceReference> SourceReferences => Set<SourceReference>();

    public DbSet<IdentityMatchCandidate> IdentityMatchCandidates => Set<IdentityMatchCandidate>();

    public DbSet<Company> Companies => Set<Company>();

    public DbSet<CustomFieldDefinition> CustomFieldDefinitions => Set<CustomFieldDefinition>();

    public DbSet<CustomFieldOption> CustomFieldOptions => Set<CustomFieldOption>();

    public DbSet<CustomFieldValue> CustomFieldValues => Set<CustomFieldValue>();

    public DbSet<Segment> Segments => Set<Segment>();

    public DbSet<SegmentMembership> SegmentMemberships => Set<SegmentMembership>();

    public DbSet<TimelineEntry> TimelineEntries => Set<TimelineEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ConfigureContact(modelBuilder);
        ConfigureSourceReference(modelBuilder);
        ConfigureIdentityMatchCandidate(modelBuilder);
        ConfigureCompany(modelBuilder);
        ConfigureCustomFieldDefinition(modelBuilder);
        ConfigureCustomFieldOption(modelBuilder);
        ConfigureCustomFieldValue(modelBuilder);
        ConfigureSegment(modelBuilder);
        ConfigureSegmentMembership(modelBuilder);
        ConfigureTimelineEntry(modelBuilder);
    }

    private static void ConfigureContact(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Contact>(contact =>
        {
            contact.ToTable("contact");
            contact.HasKey(e => e.Id);
            contact.Property(e => e.Id).HasColumnName("id");
            contact.Property(e => e.CreatedAt).HasColumnName("created_at");
            contact.Property(e => e.Name).HasColumnName("name");
            contact.Property(e => e.Email).HasColumnName("email");
            contact.Property(e => e.Phone).HasColumnName("phone");
            contact.Property(e => e.SentimentScore).HasColumnName("sentiment_score");
            contact.Property(e => e.CompanyId).HasColumnName("company_id");
            contact.Property(e => e.DeletedAt).HasColumnName("deleted_at");

            contact.HasOne(e => e.Company)
                .WithMany(e => e.Contacts)
                .HasForeignKey(e => e.CompanyId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }

    private static void ConfigureSourceReference(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SourceReference>(sourceReference =>
        {
            sourceReference.ToTable("source_reference");
            sourceReference.HasKey(e => e.Id);
            sourceReference.Property(e => e.Id).HasColumnName("id");
            sourceReference.Property(e => e.ContactId).HasColumnName("contact_id");
            sourceReference.Property(e => e.SourceSystem).HasColumnName("source_system");
            sourceReference.Property(e => e.SourceId).HasColumnName("source_id");
            sourceReference.Property(e => e.MatchConfidence).HasColumnName("match_confidence");
            sourceReference.Property(e => e.Status)
                .HasColumnName("status")
                .HasConversion(
                    status => status == SourceReferenceStatus.Linked ? "linked" : "pending_review",
                    value => value == "linked"
                        ? SourceReferenceStatus.Linked
                        : SourceReferenceStatus.PendingReview);
            sourceReference.Property(e => e.CreatedAt).HasColumnName("created_at");
            sourceReference.Property(e => e.DeletedAt).HasColumnName("deleted_at");
            sourceReference.HasIndex(e => new { e.SourceSystem, e.SourceId }).IsUnique();

            sourceReference.HasOne(e => e.Contact)
                .WithMany(e => e.SourceReferences)
                .HasForeignKey(e => e.ContactId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureIdentityMatchCandidate(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<IdentityMatchCandidate>(candidate =>
        {
            candidate.ToTable("identity_match_candidate");
            candidate.HasKey(e => e.Id);
            candidate.Property(e => e.Id).HasColumnName("id");
            candidate.Property(e => e.SourceReferenceId).HasColumnName("source_reference_id");
            candidate.Property(e => e.CandidateContactId).HasColumnName("candidate_contact_id");
            candidate.Property(e => e.ConfidenceScore).HasColumnName("confidence_score");
            candidate.Property(e => e.CreatedAt).HasColumnName("created_at");
            candidate.Property(e => e.DeletedAt).HasColumnName("deleted_at");
            candidate.HasIndex(e => e.SourceReferenceId);

            candidate.HasOne(e => e.SourceReference)
                .WithMany(e => e.IdentityMatchCandidates)
                .HasForeignKey(e => e.SourceReferenceId)
                .OnDelete(DeleteBehavior.Restrict);

            candidate.HasOne(e => e.CandidateContact)
                .WithMany()
                .HasForeignKey(e => e.CandidateContactId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureCompany(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Company>(company =>
        {
            company.ToTable("company");
            company.HasKey(e => e.Id);
            company.Property(e => e.Id).HasColumnName("id");
            company.Property(e => e.Name).HasColumnName("name");
            company.Property(e => e.CreatedAt).HasColumnName("created_at");
            company.Property(e => e.DeletedAt).HasColumnName("deleted_at");
        });
    }

    private static void ConfigureCustomFieldDefinition(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CustomFieldDefinition>(definition =>
        {
            definition.ToTable("custom_field_definition");
            definition.HasKey(e => e.Id);
            definition.Property(e => e.Id).HasColumnName("id");
            definition.Property(e => e.Name).HasColumnName("name");
            definition.Property(e => e.FieldType)
                .HasColumnName("field_type")
                .HasConversion<string>();
            definition.Property(e => e.CreatedAt).HasColumnName("created_at");
            definition.Property(e => e.DeletedAt).HasColumnName("deleted_at");
        });
    }

    private static void ConfigureCustomFieldOption(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CustomFieldOption>(option =>
        {
            option.ToTable("custom_field_option");
            option.HasKey(e => e.Id);
            option.Property(e => e.Id).HasColumnName("id");
            option.Property(e => e.CustomFieldDefinitionId).HasColumnName("custom_field_definition_id");
            option.Property(e => e.Label).HasColumnName("label");
            option.Property(e => e.SortOrder).HasColumnName("sort_order");

            option.HasOne(e => e.Definition)
                .WithMany(e => e.Options)
                .HasForeignKey(e => e.CustomFieldDefinitionId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureCustomFieldValue(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CustomFieldValue>(value =>
        {
            value.ToTable("custom_field_value");
            value.HasKey(e => e.Id);
            value.Property(e => e.Id).HasColumnName("id");
            value.Property(e => e.ContactId).HasColumnName("contact_id");
            value.Property(e => e.CustomFieldDefinitionId).HasColumnName("custom_field_definition_id");
            value.Property(e => e.TextValue).HasColumnName("text_value");
            value.Property(e => e.NumberValue).HasColumnName("number_value");
            value.Property(e => e.DateValue).HasColumnName("date_value");
            value.Property(e => e.BoolValue).HasColumnName("bool_value");
            value.Property(e => e.OptionId).HasColumnName("option_id");
            value.HasIndex(e => new { e.ContactId, e.CustomFieldDefinitionId }).IsUnique();

            value.HasOne(e => e.Contact)
                .WithMany(e => e.CustomFieldValues)
                .HasForeignKey(e => e.ContactId)
                .OnDelete(DeleteBehavior.Cascade);

            value.HasOne(e => e.Definition)
                .WithMany(e => e.Values)
                .HasForeignKey(e => e.CustomFieldDefinitionId)
                .OnDelete(DeleteBehavior.Cascade);

            value.HasOne(e => e.Option)
                .WithMany()
                .HasForeignKey(e => e.OptionId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }

    private static void ConfigureSegment(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Segment>(segment =>
        {
            segment.ToTable("segment");
            segment.HasKey(e => e.Id);
            segment.Property(e => e.Id).HasColumnName("id");
            segment.Property(e => e.Name).HasColumnName("name");
            segment.Property(e => e.Type)
                .HasColumnName("type")
                .HasConversion<string>();
            segment.Property(e => e.IsSystemDefined).HasColumnName("is_system_defined");
            segment.Property(e => e.Rule).HasColumnName("rule");
            segment.Property(e => e.CreatedAt).HasColumnName("created_at");
            segment.Property(e => e.DeletedAt).HasColumnName("deleted_at");
        });
    }

    private static void ConfigureSegmentMembership(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SegmentMembership>(membership =>
        {
            membership.ToTable("segment_membership");
            membership.HasKey(e => new { e.SegmentId, e.ContactId });
            membership.Property(e => e.SegmentId).HasColumnName("segment_id");
            membership.Property(e => e.ContactId).HasColumnName("contact_id");
            membership.Property(e => e.CreatedAt).HasColumnName("created_at");

            membership.HasOne(e => e.Segment)
                .WithMany(e => e.Memberships)
                .HasForeignKey(e => e.SegmentId)
                .OnDelete(DeleteBehavior.Cascade);

            membership.HasOne(e => e.Contact)
                .WithMany()
                .HasForeignKey(e => e.ContactId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureTimelineEntry(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TimelineEntry>(entry =>
        {
            entry.ToTable("timeline_entry");
            entry.HasKey(e => e.Id);
            entry.Property(e => e.Id).HasColumnName("id");
            entry.Property(e => e.ContactId).HasColumnName("contact_id");
            entry.Property(e => e.SourceModule).HasColumnName("source_module");
            entry.Property(e => e.EntryType).HasColumnName("entry_type");
            entry.Property(e => e.Summary).HasColumnName("summary");
            entry.Property(e => e.OccurredAt).HasColumnName("occurred_at");
            entry.Property(e => e.CreatedAt).HasColumnName("created_at");

            entry.HasOne(e => e.Contact)
                .WithMany(e => e.TimelineEntries)
                .HasForeignKey(e => e.ContactId)
                .OnDelete(DeleteBehavior.Cascade);

            entry.HasIndex(e => new { e.ContactId, e.OccurredAt });
        });
    }
}
