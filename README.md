# MICTer_coverletter

A self-contained, dependency-free cover letter website for the MICTer manuscript, updated on 13 November 2026.

Open `index.html` directly or serve this folder with `python3 -m http.server 8765 --bind 127.0.0.1`.

The site covers definitive endoderm differentiation, targeted iPSC differentiation, EMT/MET, pancreatic endocrine differentiation and human iPSC cardiac differentiation. The interactive panel switches between three cached examples: the existing targeted iPSC population and score data, GSE75748 definitive endoderm (0–96 h, 300 frames at 0.32-hour spacing) and EMT/MET (day 7.5–30 after a 0.5-day warm-up, 100 frames at 0.23-day spacing; the cached indicator uses a strictly causal trailing 2.5-day window, normalizes each of the 32 rollouts to its own day-7 value, and then averages the normalized curves). The two added datasets were produced by forward rollouts of the already trained models; no retraining, new experiments or manuscript edits were performed. Their sources are `piuot_run_gaga` (epoch 2000) and `piuot_run_unified` (best checkpoint), with the cached data stored in `data-endoderm.js` and `data-emt-met.js`.

The figure browser displays main Figures 2–6, exported from the saved Illustrator files in `../MICTer图`. Captions match the current manuscript. Supplementary figures are not shown. The results section contains six selected panel crops across five time series, arranged in two rows of three on desktop. Each card links to its full main figure.

Main figures have vector PDF downloads and optimized web previews. The original AI files and 600 dpi manuscript PNGs remain in the separate submission folder and are not included in this repository. Source hashes and display-crop coordinates are recorded in `docs/asset-manifest.json`.

The standalone cover letter is available on the page and in `downloads/scMICTer_cover_letter.txt`. Use the page’s print button to save the letter as PDF.

No external fonts, analytics or data services are used.

The method section uses a single three-stage workflow. Repeated benefit blocks, technical foldouts and formula cards are omitted from this local presentation.

`tools/build_assets.py` is an optional maintainer script. Rebuilding previews requires the original Illustrator export bundle in the adjacent `MICTer图/exports_20261113` directory and Pillow. The checked-in website runs without those source files or Python packages.
