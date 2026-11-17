# MICTer_coverletter

A self-contained, dependency-free cover letter website for the MICTer manuscript, updated on 13 November 2026.

Open `index.html` directly or serve this folder with `python3 -m http.server 8765 --bind 127.0.0.1`.

The site covers definitive endoderm differentiation, targeted iPSC differentiation, EMT/MET, pancreatic endocrine differentiation and human iPSC cardiac differentiation. The interactive panel follows Figures 2–6 in manuscript order: GSE75748 definitive endoderm (0–96 h, frames every 6 h), targeted iPSC differentiation (day 0–5, 102 frames), EMT/MET (day 7–30, frames every day), GSE114412 pancreatic endocrine (day 0–4, 0.1-day frames) and GSE175634 cardiac differentiation (day 0–7, 0.1-day frames). Particle positions and indicator samples come from model rollouts. The endoderm and EMT/MET caches came from `piuot_run_gaga` (epoch 2000) and `piuot_run_unified` (best checkpoint). The two new panels are stored in `data-pancreatic.js` and `data-cardiac.js`.

The score chart reveals the curve through the current population time.

### Targeted iPSC playback

The 102 snapshots are saved every 0.05 day from day 0 to 5, with one extra snapshot at day 2.325. They come from one Euler SDE rollout of the local GAE15 best checkpoint (seed 42, integration step 0.025 day, 384 particles), projected through the saved Figure 3 UMAP reducer. The plotted score is the existing mean of 32 rollouts.

### Provenance of the two new interactive panels

Both panels use only frozen caches produced by the project's own main-figure pipeline (analysis tree not included in this repository). The 0.1-day frames were re-exported with the same trained model, the same 0.02-day integration grid and the same per-particle bio-clock calibration; the original 0.5-day frames are reused unchanged. Nothing was re-fitted, interpolated or generated in the browser.

| | Pancreatic endocrine (GSE114412) | Cardiac differentiation (GSE175634) |
|---|---|---|
| Reference canvas | fixed GAGA15 UMAP (`X_umap_15_0.1_1.0`), 13,368 observed cells | Stage7 60k GAGA16 UMAP, 8,000-point fixed-seed subsample shown |
| Population frames | 41 frames at 0.1-day spacing (Day 0–4), with 1,196 particles per frame on days 2.0–2.9 and 1,200 elsewhere; `recon2x9_step0p1_pred_points.csv` | 71 frames at 0.1-day spacing (Day 0–7), 1,200 particles each; `recon6row_gaga16_step0p1_umapstage7.csv` |
| Indicator | `I(t) = mean_r [S_r(t)/S_r(0.5)]`, `S_r = 0.05·Action_r + 0.95·Q_phi_r`, 32 rollouts, 141 samples at 0.025-day spacing | same definition, epoch-1000 run, 32 rollouts, 261 samples at 0.025-day spacing |
| Windows / peaks | days 1.125–1.675 and 2.750–3.275; window peaks Day 1.500 (I = 1.122), Day 3.025 (I = 0.594) | days 1.475–2.125 and 2.600–3.525; window peaks Day 1.800 (I = 0.463), Day 3.200 (I = 0.634) |

`I(t0) = 1` exactly: each rollout is divided by its own Day-0.5 value *before* averaging, so the denominator never uses future information. The indicator and the displayed populations are separate cached reconstructions; windows come from the code-detected transition-window tables. The cardiac panel uses the epoch-1000 run, matching the Figure 6 numbers in the manuscript. The build script requires the full analysis tree and is kept outside this repository.

The figure browser displays main Figures 2–6, exported from the saved Illustrator files in `../MICTer图`. Captions match the current manuscript. Supplementary figures are not shown. The results section contains six selected panel crops across five time series, arranged in two rows of three on desktop. Each card links to its full main figure.

Main figures have vector PDF downloads and optimized web previews. The original AI files and 600 dpi manuscript PNGs remain in the separate submission folder and are not included in this repository. Source hashes and display-crop coordinates are recorded in `docs/asset-manifest.json`.

The standalone cover letter is available on the page and in `downloads/scMICTer_cover_letter.txt`. Use the page’s print button to save the letter as PDF.

No external fonts, analytics or data services are used.

The method section uses a single three-stage workflow. Repeated benefit blocks, technical foldouts and formula cards are omitted from this local presentation.

`tools/build_assets.py` is an optional maintainer script. Rebuilding previews requires the original Illustrator export bundle in the adjacent `MICTer图/exports_20261113` directory and Pillow. The checked-in website runs without those source files or Python packages.
