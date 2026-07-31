<#
  단일 파일 배포본 생성기
  ------------------------------------------------------------------
  index.html + assets/css + assets/js + assets/images 를 하나로 묶어
  dist/index.standalone.html 을 만듭니다.

  실행:  powershell -ExecutionPolicy Bypass -File build.ps1

  왜 필요한가
    · GitHub Pages 나 로컬 서버 없이 파일 하나만 열어 볼 때 씁니다.
    · CSS · JS · 이미지가 전부 인라인이라 외부 요청이 0 입니다
      (웹폰트 CDN 두 곳만 예외).
#>
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$enc  = New-Object System.Text.UTF8Encoding($false)

function ToDataUri([string]$relPath) {
  $full = Join-Path $root $relPath
  if (-not (Test-Path -LiteralPath $full)) { throw "이미지를 찾을 수 없습니다: $relPath" }
  $ext  = [System.IO.Path]::GetExtension($full).TrimStart('.').ToLower()
  $mime = if ($ext -eq 'svg') { 'image/svg+xml' } else { "image/$ext" }
  return "data:$mime;base64," + [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($full))
}

$css = [System.IO.File]::ReadAllText((Join-Path $root 'assets\css\style.css'))
$js  = [System.IO.File]::ReadAllText((Join-Path $root 'assets\js\script.js'))
$html = [System.IO.File]::ReadAllText((Join-Path $root 'index.html'))

# CSS · JS 인라인
$html = $html -replace '(?m)^\s*<link rel="stylesheet" href="assets/css/style\.css" />\s*$', ("<style>`n" + $css.Replace('$','$$') + "`n</style>")
$html = $html -replace '(?m)^\s*<script src="assets/js/script\.js"></script>\s*$',            ("<script>`n" + $js.Replace('$','$$')  + "`n</script>")

# 홈 시안 링크 — dist/ 안에서 열리므로 한 단계 위로 올려 준다
$html = $html.Replace('href="samples/home.html"', 'href="../samples/home.html"')

# 이미지 인라인 — 경로가 긴 것부터 치환해야 짧은 경로에 잡아먹히지 않습니다
$images = @(
  'assets/images/logo/logo-dark.png',
  'assets/images/logo/logo.png',
  'assets/images/favicon.png'
)
foreach ($img in $images) { $html = $html.Replace($img, (ToDataUri $img.Replace('/','\'))) }

$out = Join-Path $root 'dist\index.standalone.html'
if (-not (Test-Path -LiteralPath (Split-Path $out))) { New-Item -ItemType Directory -Path (Split-Path $out) | Out-Null }
[System.IO.File]::WriteAllText($out, $html, $enc)

# 검증 — 남은 로컬 참조가 있으면 인라인이 빠진 것입니다
$left = ([regex]::Matches($html, '(?:src|href)="(?!https?:|data:|#|\.\./samples/)[^"]+"')).Count
$kb   = [math]::Round(([System.IO.File]::ReadAllBytes($out)).Length / 1KB, 1)
Write-Host ("dist/index.standalone.html  {0} KB  ·  남은 외부 참조 {1}건" -f $kb, $left)
if ($left -ne 0) { throw "인라인되지 않은 로컬 참조가 남아 있습니다. (samples/ 로 나가는 페이지 링크는 자산이 아니므로 제외됩니다)" }
