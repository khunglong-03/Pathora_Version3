using System.Reflection;
using System.Text.Encodings.Web;
using System.Text.Json;
using Domain.Mails;
using MimeKit;

namespace Infrastructure.Mails;

public interface IMailBodyBuilder
{
    MimeEntity BuildBody(string template, string data);
}

public class MailBodyBuilder : IMailBodyBuilder
{
    private static readonly JsonSerializerOptions JsonSerializerOptions = new()
    {
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    private readonly Dictionary<string, Action<BodyBuilder, string>> _bodyBuilders;

    public MailBodyBuilder()
    {
        _bodyBuilders = typeof(MailEntity)
            .Assembly
            .GetTypes()
            .Where(t =>
                t is { IsClass: true, IsAbstract: false } &&
                t.GetCustomAttribute<MailAttribute>() != null)
            .ToDictionary(GetTemplateKey, CreateGenericBuilder, StringComparer.OrdinalIgnoreCase);
    }

    public MimeEntity BuildBody(string template, string jsonData)
    {
        if (!_bodyBuilders.TryGetValue(template, out var builder))
            throw new NotSupportedException($"Unsupported mail template: {template}");

        var bodyBuilder = new BodyBuilder();
        builder(bodyBuilder, jsonData);
        return bodyBuilder.ToMessageBody();
    }

    private static Action<BodyBuilder, string> CreateGenericBuilder(Type modelType)
    {
        return (builder, body) =>
        {
            var model = JsonSerializer.Deserialize(body, modelType, JsonSerializerOptions)!;
            ConstructGenericMail(builder, modelType, model);
        };
    }

    private static string GetTemplateKey(Type modelType)
    {
        var templateAttr = modelType.GetCustomAttribute<MailAttribute>(inherit: true)
            ?? throw new InvalidOperationException($"Missing MailTemplateAttribute on {modelType.Name}");

        return templateAttr.TemplateName ?? modelType.Name;
    }

    private static void ConstructGenericMail(BodyBuilder builder, Type modelType, object model)
    {
        var templateAttr = modelType.GetCustomAttribute<MailAttribute>(inherit: true);
        if (templateAttr == null)
            throw new InvalidOperationException($"Missing MailTemplateAttribute on {modelType.Name}");

        builder.HtmlBody = MailTemplateService.RenderTemplate(templateAttr.TemplateName ?? modelType.Name, model);
    }
}

