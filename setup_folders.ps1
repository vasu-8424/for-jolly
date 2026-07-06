$folders = @(
  "src\app\(auth)\login",
  "src\app\(auth)\forgot-password",
  "src\app\(dashboard)\analytics",
  "src\app\(dashboard)\banners",
  "src\app\(dashboard)\categories",
  "src\app\(dashboard)\cms",
  "src\app\(dashboard)\coupons",
  "src\app\(dashboard)\customers",
  "src\app\(dashboard)\dashboard",
  "src\app\(dashboard)\homepage",
  "src\app\(dashboard)\notifications",
  "src\app\(dashboard)\orders",
  "src\app\(dashboard)\products",
  "src\app\(dashboard)\profile",
  "src\app\(dashboard)\reports",
  "src\app\(dashboard)\settings",
  "src\app\api",
  "src\assets",
  "src\components\charts",
  "src\components\forms",
  "src\components\shared",
  "src\components\tables",
  "src\components\ui",
  "src\config",
  "src\constants",
  "src\hooks",
  "src\lib",
  "src\providers",
  "src\repositories",
  "src\services",
  "src\styles",
  "src\types",
  "src\utils"
)

foreach ($folder in $folders) {
  New-Item -ItemType Directory -Force -Path $folder
}
