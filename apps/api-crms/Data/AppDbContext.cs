using api_crms.Enums;
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

    public DbSet<Order> Orders => Set<Order>();

    public DbSet<OrderLineItem> OrderLineItems => Set<OrderLineItem>();

    public DbSet<Cart> Carts => Set<Cart>();

    public DbSet<CartItem> CartItems => Set<CartItem>();

    public DbSet<Product> Products => Set<Product>();

    public DbSet<ProcessedEvent> ProcessedEvents => Set<ProcessedEvent>();

    public DbSet<Workflow> Workflows => Set<Workflow>();
    public DbSet<WorkflowStep> WorkflowSteps => Set<WorkflowStep>();
    public DbSet<WorkflowRun> WorkflowRuns => Set<WorkflowRun>();

    public DbSet<EcommerceSyncStatus> EcommerceSyncStatuses => Set<EcommerceSyncStatus>();

    public DbSet<Ticket> Tickets => Set<Ticket>();

    public DbSet<Message> Messages => Set<Message>();

    public DbSet<CannedReplyCategory> CannedReplyCategories => Set<CannedReplyCategory>();

    public DbSet<CannedReply> CannedReplies => Set<CannedReply>();

    public DbSet<Template> Templates => Set<Template>();

    public DbSet<BlockTemplate> BlockTemplates => Set<BlockTemplate>();

    public DbSet<TemplateBlock> TemplateBlocks => Set<TemplateBlock>();

    public DbSet<Campaign> Campaigns => Set<Campaign>();

    public DbSet<CampaignChannelContent> CampaignChannelContents => Set<CampaignChannelContent>();

    public DbSet<CampaignEvent> CampaignEvents => Set<CampaignEvent>();

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
        ConfigureOrder(modelBuilder);
        ConfigureOrderLineItem(modelBuilder);
        ConfigureCart(modelBuilder);
        ConfigureCartItem(modelBuilder);
        ConfigureProduct(modelBuilder);
        ConfigureProcessedEvent(modelBuilder);
        ConfigureWorkflow(modelBuilder);
        ConfigureWorkflowStep(modelBuilder);
        ConfigureWorkflowRun(modelBuilder);
        ConfigureEcommerceSyncStatus(modelBuilder);
        ConfigureTicket(modelBuilder);
        ConfigureMessage(modelBuilder);
        ConfigureCannedReplyCategory(modelBuilder);
        ConfigureCannedReply(modelBuilder);
        ConfigureTemplate(modelBuilder);
        ConfigureCampaign(modelBuilder);
        ConfigureCampaignChannelContent(modelBuilder);
        ConfigureCampaignEvent(modelBuilder);
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
            contact.Property(e => e.LifetimeValue).HasColumnName("lifetime_value");
            contact.Property(e => e.MarketingOptOut).HasColumnName("marketing_opt_out");
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
            company.Property(e => e.BuyerType)
                .HasColumnName("buyer_type")
                .HasConversion<string>();
            company.Property(e => e.PrimaryContactId).HasColumnName("primary_contact_id");
            company.Property(e => e.CreatedAt).HasColumnName("created_at");
            company.Property(e => e.DeletedAt).HasColumnName("deleted_at");

            company.HasOne(e => e.PrimaryContact)
                .WithMany()
                .HasForeignKey(e => e.PrimaryContactId)
                .OnDelete(DeleteBehavior.SetNull);
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

    private static void ConfigureOrder(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Order>(order =>
        {
            order.ToTable("order");
            order.HasKey(e => e.Id);
            order.Property(e => e.Id).HasColumnName("id");
            order.Property(e => e.PlatformOrderId).HasColumnName("platform_order_id");
            order.Property(e => e.ContactId).HasColumnName("contact_id");
            order.Property(e => e.Status)
                .HasColumnName("status")
                .HasConversion<string>();
            order.Property(e => e.Total).HasColumnName("total");
            order.Property(e => e.RefundedAmount).HasColumnName("refunded_amount");
            order.Property(e => e.CreatedAt).HasColumnName("created_at");
            order.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            order.HasIndex(e => e.PlatformOrderId).IsUnique();
            order.HasIndex(e => e.ContactId);

            order.HasOne(e => e.Contact)
                .WithMany(e => e.Orders)
                .HasForeignKey(e => e.ContactId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureOrderLineItem(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OrderLineItem>(item =>
        {
            item.ToTable("order_line_item");
            item.HasKey(e => e.Id);
            item.Property(e => e.Id).HasColumnName("id");
            item.Property(e => e.OrderId).HasColumnName("order_id");
            item.Property(e => e.ProductId).HasColumnName("product_id");
            item.Property(e => e.ProductName).HasColumnName("product_name");
            item.Property(e => e.Quantity).HasColumnName("quantity");
            item.Property(e => e.UnitPrice).HasColumnName("unit_price");

            item.HasOne(e => e.Order)
                .WithMany(e => e.LineItems)
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureCart(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Cart>(cart =>
        {
            cart.ToTable("cart");
            cart.HasKey(e => e.Id);
            cart.Property(e => e.Id).HasColumnName("id");
            cart.Property(e => e.PlatformCartId).HasColumnName("platform_cart_id");
            cart.Property(e => e.ContactId).HasColumnName("contact_id");
            cart.Property(e => e.Status)
                .HasColumnName("status")
                .HasConversion<string>();
            cart.Property(e => e.LastActivityAt).HasColumnName("last_activity_at");
            cart.Property(e => e.CreatedAt).HasColumnName("created_at");
            cart.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            cart.HasIndex(e => e.PlatformCartId).IsUnique();
            cart.HasIndex(e => e.ContactId);

            cart.HasOne(e => e.Contact)
                .WithMany(e => e.Carts)
                .HasForeignKey(e => e.ContactId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }

    private static void ConfigureCartItem(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CartItem>(item =>
        {
            item.ToTable("cart_item");
            item.HasKey(e => e.Id);
            item.Property(e => e.Id).HasColumnName("id");
            item.Property(e => e.CartId).HasColumnName("cart_id");
            item.Property(e => e.ProductId).HasColumnName("product_id");
            item.Property(e => e.ProductName).HasColumnName("product_name");
            item.Property(e => e.Quantity).HasColumnName("quantity");
            item.Property(e => e.UnitPrice).HasColumnName("unit_price");

            item.HasOne(e => e.Cart)
                .WithMany(e => e.Items)
                .HasForeignKey(e => e.CartId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureProduct(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>(product =>
        {
            product.ToTable("product");
            product.HasKey(e => e.Id);
            product.Property(e => e.Id).HasColumnName("id");
            product.Property(e => e.PlatformProductId).HasColumnName("platform_product_id");
            product.Property(e => e.Name).HasColumnName("name");
            product.Property(e => e.Price).HasColumnName("price");
            product.Property(e => e.InStock).HasColumnName("in_stock");
            product.Property(e => e.CreatedAt).HasColumnName("created_at");
            product.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            product.HasIndex(e => e.PlatformProductId).IsUnique();
        });
    }

    private static void ConfigureProcessedEvent(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProcessedEvent>(evt =>
        {
            evt.ToTable("processed_event");
            evt.HasKey(e => e.EventId);
            evt.Property(e => e.EventId).HasColumnName("event_id");
            evt.Property(e => e.EventType).HasColumnName("event_type");
            evt.Property(e => e.ProcessedAt).HasColumnName("processed_at");
        });
    }

    private static void ConfigureWorkflow(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Workflow>(workflow =>
        {
            workflow.ToTable("workflow");
            workflow.HasKey(e => e.Id);
            workflow.Property(e => e.Id).HasColumnName("id");
            workflow.Property(e => e.Name).HasColumnName("name");
            workflow.Property(e => e.TriggerType).HasColumnName("trigger_type");
            workflow.Property(e => e.StopCondition).HasColumnName("stop_condition");
            workflow.Property(e => e.CreatedAt).HasColumnName("created_at");
        });
    }

    private static void ConfigureWorkflowStep(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<WorkflowStep>(step =>
        {
            step.ToTable("workflow_step");
            step.HasKey(e => e.Id);
            step.Property(e => e.Id).HasColumnName("id");
            step.Property(e => e.WorkflowId).HasColumnName("workflow_id");
            step.Property(e => e.StepOrder).HasColumnName("step_order");
            step.Property(e => e.WaitDuration).HasColumnName("wait_duration");
            step.Property(e => e.ActionType).HasColumnName("action_type");
            step.Property(e => e.ActionConfig).HasColumnName("action_config");

            step.HasOne(e => e.Workflow)
                .WithMany(e => e.Steps)
                .HasForeignKey(e => e.WorkflowId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureWorkflowRun(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<WorkflowRun>(run =>
        {
            run.ToTable("workflow_run");
            run.HasKey(e => e.Id);
            run.Property(e => e.Id).HasColumnName("id");
            run.Property(e => e.WorkflowId).HasColumnName("workflow_id");
            run.Property(e => e.EntityId).HasColumnName("entity_id");
            run.Property(e => e.EntityType).HasColumnName("entity_type");
            run.Property(e => e.CurrentStepIndex).HasColumnName("current_step_index");
            run.Property(e => e.Status)
                .HasColumnName("status")
                .HasConversion<string>();
            run.Property(e => e.StartedAt).HasColumnName("started_at");
            run.Property(e => e.NextStepDueAt).HasColumnName("next_step_due_at");
            run.Property(e => e.CompletedAt).HasColumnName("completed_at");
            run.HasIndex(e => new { e.Status, e.NextStepDueAt });

            run.HasOne(e => e.Workflow)
                .WithMany(e => e.Runs)
                .HasForeignKey(e => e.WorkflowId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureEcommerceSyncStatus(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<EcommerceSyncStatus>(status =>
        {
            status.ToTable("ecommerce_sync_status");
            status.HasKey(e => e.Id);
            status.Property(e => e.Id).HasColumnName("id");
            status.Property(e => e.FirstEventReceivedAt).HasColumnName("first_event_received_at");
            status.Property(e => e.LastEventReceivedAt).HasColumnName("last_event_received_at");
        });
    }

    private static void ConfigureTicket(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Ticket>(ticket =>
        {
            ticket.ToTable("ticket");
            ticket.HasKey(e => e.Id);
            ticket.Property(e => e.Id).HasColumnName("id");
            ticket.Property(e => e.ContactId).HasColumnName("contact_id");
            ticket.Property(e => e.Subject).HasColumnName("subject");
            ticket.Property(e => e.ExternalThreadId).HasColumnName("external_thread_id");
            ticket.Property(e => e.Status)
                .HasColumnName("status")
                .HasConversion<string>();
            ticket.Property(e => e.WaitingOn)
                .HasColumnName("waiting_on")
                .HasConversion<string>();
            ticket.Property(e => e.Source)
                .HasColumnName("source")
                .HasConversion<string>();
            ticket.Property(e => e.AssignedToId).HasColumnName("assigned_to_id");
            ticket.Property(e => e.AssignedToName).HasColumnName("assigned_to_name");
            ticket.Property(e => e.AssignedToEmail).HasColumnName("assigned_to_email");
            ticket.Property(e => e.CanceledBy).HasColumnName("canceled_by");
            ticket.Property(e => e.CreatedAt).HasColumnName("created_at");
            ticket.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            ticket.HasIndex(e => e.Status);
            ticket.HasIndex(e => e.WaitingOn);
            ticket.HasIndex(e => e.Source);
            ticket.HasIndex(e => e.ContactId);
            ticket.HasIndex(e => e.ExternalThreadId);

            ticket.HasOne(e => e.Contact)
                .WithMany()
                .HasForeignKey(e => e.ContactId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }

    private static void ConfigureMessage(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Message>(message =>
        {
            message.ToTable("message");
            message.HasKey(e => e.Id);
            message.Property(e => e.Id).HasColumnName("id");
            message.Property(e => e.TicketId).HasColumnName("ticket_id");
            message.Property(e => e.SenderType)
                .HasColumnName("sender_type")
                .HasConversion<string>();
            message.Property(e => e.SenderContactId).HasColumnName("sender_contact_id");
            message.Property(e => e.SenderStaffId).HasColumnName("sender_staff_id");
            message.Property(e => e.SenderStaffName).HasColumnName("sender_staff_name");
            message.Property(e => e.Content).HasColumnName("content");
            message.Property(e => e.SentAt).HasColumnName("sent_at");
            message.HasIndex(e => new { e.TicketId, e.SentAt });

            message.HasOne(e => e.Ticket)
                .WithMany(e => e.Messages)
                .HasForeignKey(e => e.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            message.HasOne(e => e.SenderContact)
                .WithMany()
                .HasForeignKey(e => e.SenderContactId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }

    private static void ConfigureCannedReplyCategory(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CannedReplyCategory>(category =>
        {
            category.ToTable("canned_reply_category");
            category.HasKey(e => e.Id);
            category.Property(e => e.Id).HasColumnName("id");
            category.Property(e => e.Name).HasColumnName("name");
            category.Property(e => e.CreatedAt).HasColumnName("created_at");
            category.Property(e => e.DeletedAt).HasColumnName("deleted_at");
        });
    }

    private static void ConfigureCannedReply(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CannedReply>(reply =>
        {
            reply.ToTable("canned_reply");
            reply.HasKey(e => e.Id);
            reply.Property(e => e.Id).HasColumnName("id");
            reply.Property(e => e.CategoryId).HasColumnName("category_id");
            reply.Property(e => e.Name).HasColumnName("name");
            reply.Property(e => e.Body).HasColumnName("body");
            reply.Property(e => e.CreatedAt).HasColumnName("created_at");
            reply.Property(e => e.DeletedAt).HasColumnName("deleted_at");
            reply.HasIndex(e => e.CategoryId);

            reply.HasOne(e => e.Category)
                .WithMany(e => e.CannedReplies)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureTemplate(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Template>(template =>
        {
            template.ToTable("template");
            template.HasKey(e => e.Id);
            template.Property(e => e.Id).HasColumnName("id");
            template.Property(e => e.Name).HasColumnName("name");
            template.Property(e => e.Description).HasColumnName("description");
            template.Property(e => e.Channel)
                .HasColumnName("channel")
                .HasConversion<string>();
            template.Property(e => e.Content).HasColumnName("content");
            template.Property(e => e.Format)
                .HasColumnName("format")
                .HasConversion<string>();
            template.Property(e => e.ThumbnailUrl).HasColumnName("thumbnail_url");
            template.Property(e => e.CreatedAt).HasColumnName("created_at");
            template.HasIndex(e => e.Channel);
        });
    }

    private static void ConfigureCampaign(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Campaign>(campaign =>
        {
            campaign.ToTable("campaign");
            campaign.HasKey(e => e.Id);
            campaign.Property(e => e.Id).HasColumnName("id");
            campaign.Property(e => e.Title).HasColumnName("title");
            campaign.Property(e => e.Status)
                .HasColumnName("status")
                .HasConversion<string>();
            campaign.Property(e => e.Channels).HasColumnName("channels");
            campaign.Property(e => e.TargetSegmentId).HasColumnName("target_segment_id");
            campaign.Property(e => e.TargetEmails).HasColumnName("target_emails");
            campaign.Property(e => e.ResolvedRecipients).HasColumnName("resolved_recipients");
            campaign.Property(e => e.ScheduleType)
                .HasColumnName("schedule_type")
                .HasConversion<string>();
            campaign.Property(e => e.StartDate).HasColumnName("start_date");
            campaign.Property(e => e.EndDate).HasColumnName("end_date");
            campaign.Property(e => e.NextRunAt).HasColumnName("next_run_at");
            campaign.Property(e => e.EmailTerminal).HasColumnName("email_terminal");
            campaign.Property(e => e.DispatchSentCount).HasColumnName("dispatch_sent_count");
            campaign.Property(e => e.DispatchFailedCount).HasColumnName("dispatch_failed_count");
            campaign.Property(e => e.DispatchErrors).HasColumnName("dispatch_errors");
            campaign.Property(e => e.DispatchedAt).HasColumnName("dispatched_at");
            campaign.Property(e => e.CreatedById).HasColumnName("created_by_id");
            campaign.Property(e => e.CreatedAt).HasColumnName("created_at");
            campaign.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            campaign.HasIndex(e => e.Status);

            campaign.HasMany(e => e.ChannelContents)
                .WithOne(e => e.Campaign)
                .HasForeignKey(e => e.CampaignId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureCampaignChannelContent(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CampaignChannelContent>(content =>
        {
            content.ToTable("campaign_channel_content");
            content.HasKey(e => e.Id);
            content.Property(e => e.Id).HasColumnName("id");
            content.Property(e => e.CampaignId).HasColumnName("campaign_id");
            content.Property(e => e.Channel)
                .HasColumnName("channel")
                .HasConversion<string>();
            content.Property(e => e.TemplateId).HasColumnName("template_id");
            content.Property(e => e.Subject).HasColumnName("subject");
            content.Property(e => e.Heading).HasColumnName("heading");
            content.Property(e => e.Body).HasColumnName("body");
            content.Property(e => e.ImageUrl).HasColumnName("image_url");
            content.Property(e => e.LinkUrl).HasColumnName("link_url");
            content.Property(e => e.CtaText).HasColumnName("cta_text");
            content.Property(e => e.CtaUrl).HasColumnName("cta_url");
            content.Property(e => e.Dismissible).HasColumnName("dismissible");
            content.HasIndex(e => new { e.CampaignId, e.Channel }).IsUnique();
        });
    }

    private static void ConfigureCampaignEvent(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CampaignEvent>(evt =>
        {
            evt.ToTable("campaign_event");
            evt.HasKey(e => e.Id);
            evt.Property(e => e.Id).HasColumnName("id");
            evt.Property(e => e.CampaignId).HasColumnName("campaign_id");
            evt.Property(e => e.EventType)
                .HasColumnName("event_type")
                .HasConversion<string>();
            evt.Property(e => e.Email).HasColumnName("email");
            evt.Property(e => e.Url).HasColumnName("url");
            evt.Property(e => e.OccurredAt).HasColumnName("occurred_at");
            evt.HasIndex(e => e.CampaignId);

            evt.HasOne(e => e.Campaign)
                .WithMany()
                .HasForeignKey(e => e.CampaignId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        ConfigureBlockTemplate(modelBuilder);
    }

    private static void ConfigureBlockTemplate(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BlockTemplate>(t =>
        {
            t.ToTable("block_template");
            t.HasKey(e => e.Id);
            t.Property(e => e.Id).HasColumnName("id");
            t.Property(e => e.Name).HasColumnName("name");
            t.Property(e => e.Description).HasColumnName("description");
            t.Property(e => e.Channel)
                .HasColumnName("channel")
                .HasConversion<string>();
            t.Property(e => e.IsArchived).HasColumnName("is_archived");
            t.Property(e => e.CreatedAt).HasColumnName("created_at");
            t.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            t.HasMany(e => e.Blocks)
                .WithOne(b => b.BlockTemplate)
                .HasForeignKey(b => b.BlockTemplateId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TemplateBlock>(b =>
        {
            b.ToTable("template_block");
            b.HasKey(e => e.Id);
            b.Property(e => e.Id).HasColumnName("id");
            b.Property(e => e.BlockTemplateId).HasColumnName("block_template_id");
            b.Property(e => e.Type).HasColumnName("type");
            b.Property(e => e.Label).HasColumnName("label");
            b.Property(e => e.Order).HasColumnName("order");
            b.Property(e => e.TextAlign).HasColumnName("text_align");
            b.Property(e => e.IsBold).HasColumnName("is_bold");
            b.Property(e => e.IsItalic).HasColumnName("is_italic");
        });
    }
}
