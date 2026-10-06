Add-Type -AssemblyName System.Drawing
$photos = Get-ChildItem -LiteralPath 'frontend/public/images/treks' -Filter *.jpg
$sheet = New-Object System.Drawing.Bitmap 1000,1440
$g = [System.Drawing.Graphics]::FromImage($sheet)
$g.Clear([System.Drawing.Color]::FromArgb(20,40,30))
$font = New-Object System.Drawing.Font 'Arial',10
$i=0
foreach($p in $photos) {
 $im=[System.Drawing.Image]::FromFile($p.FullName)
 $x=($i % 4)*250; $y=[math]::Floor($i/4)*180
 $g.DrawImage($im,$x,$y,250,150)
 $g.DrawString($p.BaseName,$font,[System.Drawing.Brushes]::White,$x+4,$y+153)
 $im.Dispose();$i++
}
$sheet.Save((Join-Path (Get-Location) 'photo-review.jpg'),[System.Drawing.Imaging.ImageFormat]::Jpeg)
$g.Dispose();$sheet.Dispose();$font.Dispose()
