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
& C:\Users\Axel\Desktop\NavegadorChrominium\tools\chromium\apply-branding.ps1
```

O primeiro patch ativa as abas verticais expandidas e o tema escuro em perfis
novos. Abas fixadas funcionam como os atalhos da lateral e começam vazias.

O segundo patch aplica o nome Atlas aos recursos principais e atualiza a versão
dos ícones de perfil. O script copia os arquivos visuais versionados para os
caminhos nativos do Chromium. Para regenerá-los a partir do SVG oficial:

```powershell
python -m pip install -r tools\chromium\requirements-branding.txt
python tools\chromium\generate-branding.py
```

O terceiro patch separa os diretórios de instalação e perfil, ProgIDs, protocolo,
identificadores COM e identidade do sandbox do Atlas. Essa separação evita colisão
com instalações do Chromium no Windows.
