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
┌────── lateral Atlas ──────┬───────────────────────────────────────────────┐
│ menu · recolher · ← → ↻   │                                               │
│ endereço                 │                                               │
│ workspace ativo          │                                               │
│ Essenciais           +   │               conteúdo da página              │
│ abas abertas             │                                               │
│ + Nova guia              │                                               │
│                          │                                               │
│ downloads · conta     +  │                                               │
└──────────────────────────┴───────────────────────────────────────────────┘
```

- largura inicial expandida: `240 px`, redimensionável pelo usuário;
- largura mínima expandida: `224 px`; lateral recolhida: `56 px`;
- estado inicial: expandido, com possibilidade de recolher;
- abas fixadas representam atalhos e começam vazias;
- atalhos aparecem somente após ação explícita do usuário;
- abas comuns preservam título, favicon, áudio, descarte, grupos e arrastar/soltar;
- o tema inicial é escuro, mas continua configurável;
- o estado de largura e recolhimento usa as preferências nativas do perfil.

No modo recolhido, expansão e menu permanecem no topo. Downloads, conta e
criação de workspace são empilhados no rodapé; o seletor de workspace só
aparece quando há grupos. O rodapé não usa um espaçador flexível interno:
suas posições dependem dos limites do contêiner, evitando botões no meio da
lateral. Essenciais começam vazios e a lista nativa de abas mantém rolagem.

Quando os Essenciais estão vazios, a seção mostra apenas `+ Adicionar essencial`,
em uma linha de 32 px e sem fundo preenchido permanente. A ação fixa a guia
atual. Ao existir pelo menos uma guia fixada, a linha passa a mostrar o título
`Essenciais` com um botão `+` compacto, seguido pela grade nativa. Fechar ou
desafixar o último item restaura a apresentação vazia. O botão tem foco de
teclado e nome acessível; fica desabilitado se a guia ativa já estiver fixada.

Ao passar o mouse sobre a sidebar recolhida, o painel sobrepõe temporariamente
a página na largura salva, sem mudar a preferência de recolhimento. Os controles
mudam juntos para a apresentação expandida quando há pelo menos 224 px. O
cabeçalho conserva 88 px nos dois estados; menus de sugestões mantêm a sidebar
aberta enquanto estão em uso.

No Windows, a faixa dos controles de janela ocupa 32 px acima da sidebar e da
página, em vez de sobrepor conteúdo. Maximizada, a janela mostra uma borda de
ativação de 3 px: passar o mouse revela a faixa, e sair dela recolhe novamente.
Restaurada, a faixa permanece disponível. Seu espaço livre funciona como área
de arraste nativo; minimizar, maximizar/restaurar e fechar preservam as ações
do Windows. No modo de toque a faixa permanece visível, e fullscreen continua
sem essa faixa.

A abertura da faixa usa 180 ms e o recolhimento 160 ms, com aceleração e
desaceleração suaves. A página e a sidebar acompanham a altura animada; os
ícones mantêm o tamanho. Inverter o hover reverte o movimento da posição atual,
sem reiniciar do extremo. A preferência de movimento reduzido é respeitada.

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
