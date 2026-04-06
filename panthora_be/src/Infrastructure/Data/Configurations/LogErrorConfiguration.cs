using Domain.Constant;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class LogErrorConfiguration : IEntityTypeConfiguration<LogError>
{
    public void Configure(EntityTypeBuilder<LogError> builder)
    {
        // 1. Tên bảng
        builder.ToTable("LogErrors");
        builder.HasKey(le => le.Id);

        // 3. Cấu hình thuộc tính Content
        builder.Property(le => le.Content)
            .IsRequired();

        builder.HasIndex(le => le.CreatedOnUtc);
    }
}