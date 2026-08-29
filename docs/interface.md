# Interface nativa do Atlas

## Direção visual

O Atlas usa a navegação vertical como estrutura principal. A lateral deve parecer
parte da janela, não um painel web encaixado sobre o navegador. A página continua
sendo o foco; a identidade aparece na geometria da janela, no contraste das
superfícies e na marca, sem alterar arbitrariamente o conteúdo dos sites.

### Paleta oficial

- `Cyan` — `#00CBFD`;
- `Azure` — `#0095FD`;
- `Blue` — `#0F5BFC`;
- `Indigo` — `#5729FC`;
- `Violet` — `#8E25FC`;
- `Night` — `#060B24`.

O símbolo usa o gradiente vertical na ordem acima. `Night` é a base da variante
escura do ícone e a cor institucional profunda da interface. Superfícies neutras
do Chromium continuam sendo usadas como apoio para preservar contraste e
legibilidade.

Nesta primeira camada, o tema escuro nativo do Chromium fornece as superfícies e
contrastes. Tokens próprios serão introduzidos somente onde o resultado nativo não
corresponder à referência, evitando duplicar o sistema de cores do navegador.

## Estrutura

```text
┌──────── lateral Atlas ────────┬──────── barra de endereço ────────────────┐
│ controles da lateral          │ voltar · avançar · recarregar · endereço │
│ atalhos fixados pelo usuário  ├───────────────────────────────────────────┤
│ grupos/espaços                │                                           │
│ abas abertas                  │              conteúdo da página           │
│                               │                                           │
│ nova aba e ferramentas        │                                           │
└───────────────────────────────┴───────────────────────────────────────────┘
```

- largura inicial expandida: `240 px`, redimensionável pelo usuário;
- estado inicial: expandido, com possibilidade de recolher;
- abas fixadas representam atalhos e começam vazias;
- atalhos aparecem somente após ação explícita do usuário;
- abas comuns preservam título, favicon, áudio, descarte, grupos e arrastar/soltar;
- o tema inicial é escuro, mas continua configurável;
- o estado de largura e recolhimento usa as preferências nativas do perfil.

## Entrega 1

O patch `0001-atlas-vertical-tabs-dark-defaults.patch` ativa a implementação
nativa de abas verticais em perfis novos e muda o esquema inicial da interface
para escuro. Essa escolha mantém extensões, DevTools, downloads, histórico,
restauração de sessão e acessibilidade ligados aos mesmos modelos internos do
Chromium.

## Entrega 2

A identidade visual oficial foi incorporada aos recursos nativos. O SVG fornecido
é a fonte canônica para a marca funcional; os PNGs são gerados nas resoluções
esperadas pelo Chromium; e o executável do Windows usa um ICO com múltiplos
tamanhos sobre fundo `Night`. A arte com glow permanece reservada a contextos
institucionais de alta resolução.

## Próximas camadas

1. ajustar cores e espaçamentos da lateral após comparação visual em tamanho real;
2. traduzir o conceito de espaços da referência para grupos persistentes;
3. validar lateral recolhida, janela restaurada, maximizada e múltiplas janelas;
4. testar foco, teclado, leitores de tela e contraste em ambos os temas.
