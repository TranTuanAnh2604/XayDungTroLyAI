# 1. Dùng SDK .NET 10 để build code (ĐÃ CẬP NHẬT)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build-env
WORKDIR /app

# Copy file dự án vào để khôi phục các gói thư viện NuGet
COPY *.csproj ./
RUN dotnet restore

# Copy toàn bộ đống code còn lại và biên dịch ra thư mục 'out'
COPY . ./
RUN dotnet publish -c Release -o out

# 2. Tạo ảnh chạy (Runtime) siêu nhẹ bản .NET 10 (ĐÃ CẬP NHẬT)
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build-env /app/out .

# Cấu hình cổng chạy trong mạng ảo của Render
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# Kích hoạt chạy file hệ thống
ENTRYPOINT ["dotnet", "Assistant.dll"]