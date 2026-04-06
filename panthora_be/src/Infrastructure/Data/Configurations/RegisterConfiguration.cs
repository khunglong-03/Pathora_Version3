using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class RegisterConfiguration : IEntityTypeConfiguration<RegisterEntity>
{
    public void Configure(EntityTypeBuilder<RegisterEntity> builder)
    {
        // 1. Tên bảng
        builder.ToTable("Registers");

        builder.HasKey(u => u.Id);

        // 3. Cấu hình Username
        builder.Property(u => u.Username)
            .IsRequired()
            .HasMaxLength(50);

        // Tạo Index cho Username để tìm kiếm nhanh và không trùng lặp
        builder.HasIndex(u => u.Username).IsUnique();

        // 4. Cấu hình Email
        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(150);

        builder.HasIndex(u => u.Email).IsUnique();

        // 5. Cấu hình Password (Lưu Hash nên cần độ dài đủ lớn)
        builder.Property(u => u.Password)
            .IsRequired()
            .HasMaxLength(500);

        // 6. Cấu hình FullName
        builder.Property(u => u.FullName)
            .IsRequired()
            .HasMaxLength(100);

        // 7. Các giá trị mặc định
        builder.Property(u => u.IsDeleted)
            .HasDefaultValue(false);
    }
}