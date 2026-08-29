# Atlas

Atlas é um navegador para Windows baseado diretamente no Chromium.

> Explore a web. Encontre seu caminho.

## Direção do projeto

O Atlas será mantido como uma camada pública de produto sobre o Chromium:

- o código-fonte oficial do Chromium fica em um checkout externo;
- identidade, interface e funcionalidades do Atlas são mantidas neste repositório;
- alterações no Chromium serão organizadas como patches pequenos e reaplicáveis;
- cada atualização de segurança do Chromium deverá passar por aplicação dos patches,
  compilação e testes do Atlas.

Essa arquitetura foi escolhida para oferecer compatibilidade real com extensões
modernas do Chrome e permitir a integração correta de conteúdo protegido.

## Requisitos do produto

- interface escura com guias verticais e barra lateral recolhível;
- atalhos laterais inicialmente vazios e gerenciados pelo usuário;
- restauração do estado maximizado ou restaurado da janela;
- atualizações automáticas assinadas;
- extensões compatíveis com Manifest V3;
- Chrome DevTools completo para páginas e extensões;
- gerenciador de downloads nativo com progresso, histórico e controles completos;
- histórico de navegação local, pesquisável e integrado à barra de endereço;
- Google como mecanismo de busca inicial, substituível pelo usuário;
- conteúdo protegido (DRM) ativado por padrão e desativável nas configurações;
- validação real de reprodução no Widevine, Netflix e Crunchyroll;
- identidade visual Atlas independente do Google Chrome.

## Estrutura

```text
chromium/                 Configuração e patches aplicados ao Chromium
docs/                     Decisões técnicas e etapas da migração
tools/chromium/           Diagnóstico e preparação do ambiente de compilação
src/, test/, package.json Protótipo Electron preservado temporariamente
```

O protótipo Electron não será distribuído como versão final. Ele permanece no
repositório somente como referência funcional e visual durante a migração.

## Preparar o ambiente no Windows

O checkout e a compilação do Chromium exigem uma máquina Windows recente, SSD,
no mínimo 100 GB livres, Visual Studio 2026 com C++ e `depot_tools`.

Primeiro execute o diagnóstico, que não instala nem altera o ambiente:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\chromium\doctor.ps1
```

Depois de atender aos pré-requisitos, baixe o Chromium fora deste repositório:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\chromium\fetch-source.ps1
```

O download pode levar horas. Consulte [a arquitetura de migração](docs/chromium-migration.md)
e [a direção da interface](docs/interface.md) antes de iniciar.

## Compilar

Dentro de `C:\src\atlas-chromium\src`, após configurar os argumentos GN:

```bat
gn gen out\Atlas
autoninja -C out\Atlas chrome
out\Atlas\chrome.exe
```

O instalador será gerado futuramente pelo alvo `mini_installer`, depois que a
identidade Atlas e o sistema de atualização estiverem implementados.

## Convenção de commits

Os commits do projeto só são criados quando solicitados pelo responsável. O título
usa a data e hora local no formato `AAAAMMDDHHMM`, e a descrição registra o que foi
feito ou alterado.

## Status

A base Chromium `154.0.8031.0` foi compilada e iniciada com sucesso no Windows
x64. A primeira camada nativa do Atlas ativa tema escuro e abas verticais
expandidas para perfis novos, mantendo atalhos/abas fixadas vazios até que o
usuário os adicione. A segunda camada aplica o nome Atlas e a identidade visual
oficial aos recursos internos, ao executável e aos tiles do Windows. Consulte
`chromium/revision.txt`, `chromium/branding` e a pilha em `chromium/patches` para
reproduzir essa base.

O Atlas ainda está em desenvolvimento e não possui versão pública pronta para
uso diário.
