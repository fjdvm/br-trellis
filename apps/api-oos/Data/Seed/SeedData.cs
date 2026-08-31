namespace ApiOos.Data.Seed;

using ApiOos.Data;
using ApiOos.Enums;
using ApiOos.Models;

using Microsoft.EntityFrameworkCore;

public static class SeedData
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        if (await context.Products.AnyAsync())
        {
            return;
        }

        var products = new List<Product>
        {
            new()
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "Ube Cream",
                Description = "Signature smooth, creamy spread slow-cooked for 8 hours using premium purple yams.",
                Price = 24.00m,
                Images = new List<string>
                {
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuDPJvudR-coJQnmXn0SG18CIXNB-geEbE3ML_K2e4pWAZxNR1HVPPHvwv-kWegsvycGiDm5Ho4OxW8voPvRdfa_gXF9rqPZzo8O3VIiJJ9pCOreYZEJ6xIz0eFq8ucte45mDeoNtipXfMjX-FVajoJIn5eqi9PGiynrvl5RspVeLccOTq9M0m1iWXih0sA-TlwoOm5eFTFHR2JE8AspBqp7WxWNuopCb5XK8SRldm0kA0aLU67_1PRR"
                },
                Stock = 50,
                Category = ProductCategory.Jams,
                SKU = "UBE-CRM-001",
                IsActive = true
            },
            new()
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Name = "Purple Yam Jam",
                Description = "Rich, rustic preserve with real bits of slow-cooked purple yam.",
                Price = 18.00m,
                Images = new List<string>
                {
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuDCK2_zvxOS8VCDQW2lb3TFCUCR7o0GIBwh8yS2xRRgXTObJM-apHisKbhmHNJf5UrKLppyh1u6CalRCqE0eT_rk342EoDPs4N6qhBICw0hiiSZUvCHxxJUA0J3UBJg8o4qYNWi2cViUfGRc-KyvqZPtS7RB_zkn6vvJLNYmkSmPMikMBYkbII502nIkMk7qThGW2LAvcdn72FE9-yNaMNvlOwcQqDWHcDbJ9SUNoQGYg2msEmBiB_K"
                },
                Stock = 80,
                Category = ProductCategory.Jams,
                SKU = "UBE-JAM-002",
                IsActive = true
            },
            new()
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                Name = "Artisanal Ube Cake",
                Description = "A perfect, single slice of vibrant purple layered cake.",
                Price = 45.00m,
                Images = new List<string>
                {
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuB8dVsNjfWWVxdoTRjlc-DOFYwkKOOX7fDVZ8HFFecc9S1u3Ct1iPp-zrpb6mGPDwTXALlL1e3EGT8HT_3kLhfQWnYPq3xMjlckQXGxcJ16k-VNztmRSHVIq0ErC89E2ZSltVPjvm824AlgHI8mpGwZ_tSMDuYO9fXCIlLtJalqjiP3Lpa-PnYv1S_tM0Y9_eHFfQ6JwOFraKD76yzjVisMPkcDewrhj7rj_Cf0jbcemN-O_bXIxEFk"
                },
                Stock = 35,
                Category = ProductCategory.Pastries,
                SKU = "UBE-CKE-003",
                IsActive = true
            },
            new()
            {
                Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                Name = "Ube Extract",
                Description = "Concentrated artisanal purple yam extract for elevated baking and drinks.",
                Price = 32.00m,
                Images = new List<string>
                {
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuC07hmWOl5y_trOgbx-WOMR4jE0zUBRYFZT3lOmeTa1gAvPwDNx0wMfSl907bdzH_Y7T-QaDCcHiTs-Yl1ni2shw5TAUc921nu-KeFG49S9-5VA3wFjobGFvyHN8iBcHiIt4GFVJp30_EPIf_VIcLM_gRrPhErEKfW5dNqlra55sj7aIBbw_yuQ8Wjumoy-dr30zSY53ob-duZs0Vxp4WYgkJHqSBnATNhPIRWwq6dLFaAJqdLx9omF"
                },
                Stock = 20,
                Category = ProductCategory.Sweets,
                SKU = "UBE-EXT-004",
                IsActive = true
            }
        };

        await context.Products.AddRangeAsync(products);
        await context.SaveChangesAsync();

        if (!await context.JobPostings.AnyAsync())
        {
            var jobs = new List<JobPosting>
            {
                new()
                {
                    Id = Guid.Parse("01111111-1111-1111-1111-111111111111"),
                    Title = "Senior Full-Stack Engineer (Next.js & .NET)",
                    Description = "We are looking for a Senior Full-Stack Engineer to lead the development of our e-commerce platform and operational systems. You will work with Next.js, Tailwind CSS, ASP.NET Core, and PostgreSQL.",
                    Requirements = "• 5+ years of experience with C# and ASP.NET Core\n• Strong expertise in React and Next.js (App Router)\n• Experience with Entity Framework Core and database optimization\n• Passion for writing clean, maintainable, and testable code",
                    Location = "Manila, Philippines (Hybrid)",
                    Department = "Engineering",
                    Type = "Full-time",
                    IsActive = true
                },
                new()
                {
                    Id = Guid.Parse("02222222-2222-2222-2222-222222222222"),
                    Title = "Digital Marketing Specialist",
                    Description = "Join our marketing team to drive growth and brand awareness for our premium Ube products. You will run campaigns, analyze user engagement, and optimize conversion funnels.",
                    Requirements = "• 3+ years of experience in e-commerce digital marketing\n• Proficient with Google Analytics, Meta Ads, and SEO best practices\n• Excellent copywriting and communication skills\n• Experience with email marketing platforms (e.g. Brevo/Mailchimp)",
                    Location = "Remote (Asia/Manila timezones)",
                    Department = "Marketing",
                    Type = "Full-time",
                    IsActive = true
                },
                new()
                {
                    Id = Guid.Parse("03333333-3333-3333-3333-333333333333"),
                    Title = "Kitchen Operations Supervisor",
                    Description = "Supervise the day-to-day operations of our production kitchen. You will ensure product quality, inventory accuracy, and adherence to health and safety regulations.",
                    Requirements = "• 2+ years of supervisory experience in F&B or food manufacturing\n• Strong knowledge of food safety standards (HACCP is a plus)\n• Detail-oriented with strong organizational skills",
                    Location = "Laguna, Philippines (On-site)",
                    Department = "Operations",
                    Type = "Full-time",
                    IsActive = true
                }
            };

            await context.JobPostings.AddRangeAsync(jobs);
            await context.SaveChangesAsync();
        }
    }
}
