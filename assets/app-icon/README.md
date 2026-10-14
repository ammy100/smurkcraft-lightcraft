# Smurkcraft app icon

A **nine-tailed kitsune with a brow diamond**: an engraving portrait, seated, looking back at the
viewer, in the original project's icon-template framing (full-bleed field, head and body filling the
tile, tails running off the edges).

## Palette

Exactly three colours:

| Colour | Hex | Used for |
|---|---|---|
| Ink | `#0b0b0c` | line work and contours |
| Paper | `#efe9dc` | the figure |
| Smurkcraft blue (app colour) | `#2f7bf5` | the full-bleed field |

## Geometry

A 512-unit tile (`viewBox="0 0 512 512"`), rounded square with `rx=112`, no border. The macOS
renders pad it onto Apple's 824/1024 icon grid; the Windows and Linux renders crop 22 units off
each side so the figure reads at 16–48 px.

## Provenance

This artwork was originally created for PhotoCraft by its original project owner and is reused
under the license in `LICENSE.txt`. The source PNG is maintained in the original project's
`craftrules` repository; this fork renames the derived icon files but does not claim authorship.

## Files

- `smurkcraft.svg`: canonical master (traced at 2048 px).
- `smurkcraft-small.svg`: lighter trace (traced at 1024 px); also the hicolor scalable icon.
- `smurkcraft-1024.png`: 1024 px render on the macOS grid.
- `smurkcraft.icns`: macOS bundle icon (`CFBundleIconFile`).
- `smurkcraft.ico`: Windows icon, 16–256 px, embedded in the `.exe` by `apps/smurkcraft-lightcraft/build.rs`.
- `hicolor/<size>/apps/io.github.ammy100.smurkcraft.lightcraft.png` (16–512) and `hicolor/scalable/...svg`:
  Linux icon theme.

The app also sets the window icon and Wayland app ID at runtime (`apps/smurkcraft-lightcraft/src/main.rs`).
On Windows the taskbar shows the icon of the Start Menu shortcut that launches the
exe, so the MSI's `<Icon Id>` keeps the `.exe` extension (ICE50); `app_icon.rs` documents the
details and tests the `.ico` sizes and the WiX icon references.

## Regenerate

Replace `smurkcraft.svg` (and `smurkcraft-small.svg`), then run `packaging/icons.sh`. It needs
`resvg`, plus `iconutil` on macOS; the `.ico` is packed by `cargo xtask ico`.
