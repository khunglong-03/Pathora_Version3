namespace Domain.Mails;

[Mail("Thông báo đăng kí thành công")]
public record NotifyNewUserMail(string Email, string Password);

