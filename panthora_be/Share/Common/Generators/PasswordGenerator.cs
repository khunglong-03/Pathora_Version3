using System.Security.Cryptography;
using System.Text;

namespace Common.Generators;

public static class PasswordGenerator
{
    private const string Lower = "abcdefghijklmnopqrstuvwxyz";
    private const string Upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private const string Digits = "0123456789";
    private const string Symbols = "!@#$";

    public static string Generate(int length = 12, bool useSymbols = true)
    {
        if (length < 4) throw new ArgumentException("Password length must be at least 4.");

        var charSets = new[] { Lower, Upper, Digits };
        if (useSymbols) charSets = charSets.Append(Symbols).ToArray();

        var allChars = string.Concat(charSets);
        var password = new StringBuilder();

        foreach (var set in charSets)
        {
            password.Append(GetRandomChar(set));
        }

        for (var i = password.Length; i < length; i++)
        {
            password.Append(GetRandomChar(allChars));
        }

        return Shuffle(password.ToString());
    }

    private static char GetRandomChar(string chars)
    {
        var index = RandomNumberGenerator.GetInt32(chars.Length);
        return chars[index];
    }

    private static string Shuffle(string input)
    {
        var chars = input.ToCharArray();
        for (var i = chars.Length - 1; i > 0; i--)
        {
            var j = RandomNumberGenerator.GetInt32(i + 1);
            (chars[i], chars[j]) = (chars[j], chars[i]);
        }

        return new string(chars);
    }
}
