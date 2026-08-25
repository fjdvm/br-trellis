using api_crms.Models;
using System.Text.Json;

namespace api_crms.Data;

public static class SeedData
{
    public static void Seed(AppDbContext dbContext)
    {
        if (dbContext.Contacts.Any())
        {
            return;
        }

        var acme = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Acme Corp",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        var globex = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Globex Industries",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        var initech = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Initech Solutions",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        dbContext.Companies.AddRange(acme, globex, initech);

        var contacts = new[]
        {
            new Contact
            {
                Id = Guid.NewGuid(),
                Name = "Maya Chen",
                Email = "maya.chen@acme.com",
                Phone = "+1 555-0101",
                CompanyId = acme.Id,
                SentimentScore = 0.85m,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-30),
            },
            new Contact
            {
                Id = Guid.NewGuid(),
                Name = "Liam Torres",
                Email = "liam.torres@globex.io",
                Phone = "+1 555-0102",
                CompanyId = globex.Id,
                SentimentScore = 0.42m,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-25),
            },
            new Contact
            {
                Id = Guid.NewGuid(),
                Name = "Sofia Nakamura",
                Email = "sofia.n@initech.co",
                Phone = "+1 555-0103",
                CompanyId = initech.Id,
                SentimentScore = -0.3m,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-20),
            },
            new Contact
            {
                Id = Guid.NewGuid(),
                Name = "Marcus Johnson",
                Email = "marcus.j@gmail.com",
                Phone = "+1 555-0104",
                SentimentScore = 0.91m,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-18),
            },
            new Contact
            {
                Id = Guid.NewGuid(),
                Name = "Ava Patel",
                Email = "ava.patel@acme.com",
                Phone = "+1 555-0105",
                CompanyId = acme.Id,
                SentimentScore = -0.6m,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-15),
            },
            new Contact
            {
                Id = Guid.NewGuid(),
                Name = "Noah Kim",
                Email = "noah.kim@globex.io",
                Phone = "+1 555-0106",
                CompanyId = globex.Id,
                SentimentScore = 0.72m,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-12),
            },
            new Contact
            {
                Id = Guid.NewGuid(),
                Name = "Isabella Rivera",
                Email = "isabella.r@outlook.com",
                Phone = "+1 555-0107",
                SentimentScore = 0.15m,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-10),
            },
            new Contact
            {
                Id = Guid.NewGuid(),
                Name = "Ethan Wright",
                Email = "ethan.w@initech.co",
                Phone = "+1 555-0108",
                CompanyId = initech.Id,
                SentimentScore = -0.45m,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-8),
            },
        };
        dbContext.Contacts.AddRange(contacts);

        // Source references
        dbContext.SourceReferences.AddRange(
            new SourceReference
            {
                Id = Guid.NewGuid(),
                ContactId = contacts[0].Id,
                SourceSystem = "pos",
                SourceId = "POS-1001",
                Status = SourceReferenceStatus.Linked,
                MatchConfidence = 1m,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-30),
            },
            new SourceReference
            {
                Id = Guid.NewGuid(),
                ContactId = contacts[0].Id,
                SourceSystem = "ecommerce",
                SourceId = "EC-2001",
                Status = SourceReferenceStatus.Linked,
                MatchConfidence = 1m,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-28),
            },
            new SourceReference
            {
                Id = Guid.NewGuid(),
                ContactId = contacts[1].Id,
                SourceSystem = "ecommerce",
                SourceId = "EC-2002",
                Status = SourceReferenceStatus.Linked,
                MatchConfidence = 1m,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-25),
            },
            new SourceReference
            {
                Id = Guid.NewGuid(),
                ContactId = contacts[2].Id,
                SourceSystem = "pos",
                SourceId = "POS-1003",
                Status = SourceReferenceStatus.Linked,
                MatchConfidence = 1m,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-20),
            },
            new SourceReference
            {
                Id = Guid.NewGuid(),
                ContactId = contacts[3].Id,
                SourceSystem = "pos",
                SourceId = "POS-1004",
                Status = SourceReferenceStatus.Linked,
                MatchConfidence = 1m,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-18),
            },
            new SourceReference
            {
                Id = Guid.NewGuid(),
                ContactId = contacts[4].Id,
                SourceSystem = "ecommerce",
                SourceId = "EC-2005",
                Status = SourceReferenceStatus.Linked,
                MatchConfidence = 1m,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-15),
            },
            new SourceReference
            {
                Id = Guid.NewGuid(),
                ContactId = contacts[5].Id,
                SourceSystem = "crm-import",
                SourceId = "IMP-3001",
                Status = SourceReferenceStatus.Linked,
                MatchConfidence = 1m,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-12),
            }
        );

        // Custom field definitions
        var tierField = new CustomFieldDefinition
        {
            Id = Guid.NewGuid(),
            Name = "Tier",
            FieldType = CustomFieldType.SingleSelect,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        var regionField = new CustomFieldDefinition
        {
            Id = Guid.NewGuid(),
            Name = "Region",
            FieldType = CustomFieldType.Text,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        var contractValueField = new CustomFieldDefinition
        {
            Id = Guid.NewGuid(),
            Name = "Contract Value",
            FieldType = CustomFieldType.Number,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        dbContext.CustomFieldDefinitions.AddRange(tierField, regionField, contractValueField);

        // Tier options
        var goldOption = new CustomFieldOption { Id = Guid.NewGuid(), CustomFieldDefinitionId = tierField.Id, Label = "Gold", SortOrder = 1 };
        var silverOption = new CustomFieldOption { Id = Guid.NewGuid(), CustomFieldDefinitionId = tierField.Id, Label = "Silver", SortOrder = 2 };
        var bronzeOption = new CustomFieldOption { Id = Guid.NewGuid(), CustomFieldDefinitionId = tierField.Id, Label = "Bronze", SortOrder = 3 };
        dbContext.CustomFieldOptions.AddRange(goldOption, silverOption, bronzeOption);

        // Custom field values for some contacts
        dbContext.CustomFieldValues.AddRange(
            new CustomFieldValue { Id = Guid.NewGuid(), ContactId = contacts[0].Id, CustomFieldDefinitionId = tierField.Id, OptionId = goldOption.Id },
            new CustomFieldValue { Id = Guid.NewGuid(), ContactId = contacts[1].Id, CustomFieldDefinitionId = tierField.Id, OptionId = silverOption.Id },
            new CustomFieldValue { Id = Guid.NewGuid(), ContactId = contacts[2].Id, CustomFieldDefinitionId = tierField.Id, OptionId = bronzeOption.Id },
            new CustomFieldValue { Id = Guid.NewGuid(), ContactId = contacts[3].Id, CustomFieldDefinitionId = tierField.Id, OptionId = goldOption.Id },
            new CustomFieldValue { Id = Guid.NewGuid(), ContactId = contacts[0].Id, CustomFieldDefinitionId = regionField.Id, TextValue = "APAC" },
            new CustomFieldValue { Id = Guid.NewGuid(), ContactId = contacts[1].Id, CustomFieldDefinitionId = regionField.Id, TextValue = "EMEA" },
            new CustomFieldValue { Id = Guid.NewGuid(), ContactId = contacts[2].Id, CustomFieldDefinitionId = regionField.Id, TextValue = "Americas" },
            new CustomFieldValue { Id = Guid.NewGuid(), ContactId = contacts[0].Id, CustomFieldDefinitionId = contractValueField.Id, NumberValue = 150000m },
            new CustomFieldValue { Id = Guid.NewGuid(), ContactId = contacts[1].Id, CustomFieldDefinitionId = contractValueField.Id, NumberValue = 75000m },
            new CustomFieldValue { Id = Guid.NewGuid(), ContactId = contacts[3].Id, CustomFieldDefinitionId = contractValueField.Id, NumberValue = 200000m }
        );

        // Timeline entries
        dbContext.TimelineEntries.AddRange(
            new TimelineEntry
            {
                Id = Guid.NewGuid(),
                ContactId = contacts[0].Id,
                SourceModule = "Ecommerce",
                EntryType = "Order",
                Summary = "Placed order #ORD-4521 ($2,340.00)",
                OccurredAt = DateTimeOffset.UtcNow.AddDays(-5),
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-5),
            },
            new TimelineEntry
            {
                Id = Guid.NewGuid(),
                ContactId = contacts[0].Id,
                SourceModule = "Conversations",
                EntryType = "Ticket Resolved",
                Summary = "Support ticket #TK-892 resolved — billing inquiry",
                OccurredAt = DateTimeOffset.UtcNow.AddDays(-3),
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-3),
            },
            new TimelineEntry
            {
                Id = Guid.NewGuid(),
                ContactId = contacts[0].Id,
                SourceModule = "Sentiment",
                EntryType = "Score Update",
                Summary = "Sentiment score improved from 0.72 to 0.85",
                OccurredAt = DateTimeOffset.UtcNow.AddDays(-1),
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-1),
            },
            new TimelineEntry
            {
                Id = Guid.NewGuid(),
                ContactId = contacts[1].Id,
                SourceModule = "Ecommerce",
                EntryType = "Order",
                Summary = "Placed order #ORD-4498 ($890.00)",
                OccurredAt = DateTimeOffset.UtcNow.AddDays(-7),
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-7),
            },
            new TimelineEntry
            {
                Id = Guid.NewGuid(),
                ContactId = contacts[2].Id,
                SourceModule = "Conversations",
                EntryType = "Complaint",
                Summary = "Filed complaint about delayed shipment — escalated",
                OccurredAt = DateTimeOffset.UtcNow.AddDays(-4),
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-4),
            },
            new TimelineEntry
            {
                Id = Guid.NewGuid(),
                ContactId = contacts[4].Id,
                SourceModule = "Sentiment",
                EntryType = "Score Update",
                Summary = "Sentiment score dropped from 0.1 to -0.6 — at risk",
                OccurredAt = DateTimeOffset.UtcNow.AddDays(-2),
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-2),
            }
        );

        // At-Risk Customers segment (system-defined)
        var atRiskRule = JsonSerializer.Serialize(new
        {
            MatchMode = "MatchAll",
            Conditions = new[] { new { Field = "SentimentScore", Operator = "less_than", Value = "0" } }
        });
        dbContext.Segments.Add(new Segment
        {
            Id = Guid.NewGuid(),
            Name = "At-Risk Customers",
            Type = SegmentType.Dynamic,
            IsSystemDefined = true,
            Rule = atRiskRule,
            CreatedAt = DateTimeOffset.UtcNow,
        });

        dbContext.SaveChanges();
    }
}
