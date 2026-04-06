using System.Text.Encodings.Web;
using System.Text.Json;

namespace Domain.Mails;

public static class MailExtensions
{
    private static readonly JsonSerializerOptions JsonSerializerOptions = new()
    {
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    public static MailEntity ToMail<T>(this T model, string to, string? from = null)
    {
        var type = typeof(T);
        var attr = type
            .GetCustomAttributes(typeof(MailAttribute), true)
            .FirstOrDefault() as MailAttribute;

        if (attr == null)
            throw new InvalidOperationException($"Missing MailTemplateAttribute on type {typeof(T).Name}");

        return new MailEntity
        {
            To = to,
            Subject = attr.Subject,
            Body = JsonSerializer.Serialize(model, JsonSerializerOptions),
            Template = attr.TemplateName ?? type.Name
        };
    }
}

