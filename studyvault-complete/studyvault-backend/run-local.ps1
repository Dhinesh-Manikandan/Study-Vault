$ErrorActionPreference = 'Stop'

function Set-Env-Default($name, $value) {
    $current = [Environment]::GetEnvironmentVariable($name, 'Process')
    if ([string]::IsNullOrWhiteSpace($current)) {
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
}

Write-Host "Starting StudyVault backend (non-interactive local mode)..." -ForegroundColor Cyan
Write-Host "Using process env values when present; otherwise applying run-local defaults." -ForegroundColor Yellow

Set-Env-Default 'SPRING_DATASOURCE_URL' 'jdbc:postgresql://aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0'
Set-Env-Default 'SPRING_DATASOURCE_USERNAME' 'postgres.migeuxqmrcwhstifeysn'
Set-Env-Default 'SPRING_DATASOURCE_PASSWORD' 'Dhinesh@2006'
Set-Env-Default 'APP_JWT_SECRET' 'studyvault-local-development-secret-key-change-me-32-chars-min'
Set-Env-Default 'CLOUDINARY_CLOUD_NAME' 'dicoep2fp'
Set-Env-Default 'CLOUDINARY_API_KEY' '316156517946668'
Set-Env-Default 'CLOUDINARY_API_SECRET' 'W7vR-64eeH6273jKGwVANSHLY1s'
Set-Env-Default 'APP_CORS_ALLOWED_ORIGINS' 'http://localhost:3000,http://localhost:3001'
Set-Env-Default 'APP_JWT_EXPIRATION_MS' '604800000'

Write-Host "Datasource URL: $([Environment]::GetEnvironmentVariable('SPRING_DATASOURCE_URL', 'Process'))" -ForegroundColor DarkGray
Write-Host "Datasource user: $([Environment]::GetEnvironmentVariable('SPRING_DATASOURCE_USERNAME', 'Process'))" -ForegroundColor DarkGray

Set-Location $PSScriptRoot
mvn spring-boot:run
