# =========================
# Backend Dockerfile (.NET 8)
# =========================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY BlogSpot.sln .
COPY src/BlogSpot.API/BlogSpot.API.csproj src/BlogSpot.API/
COPY src/BlogSpot.Application/BlogSpot.Application.csproj src/BlogSpot.Application/
COPY src/BlogSpot.Domain/BlogSpot.Domain.csproj src/BlogSpot.Domain/
COPY src/BlogSpot.Infrastructure/BlogSpot.Infrastructure.csproj src/BlogSpot.Infrastructure/

# Restore dependencies
RUN dotnet restore

# Copy everything else
COPY src/ src/

# Build
WORKDIR /src/src/BlogSpot.API
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create uploads directory
RUN mkdir -p wwwroot/uploads

ENTRYPOINT ["dotnet", "BlogSpot.API.dll"]
