# KaraokAI

Aplicação desktop local-first para transformar músicas em projetos de karaokê com separação de vocais, transcrição sincronizada, edição visual e exportação de vídeo.

> [!IMPORTANT]
> O KaraokAI está em desenvolvimento ativo. O shell da aplicação, o onboarding, o gerenciador de runtime e o design inicial das telas estão implementados; o pipeline completo de criação e edição de karaokês ainda está em construção.

## Visão geral

O objetivo do KaraokAI é oferecer um fluxo simples:

```text
Selecionar uma música
        ↓
Separar vocais e instrumental
        ↓
Transcrever e sincronizar a letra
        ↓
Editar e personalizar
        ↓
Visualizar e exportar
```

O processamento principal acontece localmente. A música não precisa ser enviada para APIs externas, e o aplicativo funciona offline depois que as dependências e os modelos escolhidos forem baixados.

## Estado atual

Já disponível:

- aplicação desktop Electron com interface React e TypeScript;
- onboarding visual com escolha do diretório de armazenamento;
- instalação isolada de Python, FFmpeg, yt-dlp e ML Worker;
- download e gerenciamento de modelos Whisper e Demucs;
- progresso visual para instalações e downloads;
- checkup das dependências e gerenciamento dos arquivos locais;
- telas iniciais de Início, Projetos e Configurações;
- biblioteca de projetos em grade e lista;
- temas claro, escuro e automático pelo sistema;
- interface em português e inglês;
- preferências persistidas localmente.

Em desenvolvimento:

- importação e análise real de áudio;
- separação de stems e transcrição integradas à interface;
- alinhamento das palavras;
- editor de letra e timeline;
- preview do karaokê;
- renderização e exportação de vídeo.

## Stack

| Camada       | Tecnologias                      |
| ------------ | -------------------------------- |
| Desktop      | Electron, Node.js                |
| Interface    | React 19, TypeScript, Vite       |
| Estilos      | Emotion Styled                   |
| Navegação    | TanStack Router                  |
| Ícones       | Lucide React                     |
| Worker local | Python 3.11, PyTorch             |
| IA           | Demucs, faster-whisper, WhisperX |
| Mídia        | FFmpeg, yt-dlp                   |

## Runtime local

O instalador do KaraokAI não inclui Python, modelos ou binários pesados. No primeiro acesso, o Runtime Manager baixa somente o necessário para a plataforma e mantém tudo dentro do diretório privado da aplicação.

| Componente | Origem                                          |
| ---------- | ----------------------------------------------- |
| `uv`       | Release oficial da Astral, com SHA-256 validado |
| Python     | Distribuição gerenciada pelo `uv`               |
| ML Worker  | PyPI e índice oficial de wheels do PyTorch      |
| FFmpeg     | Wheel do `imageio-ffmpeg` no PyPI               |
| yt-dlp     | PyPI                                            |
| Whisper    | Revisões fixadas no Hugging Face                |
| Demucs     | Repositório de modelos da Meta                  |

O runtime não utiliza o Python do sistema, não altera o `PATH` e pode ser removido integralmente pela tela de Configurações.

Mais detalhes estão em [docs/runtime-installation.md](docs/runtime-installation.md).

## Desenvolvimento

### Pré-requisitos

- Node.js 22 LTS;
- npm;

### Instalação

```bash
git clone git@github.com:TramontaG/Karaokai.git
cd Karaokai
npm install
```

### Executar o aplicativo

```bash
npm run dev
```

O script inicia o Vite e abre a janela Electron do KaraokAI.

### Comandos úteis

| Comando                 | Descrição                                       |
| ----------------------- | ----------------------------------------------- |
| `npm run dev`           | Executa o aplicativo desktop em desenvolvimento |
| `npm run dev:web`       | Executa somente o frontend Vite                 |
| `npm run build`         | Valida o TypeScript e gera o bundle web         |
| `npm run build:desktop` | Gera os instaladores do aplicativo desktop      |
| `npm run format`        | Formata o projeto com Prettier                  |
| `npm run format:check`  | Verifica a formatação sem alterar arquivos      |

## Estrutura do repositório

```text
Karaokai/
├── src/                  # Interface React
│   ├── components/       # Componentes compartilhados
│   ├── context/          # Contexto global de dados
│   ├── hooks/            # Operações e comportamentos compartilhados
│   ├── i18n/             # Language packs
│   ├── screens/          # Telas e componentes locais
│   ├── services/         # Integração com o processo principal Electron
│   └── theme/            # Temas da aplicação
├── electron/             # Core desktop, preload seguro e Runtime Manager
├── src-tauri/            # Implementação anterior, mantida temporariamente
├── worker/               # Protocolo do ML Worker local
├── docs/                 # Documentação técnica complementar
└── projectDefinition.md  # Especificação técnica e de produto
```

## Convenções React

Os componentes são organizados por responsabilidade:

- `index.tsx`: template declarativo;
- `behavior.ts`: hook com estado, cálculos e callbacks do componente;
- `styles.tsx`: styled components.

O contexto global armazena apenas dados. Renderizações condicionais e coleções utilizam os componentes declarativos `Render` e `ForEach`, e todos os textos visíveis vêm dos language packs JSON.

## Privacidade

- processamento local por padrão;
- nenhuma dependência global obrigatória, tudo contido dentro do proprio ambiente;
- nenhum upload de músicas para serviços externos;
- nenhum anúncio;
- nenhuma telemetria;
- modelos, runtimes e caches ficam no diretório escolhido pelo usuário;
- todos os dados baixados podem ser removidos pelo aplicativo.

## Especificação

A visão completa do produto, os estágios do pipeline e as decisões arquiteturais estão documentados em [projectDefinition.md](projectDefinition.md).
