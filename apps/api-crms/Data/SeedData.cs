using api_crms.Models;
using api_crms.Enums;
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
            BuyerType = Enums.BuyerType.Institutional,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        var globex = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Globex Industries",
            BuyerType = Enums.BuyerType.Institutional,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        var initech = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Initech Solutions",
            BuyerType = Enums.BuyerType.Individual,
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

        // VIP List — Static segment with manually assigned members
        var vipSegment = new Segment
        {
            Id = Guid.NewGuid(),
            Name = "VIP List",
            Type = SegmentType.Static,
            IsSystemDefined = false,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        dbContext.Segments.Add(vipSegment);
        dbContext.SegmentMemberships.AddRange(
            new SegmentMembership
            {
                SegmentId = vipSegment.Id,
                ContactId = contacts[0].Id, // Maya Chen
                CreatedAt = DateTimeOffset.UtcNow,
            },
            new SegmentMembership
            {
                SegmentId = vipSegment.Id,
                ContactId = contacts[3].Id, // Marcus Johnson
                CreatedAt = DateTimeOffset.UtcNow,
            }
        );

        // High Value Customers — Dynamic segment on LifetimeValue
        var highValueRule = JsonSerializer.Serialize(new
        {
            MatchMode = "MatchAll",
            Conditions = new[] { new { Field = "LifetimeValue", Operator = "greater_than", Value = "1000" } }
        });
        dbContext.Segments.Add(new Segment
        {
            Id = Guid.NewGuid(),
            Name = "High Value Customers",
            Type = SegmentType.Dynamic,
            IsSystemDefined = false,
            Rule = highValueRule,
            CreatedAt = DateTimeOffset.UtcNow,
        });

        dbContext.SaveChanges();

        // Seed ecommerce data if not already present
        SeedEcommerce(dbContext, contacts);
    }

    private static void SeedEcommerce(AppDbContext dbContext, Contact[] contacts)
    {
        if (dbContext.Products.Any()) return;

        // --- Products ---
        var products = new[]
        {
            new Product
            {
                Id = Guid.NewGuid(),
                PlatformProductId = "PROD-001",
                Name = "Premium Wireless Headphones",
                Price = 299.99m,
                InStock = true,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-60),
                UpdatedAt = DateTimeOffset.UtcNow.AddDays(-2),
            },
            new Product
            {
                Id = Guid.NewGuid(),
                PlatformProductId = "PROD-002",
                Name = "Ergonomic Standing Desk",
                Price = 749.00m,
                InStock = true,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-60),
                UpdatedAt = DateTimeOffset.UtcNow.AddDays(-5),
            },
            new Product
            {
                Id = Guid.NewGuid(),
                PlatformProductId = "PROD-003",
                Name = "Mechanical Keyboard (Cherry MX)",
                Price = 189.99m,
                InStock = false,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-45),
                UpdatedAt = DateTimeOffset.UtcNow.AddDays(-1),
            },
            new Product
            {
                Id = Guid.NewGuid(),
                PlatformProductId = "PROD-004",
                Name = "Ultra-Wide Monitor 34\"",
                Price = 1299.00m,
                InStock = true,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-30),
                UpdatedAt = DateTimeOffset.UtcNow.AddDays(-3),
            },
            new Product
            {
                Id = Guid.NewGuid(),
                PlatformProductId = "PROD-005",
                Name = "USB-C Docking Station",
                Price = 179.99m,
                InStock = true,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-30),
                UpdatedAt = DateTimeOffset.UtcNow.AddDays(-7),
            },
            new Product
            {
                Id = Guid.NewGuid(),
                PlatformProductId = "PROD-006",
                Name = "Noise Cancelling Earbuds",
                Price = 149.99m,
                InStock = false,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-20),
                UpdatedAt = DateTimeOffset.UtcNow.AddHours(-12),
            },
            new Product
            {
                Id = Guid.NewGuid(),
                PlatformProductId = "PROD-007",
                Name = "Webcam 4K Pro",
                Price = 219.00m,
                InStock = true,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-15),
                UpdatedAt = DateTimeOffset.UtcNow.AddDays(-4),
            },
        };
        dbContext.Products.AddRange(products);

        // --- Orders (with line items) ---
        var orders = new[]
        {
            CreateOrder("ORD-5001", contacts[0].Id, Enums.OrderStatus.Delivered, 1048.98m, 0m,
                DateTimeOffset.UtcNow.AddDays(-25),
                (products[0].PlatformProductId, "Premium Wireless Headphones", 2, 299.99m),
                (products[4].PlatformProductId, "USB-C Docking Station", 1, 179.99m),
                (products[5].PlatformProductId, "Noise Cancelling Earbuds", 1, 149.99m)),

            CreateOrder("ORD-5002", contacts[0].Id, Enums.OrderStatus.Shipped, 749.00m, 0m,
                DateTimeOffset.UtcNow.AddDays(-10),
                (products[1].PlatformProductId, "Ergonomic Standing Desk", 1, 749.00m)),

            CreateOrder("ORD-5003", contacts[1].Id, Enums.OrderStatus.Paid, 1489.99m, 0m,
                DateTimeOffset.UtcNow.AddDays(-7),
                (products[3].PlatformProductId, "Ultra-Wide Monitor 34\"", 1, 1299.00m),
                (products[2].PlatformProductId, "Mechanical Keyboard (Cherry MX)", 1, 189.99m)),

            CreateOrder("ORD-5004", contacts[2].Id, Enums.OrderStatus.Refunded, 299.99m, 299.99m,
                DateTimeOffset.UtcNow.AddDays(-14),
                (products[0].PlatformProductId, "Premium Wireless Headphones", 1, 299.99m)),

            CreateOrder("ORD-5005", contacts[3].Id, Enums.OrderStatus.Delivered, 2247.00m, 0m,
                DateTimeOffset.UtcNow.AddDays(-20),
                (products[1].PlatformProductId, "Ergonomic Standing Desk", 1, 749.00m),
                (products[3].PlatformProductId, "Ultra-Wide Monitor 34\"", 1, 1299.00m),
                (products[6].PlatformProductId, "Webcam 4K Pro", 1, 219.00m)),

            CreateOrder("ORD-5006", contacts[3].Id, Enums.OrderStatus.Paid, 369.98m, 0m,
                DateTimeOffset.UtcNow.AddDays(-3),
                (products[4].PlatformProductId, "USB-C Docking Station", 1, 179.99m),
                (products[2].PlatformProductId, "Mechanical Keyboard (Cherry MX)", 1, 189.99m)),

            CreateOrder("ORD-5007", contacts[5].Id, Enums.OrderStatus.Delivered, 449.98m, 0m,
                DateTimeOffset.UtcNow.AddDays(-18),
                (products[0].PlatformProductId, "Premium Wireless Headphones", 1, 299.99m),
                (products[5].PlatformProductId, "Noise Cancelling Earbuds", 1, 149.99m)),

            CreateOrder("ORD-5008", contacts[6].Id, Enums.OrderStatus.Shipped, 179.99m, 0m,
                DateTimeOffset.UtcNow.AddDays(-2),
                (products[4].PlatformProductId, "USB-C Docking Station", 1, 179.99m)),
        };
        dbContext.Orders.AddRange(orders);

        // Update LTV on contacts
        contacts[0].LifetimeValue = 1797.98m; // ORD-5001 (delivered) + ORD-5002 (shipped)
        contacts[1].LifetimeValue = 1489.99m; // ORD-5003 (paid)
        contacts[2].LifetimeValue = 0m;        // ORD-5004 fully refunded
        contacts[3].LifetimeValue = 2616.98m; // ORD-5005 (delivered) + ORD-5006 (paid)
        contacts[5].LifetimeValue = 449.98m;  // ORD-5007 (delivered)
        contacts[6].LifetimeValue = 179.99m;  // ORD-5008 (shipped)

        // --- Carts ---
        // Active carts (recent activity)
        var activeCart1 = new Cart
        {
            Id = Guid.NewGuid(),
            PlatformCartId = "CART-301",
            ContactId = contacts[4].Id,
            Status = Enums.CartStatus.Active,
            LastActivityAt = DateTimeOffset.UtcNow.AddMinutes(-20),
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-2),
            UpdatedAt = DateTimeOffset.UtcNow.AddMinutes(-20),
        };
        activeCart1.Items.Add(new CartItem { Id = Guid.NewGuid(), CartId = activeCart1.Id, ProductId = "PROD-004", ProductName = "Ultra-Wide Monitor 34\"", Quantity = 1, UnitPrice = 1299.00m });
        activeCart1.Items.Add(new CartItem { Id = Guid.NewGuid(), CartId = activeCart1.Id, ProductId = "PROD-005", ProductName = "USB-C Docking Station", Quantity = 1, UnitPrice = 179.99m });

        // Abandoned carts (inactive past threshold)
        var abandonedCart1 = new Cart
        {
            Id = Guid.NewGuid(),
            PlatformCartId = "CART-287",
            ContactId = contacts[2].Id,
            Status = Enums.CartStatus.Abandoned,
            LastActivityAt = DateTimeOffset.UtcNow.AddHours(-26),
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-2),
            UpdatedAt = DateTimeOffset.UtcNow.AddHours(-26),
        };
        abandonedCart1.Items.Add(new CartItem { Id = Guid.NewGuid(), CartId = abandonedCart1.Id, ProductId = "PROD-001", ProductName = "Premium Wireless Headphones", Quantity = 1, UnitPrice = 299.99m });
        abandonedCart1.Items.Add(new CartItem { Id = Guid.NewGuid(), CartId = abandonedCart1.Id, ProductId = "PROD-006", ProductName = "Noise Cancelling Earbuds", Quantity = 2, UnitPrice = 149.99m });

        var abandonedCart2 = new Cart
        {
            Id = Guid.NewGuid(),
            PlatformCartId = "CART-291",
            ContactId = contacts[7].Id,
            Status = Enums.CartStatus.Abandoned,
            LastActivityAt = DateTimeOffset.UtcNow.AddHours(-18),
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-1),
            UpdatedAt = DateTimeOffset.UtcNow.AddHours(-18),
        };
        abandonedCart2.Items.Add(new CartItem { Id = Guid.NewGuid(), CartId = abandonedCart2.Id, ProductId = "PROD-002", ProductName = "Ergonomic Standing Desk", Quantity = 1, UnitPrice = 749.00m });

        var abandonedCart3 = new Cart
        {
            Id = Guid.NewGuid(),
            PlatformCartId = "CART-295",
            ContactId = contacts[6].Id,
            Status = Enums.CartStatus.Abandoned,
            LastActivityAt = DateTimeOffset.UtcNow.AddHours(-36),
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-3),
            UpdatedAt = DateTimeOffset.UtcNow.AddHours(-36),
        };
        abandonedCart3.Items.Add(new CartItem { Id = Guid.NewGuid(), CartId = abandonedCart3.Id, ProductId = "PROD-003", ProductName = "Mechanical Keyboard (Cherry MX)", Quantity = 1, UnitPrice = 189.99m });
        abandonedCart3.Items.Add(new CartItem { Id = Guid.NewGuid(), CartId = abandonedCart3.Id, ProductId = "PROD-007", ProductName = "Webcam 4K Pro", Quantity = 1, UnitPrice = 219.00m });

        // Converted cart
        var convertedCart = new Cart
        {
            Id = Guid.NewGuid(),
            PlatformCartId = "CART-280",
            ContactId = contacts[0].Id,
            Status = Enums.CartStatus.Converted,
            LastActivityAt = DateTimeOffset.UtcNow.AddDays(-10),
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-11),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-10),
        };
        convertedCart.Items.Add(new CartItem { Id = Guid.NewGuid(), CartId = convertedCart.Id, ProductId = "PROD-002", ProductName = "Ergonomic Standing Desk", Quantity = 1, UnitPrice = 749.00m });

        dbContext.Carts.AddRange(activeCart1, abandonedCart1, abandonedCart2, abandonedCart3, convertedCart);

        // --- Workflow Definition ---
        var workflow = new Workflow
        {
            Id = Guid.NewGuid(),
            Name = "Abandoned Cart Recovery",
            TriggerType = "cart.abandoned",
            StopCondition = "order_completed",
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-30),
        };
        workflow.Steps.Add(new WorkflowStep
        {
            Id = Guid.NewGuid(),
            WorkflowId = workflow.Id,
            StepOrder = 0,
            WaitDuration = TimeSpan.FromHours(1),
            ActionType = "email",
            ActionConfig = "{\"template\":\"cart_reminder\",\"subject\":\"You left something behind!\"}",
        });
        workflow.Steps.Add(new WorkflowStep
        {
            Id = Guid.NewGuid(),
            WorkflowId = workflow.Id,
            StepOrder = 1,
            WaitDuration = TimeSpan.FromHours(24),
            ActionType = "email",
            ActionConfig = "{\"template\":\"cart_discount\",\"subject\":\"10% off — complete your order\"}",
        });
        workflow.Steps.Add(new WorkflowStep
        {
            Id = Guid.NewGuid(),
            WorkflowId = workflow.Id,
            StepOrder = 2,
            WaitDuration = TimeSpan.FromHours(72),
            ActionType = "email",
            ActionConfig = "{\"template\":\"cart_final\",\"subject\":\"Last chance — your cart expires soon\"}",
        });
        dbContext.Workflows.Add(workflow);

        // --- Workflow Runs ---
        // Running: abandoned cart 1 — on step 2 (sent reminder, sent discount, waiting for final)
        dbContext.WorkflowRuns.Add(new WorkflowRun
        {
            Id = Guid.NewGuid(),
            WorkflowId = workflow.Id,
            EntityId = abandonedCart1.Id,
            EntityType = "Cart",
            CurrentStepIndex = 2,
            Status = Enums.WorkflowRunStatus.Running,
            StartedAt = DateTimeOffset.UtcNow.AddHours(-25),
            NextStepDueAt = DateTimeOffset.UtcNow.AddHours(47),
        });

        // Running: abandoned cart 2 — on step 1 (sent reminder, waiting for discount email)
        dbContext.WorkflowRuns.Add(new WorkflowRun
        {
            Id = Guid.NewGuid(),
            WorkflowId = workflow.Id,
            EntityId = abandonedCart2.Id,
            EntityType = "Cart",
            CurrentStepIndex = 1,
            Status = Enums.WorkflowRunStatus.Running,
            StartedAt = DateTimeOffset.UtcNow.AddHours(-17),
            NextStepDueAt = DateTimeOffset.UtcNow.AddHours(7),
        });

        // Running: abandoned cart 3 — on step 0 (just started, waiting for first reminder)
        dbContext.WorkflowRuns.Add(new WorkflowRun
        {
            Id = Guid.NewGuid(),
            WorkflowId = workflow.Id,
            EntityId = abandonedCart3.Id,
            EntityType = "Cart",
            CurrentStepIndex = 0,
            Status = Enums.WorkflowRunStatus.Running,
            StartedAt = DateTimeOffset.UtcNow.AddHours(-35),
            NextStepDueAt = DateTimeOffset.UtcNow.AddMinutes(-30),
        });

        // Stopped: converted cart — stopped because order was completed
        dbContext.WorkflowRuns.Add(new WorkflowRun
        {
            Id = Guid.NewGuid(),
            WorkflowId = workflow.Id,
            EntityId = convertedCart.Id,
            EntityType = "Cart",
            CurrentStepIndex = 1,
            Status = Enums.WorkflowRunStatus.Stopped,
            StartedAt = DateTimeOffset.UtcNow.AddDays(-11),
            NextStepDueAt = DateTimeOffset.UtcNow.AddDays(-10),
            CompletedAt = DateTimeOffset.UtcNow.AddDays(-10),
        });

        // --- Processed Events (to show webhook idempotency works) ---
        dbContext.ProcessedEvents.AddRange(
            new ProcessedEvent { EventId = "seed-evt-001", EventType = "order.created", ProcessedAt = DateTimeOffset.UtcNow.AddDays(-25) },
            new ProcessedEvent { EventId = "seed-evt-002", EventType = "order.created", ProcessedAt = DateTimeOffset.UtcNow.AddDays(-10) },
            new ProcessedEvent { EventId = "seed-evt-003", EventType = "product.updated", ProcessedAt = DateTimeOffset.UtcNow.AddDays(-2) },
            new ProcessedEvent { EventId = "seed-evt-004", EventType = "cart.updated", ProcessedAt = DateTimeOffset.UtcNow.AddDays(-2) }
        );

        // Seed ecommerce sync status — reflects that events have been received (healthy state)
        dbContext.EcommerceSyncStatuses.Add(new EcommerceSyncStatus
        {
            Id = 1,
            FirstEventReceivedAt = DateTimeOffset.UtcNow.AddDays(-25),
            LastEventReceivedAt = DateTimeOffset.UtcNow.AddHours(-6),
        });

        dbContext.SaveChanges();
    }

    private static Order CreateOrder(
        string platformOrderId, Guid contactId, Enums.OrderStatus status,
        decimal total, decimal refundedAmount, DateTimeOffset createdAt,
        params (string ProductId, string ProductName, int Quantity, decimal UnitPrice)[] items)
    {
        var order = new Order
        {
            Id = Guid.NewGuid(),
            PlatformOrderId = platformOrderId,
            ContactId = contactId,
            Status = status,
            Total = total,
            RefundedAmount = refundedAmount,
            CreatedAt = createdAt,
            UpdatedAt = createdAt,
        };
        foreach (var (productId, productName, quantity, unitPrice) in items)
        {
            order.LineItems.Add(new OrderLineItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                ProductId = productId,
                ProductName = productName,
                Quantity = quantity,
                UnitPrice = unitPrice,
            });
        }
        return order;
    }
}
