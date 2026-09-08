# Third-party notices

KaraokAI is distributed under the GPL-3.0-or-later. Its dependencies and
runtime components remain available under their own licenses. This document
identifies the principal components used by the application; their original
license files and notices remain authoritative.

## Desktop application

| Component           | License | Source                                 |
| ------------------- | ------- | -------------------------------------- |
| Electron            | MIT     | https://github.com/electron/electron   |
| React and React DOM | MIT     | https://github.com/facebook/react      |
| Emotion             | MIT     | https://github.com/emotion-js/emotion  |
| TanStack Router     | MIT     | https://github.com/TanStack/router     |
| Vite                | MIT     | https://github.com/vitejs/vite         |
| Lucide              | ISC     | https://github.com/lucide-icons/lucide |
| tar                 | ISC     | https://github.com/isaacs/node-tar     |

Electron and installed Node packages include additional transitive dependencies.
Their license files are retained in the corresponding package distributions.

## Bundled fonts

KaraokAI includes fonts derived from DejaVu/Bitstream Vera. The required font
license is distributed with the application as
`licenses/DejaVu-Fonts-LICENSE.txt` and is available in the source tree at
`src/assets/fonts/LICENSE.txt`.

## Downloaded runtime components

Runtime components are downloaded into the user's selected data directory and
are not bundled in the application installer. Their licenses can differ by
platform, version, and model selection.

| Component              | Primary license                               | Source                                     |
| ---------------------- | --------------------------------------------- | ------------------------------------------ |
| Demucs                 | MIT                                           | https://github.com/facebookresearch/demucs |
| faster-whisper         | MIT                                           | https://github.com/SYSTRAN/faster-whisper  |
| WhisperX               | BSD-2-Clause                                  | https://github.com/m-bain/whisperX         |
| PyTorch and torchaudio | BSD-3-Clause plus bundled third-party notices | https://github.com/pytorch/pytorch         |
| Whisper models         | MIT                                           | https://github.com/openai/whisper          |
| yt-dlp                 | Unlicense                                     | https://github.com/yt-dlp/yt-dlp           |

FFmpeg may be LGPL or GPL depending on the exact binary configuration. The
runtime's FFmpeg build must be audited for every release and distributed with
the matching license, source offer, and notices. In particular, enabling GPL
components such as `libx264` makes the FFmpeg binary GPL.

## Release process

Before publishing a release, maintainers must:

1. generate and review an SBOM/license report for the exact Node and Python
   dependency trees shipped or installed by that release;
2. record the `ffmpeg -version` output and configuration for each supported
   platform;
3. include all applicable license texts, copyright notices, and source offers;
4. verify the license and usage terms of every model offered for download.
