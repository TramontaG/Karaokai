# KaraokAI

Aplicação desktop local-first para transformar músicas em projetos de karaokê: separa vocais e instrumental, transcreve letras com timestamps por palavra, permite editar a timeline visualmente e exporta o resultado em vídeo.

> [!NOTE]
> Versão atual: `0.1.0` — release candidate. O fluxo principal está funcional; os instaladores públicos para Windows e macOS ainda dependem das respectivas etapas de distribuição e assinatura.

## O que o KaraokAI faz

```text
Importar música ou vídeo do YouTube
             ↓
Separar vocais e instrumental localmente
             ↓
Transcrever e criar legendas sincronizadas
             ↓
Editar letra, timings, visual e background
             ↓
Exportar vídeo de karaokê
```

O processamento de áudio e de vídeo ocorre no computador do usuário. Internet só é necessária para baixar o runtime/modelos no primeiro uso e, naturalmente, para importar um vídeo do YouTube.

## Funcionalidades

### Criação e processamento de projetos

- importação de arquivos locais (`.mp3`, `.wav`, `.flac`, `.m4a`, `.aac` e `.ogg`);
- importação de vídeos do YouTube, preservando o vídeo como background do projeto;
- suporte opcional a cookies do YouTube para casos em que a plataforma exige autenticação;
- separação local de vocais e instrumental com Demucs;
- transcrição de vocais com timestamps por palavra;
- tokens explícitos de pausa entre palavras, preservados no projeto e na timeline;
- acompanhamento de cada etapa do processamento: importação, separação, transcrição e geração de legendas.

### Editor de karaokê

- múltiplas tracks de legendas, além de tracks de áudio e background;
- edição de texto da frase e de cada palavra diretamente no painel lateral;
- inserção, remoção e edição de palavras e pausas;
- ao digitar múltiplas palavras em um item, divisão automática do intervalo de tempo proporcionalmente ao tamanho de cada palavra;
- split de frases por atalho (`S`) ou pela ferramenta de corte, usando o limite de palavra mais próximo do cursor;
- arraste de frases horizontalmente e entre tracks;
- arraste de palavras com `Ctrl` para redistribuir o timing sem criar espaços vazios na frase;
- zoom da timeline com `Ctrl` + scroll, grade de BPM/offset e acompanhamento opcional da reprodução;
- desfazer/refazer com histórico das edições;
- estilos por track, frase ou palavra: fonte, peso, itálico, sublinhado, sobrescrito/subscrito, escala, posição e cores de leitura;
- curvas de animação e transição entre frases;
- backgrounds de vídeo, imagem, capa do álbum, cor sólida ou gradiente, com modos `cover` e `contain`;
- fontes próprias importadas pelo usuário;
- miniaturas de projeto geradas a partir da prévia do editor.

### Biblioteca e exportação

- biblioteca de projetos em grade ou lista;
- renomear, duplicar, excluir, abrir a pasta e reabrir projetos;
- persistência de projeto e assets no diretório de dados escolhido;
- exportação de vídeo com resoluções de 480p a 1440p, 30 ou 60 FPS, modos de áudio instrumental/vocais/mix e presets H.264;
- progresso de renderização, cancelamento seguro e bloqueio de edição enquanto o vídeo é gerado.

## Tecnologia

| Camada        | Tecnologias                                  |
| ------------- | -------------------------------------------- |
| Desktop       | Electron, Node.js                            |
| Interface     | React 19, TypeScript, Vite                   |
| Estilos       | Emotion Styled                               |
| Navegação     | TanStack Router                              |
| Processamento | Python 3.11, PyTorch, Demucs, faster-whisper |
| Mídia         | FFmpeg, yt-dlp                               |

## Runtime local

O bundle do aplicativo não inclui Python, modelos ou binários pesados. No primeiro uso, o Runtime Manager instala tudo no diretório de dados escolhido, sem modificar o Python do sistema, `PATH` ou registro do Windows.

| Componente | Origem                                          |
| ---------- | ----------------------------------------------- |
| `uv`       | Release oficial da Astral, com SHA-256 validado |
| Python     | Instalação privada gerenciada pelo `uv`         |
| ML Worker  | PyPI e índice oficial de wheels do PyTorch      |
| FFmpeg     | Wheel `imageio-ffmpeg` no PyPI                  |
| yt-dlp     | PyPI                                            |
| Whisper    | Revisões fixadas no Hugging Face                |
| Demucs     | Repositório de modelos da Meta                  |

Modelos, runtime e cache podem ser verificados, removidos ou reinstalados pelas configurações. Veja [docs/runtime-installation.md](docs/runtime-installation.md) para detalhes.

## Desenvolvimento

### Pré-requisitos

- Node.js 22 LTS;
- npm.

### Instalação

```bash
git clone git@github.com:TramontaG/Karaokai.git
cd Karaokai
npm install
```

### Executar em desenvolvimento

```bash
npm run dev
```

O comando inicia o Vite e a janela Electron.

### Comandos

| Comando                       | Descrição                                                |
| ----------------------------- | -------------------------------------------------------- |
| `npm run dev`                 | Executa o Electron com Vite em desenvolvimento           |
| `npm run dev:web`             | Executa somente o frontend Vite                          |
| `npm run build`               | Valida TypeScript e gera o bundle web                    |
| `npm run build:desktop`       | Empacota os targets da plataforma atual                  |
| `npm run build:windows`       | Gera o instalador NSIS Windows x64                       |
| `npm run build:windows:store` | Gera o pacote AppX para Microsoft Store em Windows 10/11 |
| `npm run format`              | Formata o repositório com Prettier                       |
| `npm run format:check`        | Verifica a formatação sem alterar arquivos               |

Os artefatos são gravados em `release/`.

## Distribuição

| Plataforma      | Target atual      | Situação                                                                                   |
| --------------- | ----------------- | ------------------------------------------------------------------------------------------ |
| Linux           | AppImage e `.deb` | Empacotamento validado                                                                     |
| Windows x64     | NSIS `.exe`       | Empacotamento validado; não assinado para RC fechado                                       |
| Microsoft Store | AppX              | Configurado; requer conta/identidade reservada no Partner Center                           |
| macOS           | DMG               | Configurado; requer build em macOS, assinatura e notarização antes da distribuição pública |

Para enviar à Microsoft Store, reserve primeiro o nome do app no Partner Center e substitua `appx.identityName` em `electron-builder.yml` pelo valor exato fornecido pela Microsoft. O target `appx` é o formato de pacote da Store suportado pelo electron-builder; a Microsoft assina o pacote publicado.

## Privacidade

- áudio, stems, projetos e renders permanecem no dispositivo;
- não há telemetria, anúncios ou upload obrigatório de músicas;
- downloads de runtime/modelos vão apenas para o diretório escolhido;
- importações do YouTube usam rede para consultar e baixar o vídeo;
- todos os dados gerenciados podem ser removidos pelas configurações.

## Estrutura do repositório

```text
Karaokai/
├── src/                  # Interface React, editor e serviços do renderer
├── electron/             # Processo principal, IPC, renderização e runtime
├── worker/               # Worker Python de separação e transcrição
├── docs/                 # Documentação técnica
├── src-tauri/            # Implementação anterior, mantida temporariamente
├── electron-builder.yml  # Targets e configuração de empacotamento
└── projectDefinition.md  # Especificação técnica e de produto
```

## Documentação adicional

- [Instalação do runtime](docs/runtime-installation.md)
- [Especificação técnica e de produto](projectDefinition.md)
