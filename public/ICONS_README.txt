PWA ICONS NEEDED
=================

Please create the following icon files for the PWA to work properly:

1. icon-192.png (192x192 pixels)
   - Square PNG image with your app logo/icon
   - Should work well as both regular and maskable icon
   - Recommended: Add padding (safe zone) for maskable support

2. icon-512.png (512x512 pixels)
   - Square PNG image with your app logo/icon
   - Same design as 192px version, just larger
   - Should work well as both regular and maskable icon

QUICK SETUP:
You can use any online tool to create these icons:
- https://www.pwabuilder.com/imageGenerator
- https://maskable.app/editor
- Or create manually in any image editor

For now, you can use placeholder icons or emoji-based icons.
Example command to create simple placeholders (requires ImageMagick):
  convert -size 192x192 xc:#3B82F6 -pointsize 100 -gravity center -annotate +0+0 "🎲" icon-192.png
  convert -size 512x512 xc:#3B82F6 -pointsize 300 -gravity center -annotate +0+0 "🎲" icon-512.png



