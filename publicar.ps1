# Publica la carpeta completa en https://gconsacs-hash.github.io/forja-cartas/
#
#   powershell -ExecutionPolicy Bypass -File publicar.ps1
#
# No hace falta tener git instalado: sube todo en un solo commit usando la API
# de GitHub a traves de "gh" (GitHub CLI), que ya esta autenticado en este PC.
# Antes de publicar, sube el numero de VERSION en sw.js para que los celulares
# que ya tengan la app instalada reciban los cambios.

$ErrorActionPreference = 'Stop'
$owner = 'gconsacs-hash'
$repo = 'forja-cartas'
$raiz = $PSScriptRoot

function ApiConCuerpo($metodo, $ruta, $objeto, $profundidad) {
  $json = $objeto | ConvertTo-Json -Depth $profundidad -Compress
  $tmp = [IO.Path]::GetTempFileName()
  [IO.File]::WriteAllText($tmp, $json, [Text.UTF8Encoding]::new($false))
  try {
    return (gh api --method $metodo $ruta --input $tmp) | ConvertFrom-Json
  } finally {
    Remove-Item $tmp -Force
  }
}

$archivos = Get-ChildItem -Path $raiz -Recurse -File |
  Where-Object { $_.FullName -notmatch '\\\.git\\' -and $_.Name -ne '.DS_Store' }

Write-Host ("Subiendo " + $archivos.Count + " archivos...")

$entradas = @()
foreach ($a in $archivos) {
  $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($a.FullName))
  $blob = ApiConCuerpo 'POST' "repos/$owner/$repo/git/blobs" @{ content = $b64; encoding = 'base64' } 3
  $ruta = $a.FullName.Substring($raiz.Length + 1).Replace('\', '/')
  $entradas += @{ path = $ruta; mode = '100644'; type = 'blob'; sha = $blob.sha }
  Write-Host ("  " + $ruta)
}

$ref = (gh api "repos/$owner/$repo/git/ref/heads/main") | ConvertFrom-Json
$padre = $ref.object.sha
$padreCommit = (gh api "repos/$owner/$repo/git/commits/$padre") | ConvertFrom-Json

$arbol = ApiConCuerpo 'POST' "repos/$owner/$repo/git/trees" @{
  base_tree = $padreCommit.tree.sha
  tree = $entradas
} 10

$mensaje = 'Actualizacion de Forja de Cartas ' + (Get-Date -Format 'yyyy-MM-dd HH:mm')
$commit = ApiConCuerpo 'POST' "repos/$owner/$repo/git/commits" @{
  message = $mensaje
  tree = $arbol.sha
  parents = @($padre)
} 5

ApiConCuerpo 'PATCH' "repos/$owner/$repo/git/refs/heads/main" @{ sha = $commit.sha } 3 | Out-Null

Write-Host ''
Write-Host 'Listo. En un par de minutos queda publicado en:'
Write-Host '  https://gconsacs-hash.github.io/forja-cartas/'
