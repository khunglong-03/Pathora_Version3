using ApiPublic.Models;

namespace ApiPublic.Services.Embedding;

public class OllamaEmbeddingProvider(HttpClient http,AppConfig cfg):IEmbeddingProvider
{
    private readonly AppConfig _cfg = cfg;
    private readonly HttpClient _http = http;
    private int? _dim;
    public async Task<float[]> EmbedAsync(string text, CancellationToken ct = default)
    {
        var body = new { model = _cfg.Ollama.EmbeddingModel, input = text };
        var resp=await _http.PostAsJsonAsync("api/embeddings",body, ct);
        var json = await resp.Content.ReadFromJsonAsync<OllamaEmbeddingResponse>(cancellationToken: ct)
            ?? throw new InvalidOperationException("Ollama embedding response was empty.");
        var vec = json.Embedding;
        _dim??= vec.Length;
        return vec;
    }

    public async Task<int> GetDimAsync(CancellationToken ct = default)
    {
        if (_dim.HasValue) return _dim.Value;
        _ = await EmbedAsync("dimension probe", ct);
        return _dim!.Value;
    }

    private sealed record OllamaEmbeddingResponse(float[] Embedding);
}
