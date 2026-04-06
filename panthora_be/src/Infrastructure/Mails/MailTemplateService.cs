using System.Text;
using System.Text.RegularExpressions;
using Scriban;

namespace Infrastructure.Mails;

public static partial class MailTemplateService
{
    private static readonly Dictionary<string, Template> Templates;

    [GeneratedRegex(@"\.html$", RegexOptions.IgnoreCase, "en-US")]
    private static partial Regex TemplateRegex();

    static MailTemplateService()
    {
        var templates = new Dictionary<string, Template>();

        var assembly = typeof(MailTemplateService).Assembly;
        foreach (var resourceName in assembly
                     .GetManifestResourceNames()
                     .Where(resourceName => TemplateRegex().IsMatch(resourceName)))
        {
            var templateName = resourceName.Split('.')[^2];

            using var stream = assembly.GetManifestResourceStream(resourceName);
            if (stream == null) continue;

            using var reader = new StreamReader(stream, Encoding.UTF8);
            var templateContent = reader.ReadToEnd();

            templates[templateName] = Template.Parse(templateContent);
        }

        Templates = templates;
    }


    public static string RenderTemplate(string templateName, object model)
    {
        if (!Templates.TryGetValue(templateName, out var template))
        {
            throw new ArgumentException($"Template {templateName} not found", nameof(templateName));
        }

        return template.Render(model);
    }
}

