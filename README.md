# Atlas

Atlas é um navegador desktop baseado em Chromium, construído com Electron.

> Explore a web. Encontre seu caminho.

## Primeira versão

- navegação por endereço ou pesquisa;
- voltar, avançar, recarregar e ir para o início;
- atalhos de teclado essenciais;
- sessão persistente separada (`persist:atlas`);
- conteúdo remoto isolado, sem acesso às APIs do Node.js;
- bloqueio inicial de permissões sensíveis solicitadas por sites.

## Desenvolvimento

Requer Node.js 22 ou superior.

```bash
npm install
npm start
```

Validação local:

```bash
npm test
npm run check
```

## Atalhos

| Atalho | Ação |
| --- | --- |
| `Ctrl+L` | Focar a barra de endereço |
| `Alt+Esquerda` | Voltar |
| `Alt+Direita` | Avançar |
| `Ctrl+R` ou `F5` | Recarregar |
| `Esc` | Parar o carregamento |

## Status

MVP em desenvolvimento. Abas, favoritos, histórico e gerenciamento de downloads
serão adicionados nas próximas etapas.
