namespace ApiPublic.Models;

public class AppConfig
{
    public string Provider { get; set; } = "OpenAI";
    public OpenAIConfig OpenAI { get; set; } = new();
    public RagConfig Rag { get; set; } = new();
    public OllamaConfig Ollama { get; set; } = new();
    public QdrantConfig Qdrant { get; set; } = new();
}

public class GeminiConfig
{
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "gemini-2.5-flash";
    public string EmbeddingModel { get; set; } = "gemini-embedding-001";
}
public class RagConfig
{
    public int ChunkSize { get; set; } = 800;
    public string Collection { get; set; } = "docs_basic";
}
public class OpenAIConfig
{
    public string ApiKey { get; set; } = string.Empty;
    [ConfigurationKeyName("ChatModel")]
    public string Model { get; set; } = "gpt-5.2";
    public string EmbeddingModel { get; set; } = "text-embedding-3-small";
}

public class OllamaConfig
{
    public string BaseUrl { get; set; } = string.Empty;
    public string EmbeddingModel { get; set; } = "nomic-embed-text";
    public string ChatModel { get; set; } = "llama3";
}

public class QdrantConfig
{
    public string Endpoint { get; set; } = "http://localhost:6333";
    public string Collection { get; set; } = "docs_basic";
}