using System;
using System.Net.Http;
using System.Threading.Tasks;

class Program
{
    static async Task Main(string[] args)
    {
        using var client = new HttpClient();
        var response = await client.GetAsync("http://localhost:5182/api/Tours/019da298-e298-74de-8fe8-0f7bcaa0162f");
        var content = await response.Content.ReadAsStringAsync();
        Console.WriteLine(content);
    }
}
