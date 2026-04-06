# Stage 1: Runtime (Nhân chạy thực tế)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8899
EXPOSE 8891

# Install Kerberos/GSSAPI libs required for Redis SSL + curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    libkrb5-3 \
    libgssapi-krb5-2 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Stage 2: Build (Giai đoạn xây dựng)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY ["Directory.Packages.props", "."]
COPY ["Directory.Build.props", "."]
COPY ["nuget.config", "."]

COPY ["src/Api/Api.csproj", "src/Api/"]
COPY ["src/Application/Application.csproj", "src/Application/"]
COPY ["Share/BuildingBlocks/BuildingBlocks.csproj", "Share/BuildingBlocks/"]
COPY ["Share/Common/Common.csproj", "Share/Common/"]
COPY ["Share/Contracts/Contracts.csproj", "Share/Contracts/"]
COPY ["src/Domain/Domain.csproj", "src/Domain/"]
COPY ["src/Infrastructure/Infrastructure.csproj", "src/Infrastructure/"]

RUN dotnet restore "./src/Api/Api.csproj"

COPY . .
WORKDIR "/src/src/Api"
RUN dotnet build "./Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

# Stage 3: Publish
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# Stage 4: Final (Bàn giao)
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8899/health/live || exit 1
ENTRYPOINT ["dotnet", "Api.dll"]
