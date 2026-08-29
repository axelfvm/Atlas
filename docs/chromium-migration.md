# Migração do Atlas para Chromium

## Decisão

O Atlas será construído diretamente sobre o Chromium. Electron deixa de ser a base
do produto e passa a servir apenas como protótipo de comportamento e interface.

O repositório `axelfvm/Atlas` guarda a identidade do produto, ferramentas, testes e
uma pilha de patches. O checkout upstream fica fora dele, por padrão em
`C:\src\atlas-chromium\src`. Essa separação torna atualizações do Chromium mais
controláveis e evita duplicar o enorme repositório upstream no GitHub.

## Princípios da integração

1. Fixar uma revisão estável do Chromium antes de criar patches.
2. Manter cada funcionalidade Atlas em patch pequeno e revisável.
3. Nunca copiar binários proprietários do Google Chrome.
4. Tratar atualizações do Chromium como atualizações de segurança prioritárias.
5. Testar extensões, DRM, perfis, atualização e instalação em uma máquina limpa.

## Preservação e retomada do build

O Ninja salva cada arquivo intermediário concluído dentro de `out\Atlas`. Fechar
o terminal, reiniciar o Windows ou ocorrer uma falha não exige recompilar tudo:
o comando abaixo verifica os arquivos existentes e executa somente as etapas que
continuam pendentes ou cujas entradas mudaram:

```powershell
.\tools\chromium\build.ps1
```

Para preservar esse ganho, não apagar `C:\src\atlas-chromium\src\out\Atlas`, não
executar `gn clean` e não alterar `args.gn` durante uma compilação em andamento.
Configurações de release e experimentos devem usar outros diretórios, como
`out\AtlasRelease`, evitando invalidar o build de desenvolvimento.

O build de desenvolvimento já reduz símbolos de Blink e V8 e usa component build.
Depois da primeira compilação limpa, as compilações seguintes serão incrementais e
normalmente muito menores. Limitar manualmente a quantidade de processos com
`-Jobs` só deve ser necessário se a máquina ficar sem memória; aumentar esse valor
acima do escolhido automaticamente pelo `autoninja` pode deixar o build mais lento.

## Fases

### 1. Ambiente e compilação limpa

- validar Windows, NTFS, espaço livre, Git e Visual Studio;
- instalar `depot_tools` fora do repositório;
- obter o Chromium com `fetch chromium`;
- gerar `out\Atlas` e compilar o alvo `chrome` sem modificações;
- registrar a revisão upstream que compilou com sucesso.

#### Base validada em 28/08/2026

- revisão upstream: `5f6de63eb46d3cb59d464aab56087ded7c40b557`;
- versão Chromium: `154.0.8031.0`;
- checkout: `C:\src\atlas-chromium\src`;
- configuração: `out\Atlas`, Windows x64, debug component build;
- alvo `chrome`: compilado com sucesso;
- executável: `C:\src\atlas-chromium\src\out\Atlas\chrome.exe`;
- smoke test: processo iniciado com sucesso usando o perfil isolado
  `C:\src\atlas-chromium\profiles\atlas-smoke`;
- o perfil do Google Chrome instalado no computador não foi utilizado.

### 2. Identidade Atlas

- substituir nome, ícones, diretórios de instalação/perfil, ProgIDs, protocolo,
  identificadores COM e identidade do sandbox;
- remover marcas e integrações exclusivas do Google Chrome;
- definir política de versionamento própria;
- gerar instalador assinado para Windows.

### 3. Interface

- implementar barra lateral e guias verticais nativas;
- iniciar sem atalhos laterais;
- persistir atalhos e estado maximizado/restaurado no perfil;
- aplicar a identidade visual aprovada para o Atlas.

### 4. Extensões

- preservar o mecanismo nativo de extensões do Chromium;
- validar Manifest V3, service workers, permissões e páginas de opções;
- permitir inspecionar páginas, service workers e extensões pelo DevTools;
- criar uma matriz de extensões reais para testes de regressão;
- avaliar a distribuição pela Chrome Web Store separadamente, conforme seus
  termos e requisitos técnicos.

### 4.1 Busca padrão

- usar o Google como mecanismo de busca inicial em perfis novos;
- preservar a configuração nativa para que o usuário possa escolher outro
  mecanismo a qualquer momento;
- não aplicar política obrigatória nem sobrescrever uma escolha já feita pelo
  usuário;
- validar pesquisas pela barra de endereço e pela página de nova guia.

### 5. Ferramentas de desenvolvimento

- preservar o frontend e os protocolos nativos do Chrome DevTools;
- abrir pelo `F12`, `Ctrl+Shift+I`, menu principal e menu “Inspecionar”;
- manter Console, Elementos, Rede, Fontes, Aplicativo, Desempenho e Memória;
- suportar inspeção de páginas, iframes, workers e extensões;
- manter depuração remota desativada por padrão;
- permitir depuração remota somente quando o usuário iniciar explicitamente o
  Atlas com uma opção de desenvolvimento.

### 6. Conteúdo protegido

- integrar Widevine somente por canal autorizado e documentado;
- deixar DRM habilitado por padrão;
- adicionar controle global em Privacidade e segurança;
- ao desabilitar, negar EME e identificadores de conteúdo protegido;
- validar primeiro um player de teste Widevine e depois Netflix e Crunchyroll;
- não anunciar compatibilidade com um serviço antes do teste real.

### 7. Downloads

- preservar a infraestrutura nativa de downloads e Safe Browsing do Chromium;
- exibir o botão de downloads na barra quando houver atividade;
- mostrar nome, origem, progresso, velocidade, tamanho e tempo restante;
- permitir pausar, continuar, cancelar e tentar novamente;
- permitir abrir o arquivo concluído ou mostrar sua pasta no Explorador;
- disponibilizar histórico pesquisável em uma página interna do Atlas;
- resolver nomes duplicados sem sobrescrever arquivos existentes;
- avisar e exigir confirmação para arquivos perigosos ou bloqueados;
- manter downloads anônimos separados e eliminá-los do histórico ao encerrar;
- oferecer configuração da pasta padrão e opção de perguntar onde salvar;
- restaurar downloads interrompidos quando tecnicamente possível;
- permitir remover um item do histórico sem apagar silenciosamente o arquivo.

### 8. Histórico

- usar o banco de histórico nativo do Chromium no perfil do Atlas;
- registrar título, endereço, data, horário e quantidade de visitas;
- oferecer página interna pesquisável, agrupada por data;
- integrar páginas visitadas às sugestões da barra de endereço;
- permitir reabrir, copiar o endereço ou excluir uma entrada individual;
- permitir apagar a última hora, 24 horas, 7 dias, 4 semanas ou todo o período;
- remover também os índices derivados quando o usuário apagar o histórico;
- não registrar navegação, pesquisas ou downloads persistentes no modo anônimo;
- manter os dados locais por padrão, sem sincronização automática com terceiros;
- deixar uma futura sincronização criptografada dependente de conta e consentimento.

### 9. Atualizações

- acompanhar uma versão estável do Chromium;
- aplicar e testar os patches Atlas sobre cada nova revisão;
- assinar binários e manifesto de atualização;
- oferecer download em segundo plano e instalação segura no reinício;
- manter rollback para a última versão íntegra.

## Critérios da primeira versão Chromium

- `chrome` e `mini_installer` compilam em Windows x64;
- produto e perfil aparecem como Atlas, sem colisão com Chrome/Chromium;
- janela restaura corretamente seu estado;
- atalhos começam vazios e persistem quando criados;
- extensões Manifest V3 da matriz de testes funcionam;
- DevTools abre pelos atalhos, menu e contexto e inspeciona extensões;
- downloads podem ser acompanhados, pausados, retomados, cancelados e localizados;
- histórico, arquivos perigosos, nomes duplicados e modo anônimo são validados;
- histórico pode ser pesquisado, apagado por período e não vaza do modo anônimo;
- DRM pode ser ligado e desligado, começando ligado;
- Netflix e Crunchyroll têm resultado de teste registrado;
- atualização assinada é validada entre duas versões do Atlas.

## Limites legais e de distribuição

Chromium é código aberto, mas Google Chrome, seus ícones, chaves de API e alguns
componentes não fazem parte automaticamente dessa licença. Widevine exige uma
integração e distribuição autorizadas. A implementação do Atlas deverá manter essa
fronteira explícita em código, documentação e pacotes publicados.
