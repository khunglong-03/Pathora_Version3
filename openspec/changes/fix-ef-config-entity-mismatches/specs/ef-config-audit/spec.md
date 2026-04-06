## ADDED Requirements

### Requirement: Nullable conflicts shall be resolved

EF Core configuration files SHALL NOT declare `.IsRequired()` on properties whose entity types are nullable value types or nullable reference types.

#### Scenario: Nullable Guid? property is not marked IsRequired
- **WHEN** an entity declares `public Guid? PropertyName { get; set; }`
- **THEN** the corresponding configuration SHALL NOT call `.IsRequired()` on that property

#### Scenario: Nullable string property is not marked IsRequired without max length
- **WHEN** an entity declares `public string? PropertyName { get; set; }`
- **THEN** the corresponding configuration SHALL either use `.IsRequired()` with `.HasMaxLength()` or leave it nullable without `.IsRequired()`

#### Scenario: Non-nullable Guid property is marked IsRequired
- **WHEN** an entity declares `public Guid PropertyName { get; set; }` (non-nullable)
- **THEN** the corresponding configuration SHALL call `.IsRequired()` on that property

---

### Requirement: All entities shall have configuration files

Every entity class registered in `AppDbContext` SHALL have a corresponding EntityTypeConfiguration class in `Infrastructure/Data/Configurations/`.

#### Scenario: Entity with existing configuration is tracked by EF Core
- **WHEN** `DbSet<EntityName>Entity` exists in `AppDbContext`
- **THEN** a file `EntityNameConfiguration.cs` SHALL exist in `Configurations/`

#### Scenario: Entity is discoverable via EF Core model
- **WHEN** `dotnet ef dbcontext optimize` runs successfully
- **THEN** all registered entities SHALL appear in the generated model with correct column types and relationships

---

### Requirement: JSONB collection properties shall have ValueComparers

Properties configured as JSONB column type with collection types (`List<T>`, `Dictionary<K,V>`) SHALL have a `ValueComparer<T>` configured to enable correct EF Core change tracking.

#### Scenario: List<string> JSONB column has ValueComparer
- **WHEN** a property `List<string>` is configured as `.HasColumnType("jsonb")`
- **THEN** the configuration SHALL set a `ValueComparer<List<string>>` that compares collections by element equality

#### Scenario: Dictionary JSONB column has ValueComparer
- **WHEN** a property `Dictionary<string, TData>` is configured as `.HasColumnType("jsonb")`
- **THEN** the configuration SHALL set a `ValueComparer<Dictionary<string, TData>>` that compares dictionaries by key-value equality

---

### Requirement: Unique indexes on nullable columns shall filter NULL values

Unique indexes on columns declared as nullable (`string?`, `Guid?`, etc.) SHALL include a PostgreSQL partial index filter (`WHERE column IS NOT NULL`) to allow multiple rows with NULL values.

#### Scenario: Unique nullable string index has NULL filter
- **WHEN** a property `public string? PropertyName { get; set; }` has `.IsUnique()`
- **THEN** the index configuration SHALL include `.HasFilter("\"PropertyName\" IS NOT NULL")`

#### Scenario: Nullable FK with unique constraint has NULL filter
- **WHEN** a nullable foreign key property has `.IsUnique()`
- **THEN** the unique index configuration SHALL include a filter allowing multiple NULL rows

---

### Requirement: Relationships shall be bidirectionally configured

Navigation properties on entities SHALL have corresponding `HasOne` or `HasMany` relationship configurations. Asymmetric relationships (configured from only one side) SHALL be made bidirectional.

#### Scenario: Required navigation has foreign key configured
- **WHEN** an entity declares `public virtual RelatedEntity Entity { get; set; } = null!;` with FK `public Guid EntityId { get; set; }`
- **THEN** the configuration SHALL include `HasOne(...).WithMany(...).HasForeignKey(...)` or `HasOne(...).WithOne(...).HasForeignKey(...)`

#### Scenario: Collection navigation has relationship configured
- **WHEN** an entity declares `public virtual ICollection<ChildEntity> Children { get; set; } = null!;`
- **THEN** the configuration SHALL include `HasMany(...).WithOne(...).HasForeignKey(...)` or `HasMany(...).WithMany(...)`

#### Scenario: Optional navigation has optional relationship configured
- **WHEN** an entity declares `public virtual RelatedEntity? Entity { get; set; }` with nullable FK `public Guid? EntityId { get; set; }`
- **THEN** the configuration SHALL include `HasOne(...).WithMany(...).HasForeignKey(...).OnDelete(DeleteBehavior.SetNull)` or equivalent

---

### Requirement: Enum properties shall use consistent conversion

All enum properties SHALL use `.HasConversion<string>()` for string storage, OR `.HasConversion<int>()` for integer storage. Mixing storage types for the same enum across different configurations is prohibited.

#### Scenario: Enum stored as string has conversion configured
- **WHEN** an entity declares `public StatusEnum Status { get; set; }`
- **THEN** the configuration SHALL call `.HasConversion<string>()` or `.HasConversion<int>()` explicitly

#### Scenario: Enum with string conversion is consistent
- **WHEN** an enum uses `.HasConversion<string>()` in one configuration
- **THEN** no other configuration SHALL use `.HasConversion<int>()` for the same enum type

---

### Requirement: JSONB dictionary types shall match entity types

Properties configured as JSONB with `Dictionary<string, TData>` SHALL use the exact data type `TData` declared in the entity.

#### Scenario: JSONB Dictionary uses correct data type
- **WHEN** an entity declares `Dictionary<string, SomeTranslationData>`
- **THEN** the JSONB configuration (HasColumnType, serialization) SHALL use `SomeTranslationData` as the value type
