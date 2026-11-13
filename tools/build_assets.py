"""Refresh main previews from the current saved Illustrator export bundle."""
from pathlib import Path
import shutil
from PIL import Image
SITE=Path(__file__).resolve().parents[1]
EXPORT=SITE.parent/'MICTer图/exports_20261113'
if not EXPORT.exists():EXPORT=SITE.parent/'投稿/MICTer图/exports_20261113'
for n in range(2,7):
    image=Image.open(EXPORT/'png'/f'figure{n}.png').convert('RGB')
    image.thumbnail((2800,2800))
    image.save(SITE/'assets/figures'/f'figure{n}.webp',quality=94,method=6)
    shutil.copy2(EXPORT/'pdf'/f'figure{n}.pdf',SITE/'assets/pdfs'/f'figure{n}.pdf')
print('Refreshed main figure previews and PDFs. Caption updates follow the manuscript.')
