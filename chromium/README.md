# Camada Chromium do Atlas

Este diretório armazenará arquivos de configuração e patches próprios do Atlas.
O código-fonte completo do Chromium não deve ser copiado para este repositório.

Organização:

```text
chromium/
  patches/       Patches numerados e reaplicáveis
  args/          Configurações GN versionadas
  branding/      Fontes e recursos gerados da identidade Atlas
  revision.txt   Revisão Chromium validada
```

O checkout validado fica em `C:\src\atlas-chromium\src`. Para reaplicar a
camada Atlas sobre a revisão registrada, execute os patches numerados a partir
da raiz desse checkout:

```powershell
git apply C:\Users\Axel\Desktop\NavegadorChrominium\chromium\patches\0001-atlas-vertical-tabs-dark-defaults.patch
git apply C:\Users\Axel\Desktop\NavegadorChrominium\chromium\patches\0002-atlas-branding.patch
git apply C:\Users\Axel\Desktop\NavegadorChrominium\chromium\patches\0003-atlas-windows-install-identity.patch
git apply C:\Users\Axel\Desktop\NavegadorChrominium\chromium\patches\0004-atlas-product-version.patch
git apply C:\Users\Axel\Desktop\NavegadorChrominium\chromium\patches\0005-atlas-drm-import.patch
git apply C:\Users\Axel\Desktop\NavegadorChrominium\chromium\patches\0006-atlas-sidebar-navigation.patch
& C:\Users\Axel\Desktop\NavegadorChrominium\tools\chromium\apply-branding.ps1
```

O primeiro patch ativa as abas verticais expandidas e o tema escuro em perfis
novos. Abas fixadas fornecem a persistência usada pelas Guias essenciais e
começam vazias.

O segundo patch aplica o nome Atlas aos recursos principais e atualiza a versão
dos ícones de perfil. O script copia os arquivos visuais versionados para os
caminhos nativos do Chromium e troca o nome visível do produto para Atlas em
mensagens e traduções. Identificadores internos, URLs, licenças e referências
técnicas ao motor Chromium são preservados para manter compatibilidade. Para
os WebUIs nativos, o script também substitui favicons, logos de 16/32 px em
densidades 1x/2x, a assinatura visual usada em diálogos, o ícone vetorial de
avisos e menus, os ícones do executável, associações de arquivos e instalador.
Para regenerar os recursos visuais a partir do SVG oficial:

```powershell
python -m pip install -r tools\chromium\requirements-branding.txt
python tools\chromium\generate-branding.py
```

O terceiro patch separa os diretórios de instalação e perfil, ProgIDs, protocolo,
identificadores COM e identidade do sandbox do Atlas. Essa separação evita colisão
com instalações do Chromium no Windows.

O quarto patch exibe a versão própria do Atlas antes da versão técnica do motor.
`atlas-version.json` é a fonte de verdade do produto. O script de branding gera o
cabeçalho nativo e os metadados `ProductVersion` do Windows sem alterar a versão
interna usada pelo Chromium para compatibilidade.

O quinto patch adiciona `Configurações > Privacidade e segurança > DRM`. A
página reutiliza o controle nativo de conteúdo protegido e permite detectar e
importar, mediante ação explícita do usuário, uma instalação local válida do
Widevine presente no Microsoft Edge ou Google Chrome. O Atlas valida manifesto,
versão, biblioteca e assinatura antes da cópia e só permite remover versões que
ele próprio marcou como gerenciadas.

O sexto patch transforma a navegação em uma sidebar nativa única: menu,
recolher, voltar, avançar e recarregar ficam na primeira linha; o omnibox real
fica na segunda; e as abas aparecem imediatamente abaixo. A seção Essenciais
permite promover a guia atual pelo botão `+`; as guias promovidas usam a grade
nativa de favicons das abas fixadas, persistem com a sessão e começam vazias.
Downloads e Conta permanecem fixos no rodapé. Quando recolhida, a sidebar
preserva somente o controle de expansão, os favicons das abas e as ações
compactas. Em uma janela maximizada, minimizar, restaurar e fechar aparecem
somente quando o ponteiro alcança a extremidade superior direita; em uma janela
restaurada, permanecem visíveis. A Nova guia usa a identidade Atlas, mantém o
Google como mecanismo de busca e exibe apenas atalhos criados explicitamente
pelo usuário. A toolbar WebUI experimental do Chromium é desativada para
preservar os controles Views que podem ser compostos lateralmente sem duplicar
estado, permissões ou sugestões.

Os workspaces usam o modo nativo de foco dos grupos de abas. `Geral` reúne as
abas comuns que ainda não pertencem a um workspace; cada workspace mantém seu
próprio conjunto de abas, enquanto os Essenciais continuam visíveis em todos.
O seletor no rodapé permite ir ao workspace anterior ou seguinte, criar um novo
e editar seu nome e cor. Com a sidebar recolhida, o botão central alterna para
o próximo workspace. `Ctrl+Alt+Q` e `Ctrl+Alt+E` alternam para o anterior e o
seguinte. Os grupos, suas abas e o workspace ativo são restaurados pela sessão
nativa.

## Streaming e conteúdo protegido

As configurações GN de Windows habilitam H.264, AAC e MP4 pelo perfil técnico
`ffmpeg_branding = "Chrome"`, além da infraestrutura EME e do componente
Widevine. Esse valor configura os codecs do FFmpeg; ele não transforma o produto
em Google Chrome e não inclui o CDM proprietário no repositório ou no instalador.

Para verificar a build local com um perfil temporário e isolado:

```powershell
node tools\chromium\verify-streaming.mjs
```

O teste consulta `MediaSource`, `HTMLMediaElement`, EME e
`com.widevine.alpha`. H.264/AAC podem funcionar sem que Widevine esteja
disponível. O Atlas não inclui nem redistribui o CDM. A importação local é
experimental, permanece no perfil do usuário e não concede autorização para
redistribuir o componente. Compatibilidade e permissão de uso continuam sujeitas
aos termos do fornecedor do navegador de origem e do Widevine.
