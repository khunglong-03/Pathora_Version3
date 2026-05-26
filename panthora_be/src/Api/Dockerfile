# syntax=docker/dockerfile:1.7

# Stage 1: Build + Publish (single SDK pass — publish builds too)
FROM mcr.microsoft.com/dotnet/sdk:10.0.102-noble AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY ["Directory.Packages.props", "Directory.Build.props", "nuget.config", "./"]
COPY ["src/Api/Api.csproj", "src/Api/"]
COPY ["src/Application/Application.csproj", "src/Application/"]
COPY ["src/Domain/Domain.csproj", "src/Domain/"]
COPY ["src/Infrastructure/Infrastructure.csproj", "src/Infrastructure/"]
COPY ["Share/BuildingBlocks/BuildingBlocks.csproj", "Share/BuildingBlocks/"]
COPY ["Share/Common/Common.csproj", "Share/Common/"]
COPY ["Share/Contracts/Contracts.csproj", "Share/Contracts/"]

RUN --mount=type=cache,id=nuget,target=/root/.nuget/packages,sharing=locked \
    dotnet restore "src/Api/Api.csproj"

COPY . .
RUN --mount=type=cache,id=nuget,target=/root/.nuget/packages,sharing=locked \
    dotnet publish "src/Api/Api.csproj" \
        -c $BUILD_CONFIGURATION \
        -o /app/publish \
        --no-restore \
        /p:UseAppHost=false

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0.2-noble AS final
WORKDIR /app
EXPOSE 8080

# Kerberos/GSSAPI for Redis SSL + curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
        libkrb5-3 \
        libgssapi-krb5-2 \
        curl \
    && rm -rf /var/lib/apt/lists/*

COPY --chown=app:app --from=build /app/publish .

USER app

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/health/live || exit 1

ENTRYPOINT ["dotnet", "Api.dll"]
