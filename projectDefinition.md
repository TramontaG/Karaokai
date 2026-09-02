# KaraokAI — Especificação Técnica e de Produto

**Status:** Draft / MVP Specification
**Plataformas:** Windows, Linux e macOS
**Arquitetura:** Tauri 2 + React/TypeScript + Rust + Python ML Worker
**Princípio central:** processamento 100% local, offline após instalação dos componentes e independente das dependências instaladas no sistema.

---

## 1. Visão do produto

KaraokAI é uma aplicação desktop multiplataforma capaz de transformar automaticamente uma música em um projeto de karaoke.

O usuário fornece um arquivo de áudio e o aplicativo:

1. separa os vocais do instrumental;
2. transcreve os vocais;
3. identifica timestamps das palavras;
4. gera automaticamente a letra sincronizada;
5. permite corrigir texto e sincronização;
6. permite personalizar a aparência do karaoke;
7. reproduz uma prévia em tempo real;
8. renderiza um vídeo final;
9. exporta a letra sincronizada para formatos externos.

Todo o processamento principal deve ocorrer **localmente**, sem necessidade de upload da música ou pagamento de APIs externas.

---

# 2. Objetivos

## 2.1 Objetivos principais

- Gerar karaoke automaticamente a partir de arquivos de música.
- Obter separação de vocal com boa qualidade.
- Gerar timestamps em nível de palavra.
- Permitir correções manuais.
- Criar vídeos de karaoke personalizados.
- Permitir backgrounds em vídeo ou imagem.
- Permitir customização completa da aparência da letra.
- Funcionar em Windows, Linux e macOS.
- Utilizar aceleração de hardware quando disponível.
- Funcionar offline após o download dos componentes necessários.
- Não exigir Python, FFmpeg, CUDA Toolkit ou ferramentas semelhantes instaladas pelo usuário.

## 2.2 Objetivos secundários

A arquitetura deverá permitir futuramente:

- separação em múltiplos stems;
- modo de estudo musical;
- remoção seletiva de instrumentos;
- editor avançado de vídeo;
- templates compartilháveis;
- processamento em lote;
- plugins;
- novos modelos de IA;
- novos renderizadores;
- novos formatos de exportação.

---

# 3. Experiência principal

O fluxo padrão será:

```text
Selecionar música
      ↓
Analisar arquivo
      ↓
Separar stems
      ↓
Transcrever vocal
      ↓
Alinhar palavras
      ↓
Gerar projeto
      ↓
Editar / Personalizar
      ↓
Preview
      ↓
Renderizar
      ↓
MP4
```

O objetivo é que, no fluxo ideal, o usuário possa simplesmente:

```text
Arrastar música
      ↓
"Gerar Karaoke"
      ↓
esperar processamento
      ↓
▶ Reproduzir
```

---

# 4. Stack

## Desktop

- Tauri 2
- Rust

Responsabilidades:

- lifecycle da aplicação;
- filesystem;
- gerenciamento de processos;
- gerenciamento do ML Worker;
- gerenciamento dos runtimes;
- downloads;
- cache;
- atualizações;
- segurança;
- comunicação com o sistema operacional;
- renderização/exportação;
- futuramente, engine nativa de áudio.

## Frontend

- React
- TypeScript
- Vite
- Prettier

Responsabilidades:

- UI;
- player;
- editor de letras;
- editor visual;
- timeline;
- biblioteca;
- configurações;
- gerenciamento de modelos;
- feedback de progresso.

### Formatação

O frontend utilizará **Prettier** para formatação consistente do código.

- A configuração do projeto ficará em `prettier.config.mjs` na raiz do repositório.
- O arquivo será a fonte de verdade para as regras de formatação.
- As regras específicas serão definidas e mantidas pelo projeto.

## ML Worker

Python isolado contendo:

- Demucs;
- faster-whisper;
- WhisperX ou outro forced aligner;
- PyTorch;
- CTranslate2;
- demais dependências ML.

O Python do sistema **não deverá ser utilizado**.

## Media

- FFmpeg privado da aplicação.

## Render

### MVP

- ASS
- FFmpeg

### Futuro

Renderer próprio baseado em:

- Rust;
- Skia, wgpu ou tecnologia equivalente;
- FFmpeg exclusivamente como encoder/muxer.

---

# 5. Arquitetura geral

```text
┌──────────────────────────────────────┐
│               React                  │
│                                      │
│ Player                               │
│ Lyrics Editor                        │
│ Timeline                             │
│ Style Editor                         │
│ Library                              │
│ Settings                             │
└──────────────────┬───────────────────┘
                   │
               Tauri IPC
                   │
┌──────────────────▼───────────────────┐
│                Rust                  │
│                                      │
│ Runtime Manager                      │
│ Job Manager                          │
│ Project Manager                      │
│ Asset Manager                        │
│ Process Manager                      │
│ Render Manager                       │
│ Audio Engine (future)                │
└───────┬──────────────┬───────────────┘
        │              │
        ▼              ▼
  Python Worker      FFmpeg
        │
 ┌──────┼───────────┐
 ▼      ▼           ▼
Demucs Whisper   Alignment
```

---

# 6. Runtime Manager

O aplicativo não deverá depender do ambiente do usuário.

O Runtime Manager será responsável por garantir a existência das dependências necessárias.

Interface conceitual:

```rust
ensure_ffmpeg()
ensure_ml_worker()
ensure_model(model_id)
ensure_renderer()
```

O restante da aplicação não deverá precisar saber como determinado componente foi obtido.

---

# 7. Distribuição

O instalador principal deverá ser relativamente pequeno.

Ele deverá conter:

- Tauri;
- frontend;
- Rust core;
- Runtime Manager;
- bootstrap necessário.

Componentes pesados serão baixados sob demanda.

### Fontes dos artefatos

- modelos faster-whisper serão obtidos diretamente dos repositórios oficiais no Hugging Face, sempre com revisão fixada;
- FFmpeg privado, ML Worker isolado e pesos do HTDemucs serão distribuídos por GitHub Releases do próprio repositório KaraokAI;
- cada Release de runtime deverá conter um manifest com plataforma, arquitetura, tamanho e SHA-256 de todos os arquivos;
- um artefato só poderá ser ativado depois da validação de tamanho, checksum, conteúdo e healthcheck quando aplicável;
- as versões de runtime usadas pelo aplicativo serão fixadas e Releases já publicadas não deverão ter seus arquivos substituídos.

### Bootstrap visual

No primeiro acesso, o usuário deverá escolher a pasta de armazenamento e o modelo Whisper. O aplicativo executará um único job visual que instala o modelo selecionado, FFmpeg, ML Worker e HTDemucs, apresentando a etapa atual, bytes transferidos e progresso agregado. O onboarding só poderá terminar depois que todas as dependências passarem pela validação final.

Exemplo:

```text
KaraokeAI
   │
   ├── Core
   │
   └── Runtime Manager
            │
            ├── FFmpeg
            ├── ML Worker
            ├── Demucs models
            └── Whisper models
```

---

# 8. Diretórios

Utilizar diretórios apropriados de cada sistema.

### Linux

```text
~/.local/share/KaraokeAI/
```

### Windows

```text
%LOCALAPPDATA%\KaraokeAI\
```

### macOS

```text
~/Library/Application Support/KaraokeAI/
```

Estrutura conceitual:

```text
KaraokeAI/
├── runtime/
│   ├── ffmpeg/
│   └── workers/
│
├── models/
│   ├── demucs/
│   └── whisper/
│
├── cache/
│
├── projects/
│
└── config/
```

---

# 9. ML Worker

O ML Worker será executado como processo separado.

Motivos:

- isolamento de crashes;
- isolamento de memória;
- gerenciamento independente de GPU;
- possibilidade de atualização independente;
- possibilidade futura de substituir Python;
- impedir que erro de CUDA encerre a interface.

Exemplo:

```text
Tauri
  │
  └── spawn
       │
       ▼
karaoke-worker
       │
       ├── Demucs
       ├── Whisper
       └── Aligner
```

---

# 10. Comunicação com Worker

Operações demoradas deverão utilizar arquitetura baseada em jobs.

Não utilizar:

```text
invoke()
↓
esperar vários minutos
↓
resultado
```

Utilizar:

```text
startJob()
    ↓
jobId
    ↓
events
```

Eventos:

```text
job.started
job.stageChanged
job.progress
job.warning
job.failed
job.completed
```

Exemplo:

```json
{
  "jobId": "abc123",
  "stage": "transcribing",
  "progress": 0.72
}
```

---

# 11. Pipeline de geração

## Stage 1 — Import

Entrada:

```text
song.mp3
```

Formatos iniciais:

- MP3
- WAV
- FLAC
- M4A
- AAC
- OGG

FFmpeg poderá normalizar internamente o formato.

---

## Stage 2 — Stem Separation

Engine inicial:

**Demucs**

Modo padrão:

```text
vocals
instrumental
```

Saída:

```text
vocals.wav
instrumental.wav
```

Modo avançado futuro:

```text
vocals.wav
drums.wav
bass.wav
other.wav
```

---

# 12. Transcrição

Engine inicial:

**faster-whisper**

Modelo configurável.

Exemplos:

- tiny;
- base;
- small;
- medium;
- large-v3.

Deverá suportar:

- detecção automática de idioma;
- seleção manual;
- timestamps;
- word timestamps.

Entrada:

```text
vocals.wav
```

Saída intermediária:

```text
transcription.json
```

---

# 13. Forced Alignment

A transcrição inicial deverá passar opcionalmente por uma etapa de alinhamento.

Engine inicial sugerida:

**WhisperX**

Objetivo:

- melhorar início e fim das palavras;
- melhorar sincronização visual;
- corrigir timestamps aproximados do Whisper.

Saída:

```text
alignment.json
```

---

# 14. Modelo de letras

Formato interno:

```json
{
  "language": "en",
  "lines": [
    {
      "id": "line-1",
      "start": 12.42,
      "end": 16.81,
      "text": "Hello darkness my old friend",
      "words": [
        {
          "id": "word-1",
          "text": "Hello",
          "start": 12.42,
          "end": 12.91
        }
      ]
    }
  ]
}
```

O formato interno deverá ser independente de Whisper, ASS ou SRT.

---

# 15. Editor de letras

O usuário deverá poder:

- alterar palavras;
- adicionar palavras;
- remover palavras;
- alterar linhas;
- dividir linhas;
- juntar linhas;
- alterar timestamp inicial;
- alterar timestamp final;
- reproduzir trecho;
- ajustar sincronização manualmente.

Futuramente:

- arrastar palavras diretamente na timeline;
- atalhos de teclado;
- snapping;
- waveform.

---

# 16. Preview

O preview inicial utilizará tecnologias web.

Composição:

```text
<video>
   +
lyrics HTML/CSS
   +
animations
```

A posição atual do player determinará:

- linha atual;
- palavra atual;
- progresso da palavra.

---

# 17. Karaoke Progress

Cada palavra possuirá:

```text
start
end
```

Progresso:

```text
(currentTime - start)
---------------------
(end - start)
```

Clamp:

```text
0 → 1
```

Esse valor poderá controlar:

- preenchimento;
- mudança de cor;
- glow;
- scale;
- outras animações.

---

# 18. Personalização

O usuário poderá configurar:

### Texto

- fonte;
- tamanho;
- peso;
- alinhamento;
- espaçamento;
- posição.

### Cores

- letra inativa;
- letra ativa;
- outline;
- sombra.

### Effects

MVP:

- fill;
- fade;
- scale.

Futuro:

- glow;
- bounce;
- slide;
- blur;
- pulse;
- custom animations.

---

# 19. Fontes

Suportar:

### Fontes do sistema

Selecionadas através de font picker.

### Fontes customizadas

O usuário poderá importar:

```text
.ttf
.otf
```

A fonte será armazenada como asset do projeto.

Isso garante que o projeto continue renderizando corretamente mesmo em outro computador.

---

# 20. Background

Tipos:

```text
video
image
solid
```

## Vídeo

Usuário poderá fornecer:

```text
.mp4
.mov
.webm
.mkv
```

FFmpeg será responsável pela normalização necessária.

Configurações:

- fit;
- cover;
- contain;
- crop;
- opacity;
- blur;
- brightness;
- loop.

---

# 21. Background Loop

Caso o vídeo seja menor que a música:

```text
background
    ↓
loop
    ↓
duração da música
```

Modo futuro:

```text
normal
reverse
normal
reverse
```

para backgrounds adequados.

---

# 22. Resolução

Presets iniciais:

### Landscape

```text
1920×1080
16:9
```

### Vertical

```text
1080×1920
9:16
```

### Square

```text
1080×1080
1:1
```

Custom resolution poderá ser adicionada posteriormente.

---

# 23. Templates

A configuração visual deverá ser independente da música.

Exemplo:

```json
{
  "name": "Metal",
  "lyricsStyle": {},
  "backgroundStyle": {},
  "animation": {}
}
```

Presets iniciais possíveis:

- Classic Karaoke;
- Minimal;
- Metal;
- Neon;
- Concert;
- Vertical Social.

Usuário poderá criar e salvar presets.

---

# 24. Project Format

Cada projeto deverá possuir um manifesto.

```text
project/
├── project.json
├── audio/
│   ├── source.flac
│   ├── vocals.wav
│   └── instrumental.wav
│
├── lyrics/
│   └── lyrics.json
│
├── assets/
│   ├── background.mp4
│   └── fonts/
│       └── custom.ttf
│
└── renders/
```

O arquivo original poderá opcionalmente ser referenciado externamente em vez de copiado.

---

# 25. project.json

Exemplo conceitual:

```json
{
  "version": 1,

  "song": {
    "title": "Example",
    "artist": "Artist"
  },

  "video": {
    "width": 1920,
    "height": 1080,
    "fps": 60
  },

  "background": {
    "type": "video",
    "path": "assets/background.mp4",
    "fit": "cover",
    "opacity": 0.9,
    "blur": 2
  },

  "lyrics": {
    "path": "lyrics/lyrics.json"
  },

  "style": {
    "font": "Custom",
    "fontSize": 72,
    "weight": 700,
    "inactiveColor": "#FFFFFF",
    "activeColor": "#FFD400",
    "strokeColor": "#000000",
    "strokeWidth": 4
  },

  "animation": {
    "type": "fill"
  }
}
```

---

# 26. Cache

Processamento de IA deverá ser cacheado.

Chave inicial:

```text
SHA-256(source audio)
```

Estrutura:

```text
cache/
└── <audio-hash>/
    ├── metadata.json
    ├── stems/
    │   ├── vocals.wav
    │   └── instrumental.wav
    ├── transcription.json
    └── alignment.json
```

Cada estágio deverá armazenar:

- versão do worker;
- versão/modelo utilizado;
- parâmetros;
- hash da entrada.

Se os parâmetros relevantes não mudarem, o estágio poderá ser reutilizado.

---

# 27. Renderização MVP

Pipeline:

```text
Project
   ↓
Lyrics
   ↓
ASS Generator
   ↓
karaoke.ass
   ↓
FFmpeg
   ↓
output.mp4
```

O ASS será responsável por:

- fonte;
- posição;
- outline;
- sombra;
- cores;
- karaoke timing.

FFmpeg será responsável por:

- background;
- instrumental;
- subtitles;
- scaling;
- encoding;
- muxing.

---

# 28. Renderização avançada

Quando ASS deixar de ser suficiente:

```text
Project
   ↓
Native Renderer
   ↓
frames
   ↓
FFmpeg
   ↓
MP4
```

Possíveis tecnologias:

- Skia;
- wgpu;
- outro renderer GPU.

Isso permitirá:

- partículas;
- motion effects;
- visualizadores;
- shaders;
- animações complexas;
- transições;
- efeitos reativos à música.

---

# 29. Exportação

MVP:

- MP4;
- SRT;
- LRC;
- ASS;
- JSON do projeto.

Futuro:

- WebM;
- MOV;
- PNG sequence;
- áudio instrumental;
- stems individuais.

---

# 30. Model Manager

Interface dedicada:

```text
AI Models

Separation
✓ HTDemucs

Speech Recognition
✓ Whisper Medium

○ Whisper Large v3
  ~3 GB
  [Download]
```

O usuário poderá:

- instalar;
- remover;
- atualizar;
- selecionar modelo padrão.

---

# 31. Runtime Packages

Distribuir builds específicas por plataforma.

Exemplos:

```text
worker-win-x64-cpu
worker-win-x64-cuda

worker-linux-x64-cpu
worker-linux-x64-cuda

worker-macos-arm64
worker-macos-x64
```

Não distribuir todos os runtimes para todos os usuários.

---

# 32. Detecção de hardware

Na primeira execução:

```text
Detect OS
   ↓
Detect architecture
   ↓
Detect GPU
   ↓
Choose runtime
```

Possíveis backends:

```text
NVIDIA → CUDA
Apple Silicon → Metal/MPS quando suportado
AMD → backend suportado pela plataforma
Fallback → CPU
```

---

# 33. NVIDIA

Não exigir CUDA Toolkit do sistema.

O runtime deverá carregar suas próprias bibliotecas necessárias sempre que possível.

Dependência externa permitida:

**driver NVIDIA compatível.**

Caso GPU não esteja disponível:

```text
GPU acceleration unavailable.

KaraokeAI will use CPU processing.
```

O programa não deverá instalar ou alterar drivers automaticamente.

---

# 34. FFmpeg

O aplicativo deverá possuir uma versão conhecida e suportada de FFmpeg.

Prioridade recomendada:

```text
private FFmpeg
      ↓
system FFmpeg apenas para desenvolvimento/fallback
```

Nunca assumir que:

```text
ffmpeg
```

no PATH é compatível.

Sempre utilizar caminho absoluto para o runtime selecionado.

---

# 35. Segurança dos runtimes

Componentes baixados deverão possuir:

- versão;
- URL;
- tamanho;
- SHA-256;
- plataforma;
- arquitetura.

Fluxo:

```text
download
   ↓
verify SHA-256
   ↓
verify manifest
   ↓
extract
   ↓
activate
```

Nunca executar componente baixado antes da validação.

---

# 36. Versionamento independente

Componentes deverão possuir versões independentes.

Exemplo:

```text
KaraokeAI       1.2.0
ML Worker       1.4.1
FFmpeg Runtime  7.x
HTDemucs        model-version-x
Whisper         large-v3
```

Isso permite atualizar modelos e engines sem necessariamente atualizar a aplicação inteira.

---

# 37. Player

## MVP

Utilizar player WebView.

Objetivos:

- play;
- pause;
- seek;
- volume;
- posição atual;
- sincronização visual.

## Futuro

Engine nativa em Rust.

Motivos:

- sincronização precisa;
- mixagem;
- múltiplos stems;
- controle independente de ganho;
- comportamento consistente entre plataformas.

---

# 38. Practice Mode

Com separação de stems:

```text
Vocals   ━━━━━━━━ 100%
Drums    ━━━━━━━━ 100%
Bass     ━━━━━━━━ 100%
Other    ━━━━━━━━ 100%
```

Usuário poderá mutar qualquer stem.

Exemplos:

### Karaoke

```text
Vocals: 0%
Everything else: 100%
```

### Bass Practice

```text
Bass: 0%
Everything else: 100%
```

### Drum Practice

```text
Drums: 0%
Everything else: 100%
```

---

# 39. UX de processamento

Exemplo:

```text
Preparing your karaoke

✓ Loading audio
✓ Separating vocals
████████████████░░░ 82% Transcribing lyrics
○ Aligning words
○ Creating project
```

O processamento nunca deverá bloquear a UI.

Usuário poderá cancelar jobs quando tecnicamente possível.

---

# 40. Tratamento de erros

Cada stage deverá falhar isoladamente.

Exemplos:

```text
CUDA_OUT_OF_MEMORY
MODEL_NOT_FOUND
FFMPEG_ERROR
UNSUPPORTED_AUDIO
TRANSCRIPTION_FAILED
ALIGNMENT_FAILED
DISK_FULL
DOWNLOAD_FAILED
CHECKSUM_FAILED
```

O frontend deverá receber erros estruturados, e não simplesmente stderr cru.

Exemplo:

```json
{
  "code": "CUDA_OUT_OF_MEMORY",
  "stage": "transcription",
  "recoverable": true
}
```

Possível recuperação:

```text
Not enough GPU memory.

[Retry using CPU]
```

---

# 41. Offline

Depois que os componentes necessários forem instalados:

**todo o fluxo deverá funcionar sem internet.**

Incluindo:

- stem separation;
- transcription;
- alignment;
- editing;
- playback;
- rendering;
- exporting.

Internet será utilizada somente para:

- download inicial;
- atualização;
- novos modelos.

---

# 42. Privacidade

Princípio:

> Your music stays on your computer.

Nenhuma música deverá ser enviada para servidores por padrão.

Nenhuma etapa de IA deverá depender de API externa.

---

# 43. MVP

## MVP 0 — Technical Prototype

Objetivo: validar pipeline.

Implementar:

- CLI;
- Demucs;
- faster-whisper;
- word timestamps;
- JSON;
- geração ASS;
- FFmpeg;
- MP4 final.

Sem Tauri inicialmente.

Fluxo:

```text
song.mp3
↓
CLI
↓
output.mp4
```

---

## MVP 1 — Desktop

Adicionar:

- Tauri;
- React;
- seleção de arquivo;
- jobs;
- progress;
- preview;
- editor básico;
- render;
- Runtime Manager.

---

## MVP 2 — Visual Editor

Adicionar:

- background;
- custom fonts;
- cores;
- posições;
- presets;
- aspect ratios;
- live preview.

---

## MVP 3 — Distribution

Adicionar:

- bootstrap;
- runtime downloads;
- model manager;
- GPU detection;
- checksum;
- updater;
- Windows/Linux/macOS packaging.

---

# 44. Pós-MVP

### P1

- WhisperX;
- editor de timestamps;
- waveform;
- custom fonts;
- templates;
- export LRC/SRT.

### P2

- quatro stems;
- mixer;
- Practice Mode;
- native audio engine.

### P3

- advanced renderer;
- shaders;
- visualizers;
- particles;
- beat detection;
- audio-reactive backgrounds.

### P4

- batch processing;
- template marketplace/import;
- project sharing;
- plugin system.

---

# 45. Princípios arquiteturais

### 1. Nenhuma dependência global

Nunca depender de:

```text
python
pip
ffmpeg
demucs
whisper
CUDA Toolkit
```

instalados pelo usuário.

---

### 2. Processamento isolado

ML deverá rodar fora do processo principal.

---

### 3. Arquivos grandes não atravessam IPC

Não fazer:

```text
React → WAV bytes → Rust → Python
```

Fazer:

```text
React
  ↓
path
  ↓
Rust
  ↓
path
  ↓
Worker
```

---

### 4. Jobs para operações longas

Toda operação demorada deverá ser:

- assíncrona;
- cancelável quando possível;
- observável;
- reportar progresso.

---

### 5. Project format independente

O formato de projeto não poderá depender de:

- Demucs;
- Whisper;
- ASS;
- FFmpeg.

Eles são implementações substituíveis.

---

### 6. Reprodutibilidade

Renderização final deverá ser determinística.

Preview e render podem utilizar engines diferentes, mas deverão buscar equivalência visual.

---

### 7. Componentes substituíveis

Arquitetura:

```text
StemSeparator
Transcriber
Aligner
AudioEngine
Renderer
Encoder
```

Cada componente deverá possuir interface própria.

Isso permitirá trocar:

```text
Demucs → outro separator
Whisper → outro ASR
ASS → native renderer
FFmpeg encoder → outro encoder
```

sem reescrever o aplicativo.

---

# 46. Estrutura inicial do repositório

```text
karaoke-ai/
│
├── apps/
│   └── desktop/
│       ├── src/
│       │   ├── components/
│       │   ├── features/
│       │   ├── player/
│       │   ├── editor/
│       │   └── projects/
│       │
│       └── src-tauri/
│           └── src/
│
├── worker/
│   ├── karaoke_worker/
│   │   ├── separation/
│   │   ├── transcription/
│   │   ├── alignment/
│   │   └── protocol/
│   │
│   └── pyproject.toml
│
├── packages/
│   ├── project-schema/
│   └── shared-types/
│
├── runtime/
│   ├── manifests/
│   └── scripts/
│
├── renderer/
│   └── ass/
│
└── docs/
    ├── architecture.md
    ├── project-format.md
    ├── worker-protocol.md
    └── runtime-distribution.md
```

---

# 47. Primeiro milestone técnico

Antes de desenvolver a interface, validar end-to-end:

```text
input.mp3
   ↓
Demucs
   ↓
vocals.wav + instrumental.wav
   ↓
faster-whisper
   ↓
lyrics.json
   ↓
alignment
   ↓
karaoke.ass
   ↓
FFmpeg
   ↓
output.mp4
```

Critério de sucesso:

> Uma única linha de comando recebe uma música arbitrária e produz automaticamente um MP4 de karaoke reproduzível.

Depois disso, transformar o pipeline em worker e construir o Tauri ao redor dele.

---

# 48. Definição do MVP final

O MVP será considerado funcional quando um usuário em uma máquina limpa puder:

1. instalar KaraokeAI;
2. abrir sem instalar dependências manualmente;
3. selecionar uma música;
4. baixar automaticamente o runtime/modelos necessários;
5. separar vocal e instrumental;
6. gerar automaticamente a letra sincronizada;
7. corrigir a letra;
8. escolher um vídeo de background;
9. escolher fonte e cores;
10. visualizar o karaoke;
11. renderizar;
12. receber um arquivo MP4;
13. repetir o processo posteriormente sem internet.

Esse é o contrato principal do produto.
