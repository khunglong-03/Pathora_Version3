namespace Domain.Mails;

[AttributeUsage(AttributeTargets.Class)]
public class MailAttribute : Attribute
{
    public string Subject { get; set; }
    public string? TemplateName { get; set; }

    public MailAttribute(string subject, string? templateName = null)
    {
        Subject = subject;
        TemplateName = templateName;
    }
}

