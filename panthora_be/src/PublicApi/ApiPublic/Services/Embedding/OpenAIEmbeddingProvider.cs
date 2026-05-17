using OpenAI.Embeddings;

namespace ApiPublic.Services.Embedding;

public class OpenAIEmbeddingProvider(EmbeddingClient client) : IEmbeddingProvider
{
    private int? _dim;

    public async Task<float[]> EmbedAsync(string text, CancellationToken ct = default)
    {
        var result = await client.GenerateEmbeddingAsync(text, cancellationToken: ct);
        var vec = result.Value.ToFloats().ToArray();
        _dim ??= vec.Length;
        return vec;
    }

    public async Task<int> GetDimAsync(CancellationToken ct = default)
    {
        if (_dim.HasValue) return _dim.Value;
        _ = await EmbedAsync("dimension probe", ct);
        return _dim!.Value;
    }
}