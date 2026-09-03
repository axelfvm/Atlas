# Sidebar: validação de 03/09/2026

Mudança reproduzível: `chromium/patches/0007-atlas-sidebar-layout-and-startup.patch`.

## Regressão de inicialização

O script `tools/chromium/verify-sidebar-startup.ps1` usa perfis temporários
com `profile.exit_type=Crashed` para solicitar a recuperação de sessão, sem
alterar o perfil pessoal. Cada caso verifica processo vivo, janela criada e
ausência de `FATAL`/`Check failed` no log.

| Sidebar | Janela | Build anterior | Build corrigida |
| --- | --- | --- | --- |
| Expandida | Restaurada | Passou | Passou |
| Expandida | Maximizada | Passou | Passou |
| Recolhida | Restaurada | Crash | Passou |
| Recolhida | Maximizada | Crash | Passou |

Os dois crashes anteriores ocorreram na obtenção da âncora do menu. A correção
mantém o menu acessível na lateral recolhida e permite uma âncora Views válida
antes da disponibilidade do elemento de fallback do BrowserView.

## Build e instalação local

- `autoninja -C out\AtlasRelease -j 6 chrome`: sucesso, 23 etapas incrementais.
- `autoninja -C out\AtlasRelease -j 6 mini_installer`: sucesso.
- Patch 0007 validado sobre os patches 0001–0006 em índice Git temporário.
- Instalador local terminou com código 0.
- SHA-256 do EXE e DLL instalados coincide com a build corrigida.
- SHA-256 de `Default/Preferences` permaneceu igual durante a instalação.
- Os quatro cenários de inicialização também passaram com o executável instalado
  em `AppData/Local/Atlas/Application/chrome.exe`.

## Limites

A verificação de inicialização não certifica a composição visual, navegação por
teclado ou todos os fluxos de downloads, conta e workspaces. A inspeção visual
por automação ainda depende de a ferramenta reconhecer a URL do navegador
personalizado. Nenhum teste do protótipo Electron é usado como prova da UI nativa.

## Ajuste posterior: estado vazio dos Essenciais (patch 0008)

- Alteração restrita ao cabeçalho dos Essenciais; preserva os ajustes do patch 0007.
- Aplicação do patch validada em índice temporário sobre a série 0001–0007.
- Objeto `vertical_tab_strip_region_view.obj` compilado com sucesso.
- Build completa de `chrome mini_installer`: sucesso, 23 etapas em 1m57s.
- Os quatro testes de inicialização passaram na build atual, com perfis isolados:
  `atlas-sidebar-check-132b4a7c93124784b4e583cd45fa72c4` na pasta temporária.
- Instalação local atualizada com código 0; SHA-256 do EXE e DLL coincide com a
  build. `Default/Preferences` permaneceu com o mesmo SHA-256.
- Os quatro testes passaram também no executável instalado, com resultados em
  `atlas-sidebar-check-f9a82b22d6e74203b95f82266f9a7150` na pasta temporária.
- Teste de interação e validação visual ainda pendentes; testes de inicialização
  não certificam o layout nem a interação com Essenciais.
- Para validar: iniciar sem fixadas, adicionar uma essencial, selecionar outra
  guia e adicionar a segunda, desafixar ambas e fechar a última fixada. Conferir
  retorno ao estado vazio, teclado, 224/240 px e sidebar recolhida/expandida.

## Expansão temporária por hover (patch 0009)

Causa identificada no código: a animação aumentava a largura, mas toolbar,
seções e rodapé continuavam usando o estado persistido `collapsed`. O alvo da
animação também era fixo em 240 px e o popup do omnibox forçava recolhimento.

O patch unifica a apresentação pela largura efetiva, usa a largura salva,
mantém altura de cabeçalho estável e usa `kKeepExpanded` para sugestões.
Inclui testes nativos `AtlasHoverUsesSavedWidthAndRevealsNavigation` e
`AtlasOmniboxSuggestionsKeepHoverOpen` em `vertical_tab_strip_region_view_browsertest.cc`.
Esses testes ainda não foram executados: `browser_tests.exe` não está disponível
na build local. Verificam 224/240/320/400 px, endereço visível durante hover,
preferência recolhida preservada, página sem deslocamento e retorno ao modo compacto.

Build `chrome mini_installer`: sucesso, 24 etapas em 2m15s. Os quatro smoke
tests de inicialização passaram na build, com resultados em
`atlas-sidebar-check-f72a7a177c0e4d54b9e416528036991b` na pasta temporária.
A validação visual e a execução dos dois testes específicos de hover continuam
pendentes; o smoke test não reproduz o movimento do mouse.
Instalador local: código 0; hashes do EXE/DLL instalados iguais à build e hash
de `Default/Preferences` inalterado durante a atualização.
Os quatro smoke tests também passaram no executável instalado, em
`atlas-sidebar-check-8591b1d29b754b1b97a19259423ed3ff` na pasta temporária.

## Faixa de controles sem sobreposição (patch 0010)

- Substitui o ocultamento por opacidade por visibilidade real dos botões.
- Reserva espaço não cliente: 32 px visível, 3 px para ativação no maximizado.
- Contêiner ocupa a largura da janela; espaço livre retorna `HTCAPTION`.
- Mantém barra no restaurado/toque e não aplica a mudança a fullscreen/PWAs.
- Adiciona `AtlasTitlebarReservesSpaceAndKeepsNativeDragRegion` ao teste nativo
  de frame do Windows. O teste verifica os callbacks de revelar/recolher,
  reserva de espaço, botões ocultos e região de arraste; ainda não executado,
  pois `interactive_ui_tests.exe` não está disponível nesta build local.
- Build final `chrome mini_installer`: sucesso, 9 etapas incrementais em 1m56s.
- Patch validado sobre a série 0001–0009 em índice temporário.
- Os quatro testes de abertura passaram na build, com resultados na pasta
  temporária `atlas-sidebar-check-fa242653eb3540b0bf4951f4b2fe1d0e`.
- Instalador local concluído com código 0; hashes do EXE e da DLL instalados
  coincidem com a build e `Default/Preferences` permaneceu inalterado.
- Os quatro testes de abertura também passaram no executável instalado, com
  resultados em `atlas-sidebar-check-171929fcc7314f92af7391e51f8a46ac` na pasta
  temporária (maximizado/restaurado, sidebar expandida/recolhida).
- Verificação visual do hover e gesto de arrastar: pendente. O teste de abertura
  não exercita esses gestos, e o teste nativo adicionado ainda não foi executado.

## Animação da faixa superior (patch 0011)

- `gfx::SlideAnimation` controla uma única altura compartilhada pelo frame,
  conteúdo e sidebar: 180 ms ao abrir e 160 ms ao fechar, curva ease-in-out.
- A reversão preserva o valor atual; os botões mantêm altura de 32 DIPs e
  deslizam recortados pelo contêiner, sem deformar os ícones.
- Preferência de movimento reduzido desativa a animação. Restaurar a janela
  cancela o movimento e mantém a faixa integralmente visível.
- Build `chrome mini_installer`: sucesso, 9 etapas em 1m12s.
- Patch validado sobre a série 0001–0010 em índice temporário.
- Quatro testes de abertura aprovados na build, resultados em
  `atlas-sidebar-check-b95f59ad1d2748c6a61cd7bbfaf30337` na pasta temporária.
- Instalação local concluída com código 0, hashes do EXE/DLL iguais à build e
  `Default/Preferences` inalterado.
- Adicionado teste nativo de altura intermediária, reversão, término e
  restauração durante a animação. O teste anterior cobre movimento reduzido.
- Arquivo dos testes nativos compilado com sucesso como objeto (25s na
  verificação final). Execução pendente: `interactive_ui_tests.exe` não foi
  gerado nesta build. Compilar o objeto não equivale a aprovar as asserções.
- Quatro testes de abertura também aprovados no executável instalado, em
  `atlas-sidebar-check-2b8109a6f3234174bbc05dc65d3e947c` na pasta temporária.
- Validação visual da fluidez ainda pendente; testes de abertura não medem
  animação nem comprovam ausência de saltos durante interação real.

## Empacotamento v0.1.2

- Manifesto e metadados nativos atualizados para Atlas 0.1.2; motor permanece
  154.0.8031.0. Build `chrome mini_installer` aprovada: 41 etapas em 1m06s.
- Todos os 11 patches aplicados sequencialmente em índice temporário sobre
  a revisão Chromium fixada no repositório.
- Os quatro testes de abertura passaram na build final 0.1.2. Resultados em
  `atlas-sidebar-check-02c1e89c83df43d789dd49e0d9adcfd0` na pasta temporária.
- Instalador Windows x64: 214983680 bytes, sem assinatura digital.
- SHA-256: `131bddd02824bb099a21284edb70b5ab3f152ee1b5ff668b14ba4ac43cb9fe3d`.
