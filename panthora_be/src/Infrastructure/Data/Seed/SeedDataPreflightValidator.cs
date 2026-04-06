using System.Text;
using System.Text.Json;

namespace Infrastructure.Data.Seed;

internal static class SeedDataPreflightValidator
{
    public static void ValidateRequiredSeedFiles(string? basePath = null)
    {
        var issues = new List<SeedPreflightIssue>();

        // Phase 1: Structural validation (existing behavior)
        foreach (var definition in SeedFileManifest.Definitions)
        {
            var result = SeedDataLoader.ValidateSeedFile(definition.FileName, definition.RequiredFields, basePath);
            if (result.IsValid)
            {
                continue;
            }

            issues.AddRange(result.Issues.Select(issue =>
                new SeedPreflightIssue(
                    definition.ContextSeedClass,
                    result.FilePath,
                    issue.ItemIndex,
                    issue.Message)));
        }

        if (issues.Count > 0)
        {
            throw new InvalidOperationException(BuildFailureMessage(issues));
        }

        // Phase 2: Duplicate ID validation
        ValidateDuplicateIds(basePath, issues);

        if (issues.Count > 0)
        {
            throw new InvalidOperationException(BuildFailureMessage(issues));
        }

        // Phase 3: Cross-file reference validation
        ValidateCrossFileReferences(basePath, issues);

        if (issues.Count > 0)
        {
            throw new InvalidOperationException(BuildFailureMessage(issues));
        }
    }

    private static void ValidateDuplicateIds(string? basePath, List<SeedPreflightIssue> issues)
    {
        var repoRoot = ResolveRepositoryRoot(basePath);
        var seedDataDir = Path.Combine(repoRoot, "src", "Infrastructure", "Data", "Seed", "Seeddata");

        foreach (var definition in SeedFileManifest.Definitions)
        {
            if (string.IsNullOrEmpty(definition.IdField))
            {
                continue; // Skip relationship-only files without IDs
            }

            var filePath = Path.Combine(seedDataDir, definition.FileName);
            if (!File.Exists(filePath))
            {
                continue;
            }

            var json = File.ReadAllText(filePath).Trim();
            if (string.IsNullOrEmpty(json) || json == "[]")
            {
                continue; // Skip empty files
            }

            using var document = JsonDocument.Parse(json);
            var arrayRoot = document.RootElement.ValueKind == JsonValueKind.Array
                ? document.RootElement
                : document.RootElement.GetProperty("data");

            var idValues = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            var index = 0;

            foreach (var item in arrayRoot.EnumerateArray())
            {
                if (item.TryGetProperty(definition.IdField, out var idProp))
                {
                    var id = idProp.ValueKind == JsonValueKind.String
                        ? idProp.GetString()
                        : idProp.ToString();

                    if (!string.IsNullOrEmpty(id))
                    {
                        if (idValues.TryGetValue(id, out var existingIndex))
                        {
                            issues.Add(new SeedPreflightIssue(
                                definition.ContextSeedClass,
                                definition.FileName,
                                index,
                                $"Duplicate ID '{id}' found (first occurrence at index {existingIndex})."));
                        }
                        else
                        {
                            idValues[id] = index;
                        }
                    }
                }
                index++;
            }
        }
    }

    private static void ValidateCrossFileReferences(string? basePath, List<SeedPreflightIssue> issues)
    {
        var repoRoot = ResolveRepositoryRoot(basePath);
        var seedDataDir = Path.Combine(repoRoot, "src", "Infrastructure", "Data", "Seed", "Seeddata");

        // Build lookup tables for all ID-bearing files
        var idLookups = BuildIdLookups(seedDataDir);

        // Validate each file's reference fields
        foreach (var definition in SeedFileManifest.Definitions)
        {
            if (definition.ReferenceFields == null || definition.ReferenceFields.Count == 0)
            {
                continue;
            }

            var filePath = Path.Combine(seedDataDir, definition.FileName);
            if (!File.Exists(filePath))
            {
                continue;
            }

            var json = File.ReadAllText(filePath).Trim();
            if (string.IsNullOrEmpty(json) || json == "[]")
            {
                continue;
            }

            using var document = JsonDocument.Parse(json);
            var arrayRoot = document.RootElement.ValueKind == JsonValueKind.Array
                ? document.RootElement
                : document.RootElement.GetProperty("data");

            var index = 0;
            foreach (var item in arrayRoot.EnumerateArray())
            {
                foreach (var refField in definition.ReferenceFields)
                {
                    if (!item.TryGetProperty(refField, out var refProp) || refProp.ValueKind == JsonValueKind.Null)
                    {
                        // Skip null references - they may be optional
                        continue;
                    }

                    var refValue = refProp.ValueKind == JsonValueKind.String
                        ? refProp.GetString()
                        : refProp.ToString();

                    if (string.IsNullOrEmpty(refValue))
                    {
                        continue;
                    }

                    // Find which file this reference should point to
                    var targetFile = FindReferencedFile(refField, definition.FileName);
                    if (targetFile == null)
                    {
                        continue;
                    }

                    if (!idLookups.TryGetValue(targetFile, out var targetIds) ||
                        !targetIds.Contains(refValue))
                    {
                        issues.Add(new SeedPreflightIssue(
                            definition.ContextSeedClass,
                            definition.FileName,
                            index,
                            $"Invalid reference '{refField}': '{refValue}' does not exist in '{targetFile}'."));
                    }
                }
                index++;
            }
        }
    }

    private static Dictionary<string, HashSet<string>> BuildIdLookups(string seedDataDir)
    {
        var lookups = new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase);

        foreach (var definition in SeedFileManifest.Definitions)
        {
            if (string.IsNullOrEmpty(definition.IdField))
            {
                continue;
            }

            var filePath = Path.Combine(seedDataDir, definition.FileName);
            if (!File.Exists(filePath))
            {
                continue;
            }

            var json = File.ReadAllText(filePath).Trim();
            if (string.IsNullOrEmpty(json) || json == "[]")
            {
                continue;
            }

            var ids = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            try
            {
                using var document = JsonDocument.Parse(json);
                var arrayRoot = document.RootElement.ValueKind == JsonValueKind.Array
                    ? document.RootElement
                    : document.RootElement.GetProperty("data");

                foreach (var item in arrayRoot.EnumerateArray())
                {
                    if (item.TryGetProperty(definition.IdField, out var idProp))
                    {
                        var id = idProp.ValueKind == JsonValueKind.String
                            ? idProp.GetString()
                            : idProp.ToString();

                        if (!string.IsNullOrEmpty(id))
                        {
                            ids.Add(id);
                        }
                    }
                }
            }
            catch
            {
                // Skip files that can't be parsed
            }

            if (ids.Count > 0)
            {
                lookups[definition.FileName] = ids;
            }
        }

        return lookups;
    }

    private static string? FindReferencedFile(string referenceField, string sourceFile)
    {
        // Map reference fields to their target files (only for remaining seed files)
        var referenceMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            // UserRole -> User and Role references
            { "UserId", "user.json" },
            { "RoleId", "role.json" },
        };

        return referenceMap.TryGetValue(referenceField, out var targetFile) ? targetFile : null;
    }

    private static string ResolveRepositoryRoot(string? basePath)
    {
        if (!string.IsNullOrEmpty(basePath))
        {
            return basePath;
        }

        var current = AppContext.BaseDirectory;
        var directory = new DirectoryInfo(current);

        while (directory != null)
        {
            var solutionFile = Path.Combine(directory.FullName, "LocalService.slnx");
            if (File.Exists(solutionFile))
            {
                return directory.FullName;
            }

            directory = directory.Parent;
        }

        throw new InvalidOperationException("Could not resolve repository root for seed validation.");
    }

    private static string BuildFailureMessage(IReadOnlyList<SeedPreflightIssue> issues)
    {
        var builder = new StringBuilder();
        builder.AppendLine("Seed preflight validation failed. Please fix the following seed data issues:");

        foreach (var issue in issues)
        {
            var itemPart = issue.ItemIndex.HasValue ? $" [item index: {issue.ItemIndex}]" : string.Empty;
            builder.AppendLine($"- {issue.ContextSeedClass} -> {issue.FilePath}{itemPart}: {issue.Message}");
        }

        return builder.ToString();
    }
}

internal sealed record SeedPreflightIssue(
    string ContextSeedClass,
    string FilePath,
    int? ItemIndex,
    string Message);
