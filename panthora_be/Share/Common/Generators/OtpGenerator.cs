using System.Security.Cryptography;
using System.Text;

namespace Common.Generators;

public class OtpGenerator
{
    private const string Digits = "0123456789";

    public static string Generate(int length = 6)
    {
        if (length <= 0)
            throw new ArgumentOutOfRangeException(nameof(length), "Length must be greater than 0");

        var sb = new StringBuilder(length);
        for (int i = 0; i < length; i++)
        {
            sb.Append(GetRandomDigit());
        }

        return sb.ToString();
    }

    private static char GetRandomDigit()
    {
        var index = RandomNumberGenerator.GetInt32(Digits.Length);
        return Digits[index];
    }
}
