import { test, expect } from '@playwright/test';
import urls from '../urls.json';

test.describe('Auditoria de Abertura de Guia de Links', () => {

  for (const url of urls) {
    test(`Validar regras de links na página: ${url}`, async ({ page }) => {
      // Carrega a página rapidamente sem esperar mídias pesadas
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      // Mapeia todos os elementos de link (tag <a>)
      const links = await page.locator('a[href]').all();

      for (const link of links) {
        const href = await link.getAttribute('href');
        let target = await link.getAttribute('target');

        // 🛠️ CORREÇÃO: Limpa aspas extras que o dev possa ter colocado no HTML
        if (target) {
          target = target.replace(/["']/g, '');
        }

        // Ignora âncoras, rotas dinâmicas, e-mails e telefones
        if (!href || href.startsWith('#') || href.startsWith('javascript') || href.startsWith('mailto:') || href.startsWith('tel:')) {
          continue;
        }

        // 🛑 EXCEÇÕES: Ignora os links específicos e seções fora do escopo
        if (
          href.includes('suporte.totvs.com') || 
          href.includes('espacolegislacao.totvs.com') ||
          href.includes('es.totvs.com') ||
          href.includes('en.totvs.com') ||
          href.includes('midias-totvs.totvs.com') || // Ignora arquivos de mídia
          href.includes('/blog/') ||                 // Ignora artigos do blog
          href.includes('youtube.com') ||            // Ignora links do YouTube
          href.includes('youtu.be')                  // Ignora links curtos do YouTube
        ) {
          continue; // Pula a validação e vai para o próximo link
        }

        // Regra: É site externo se começar com http E NÃO tiver 'totvs.com'
        const ehExterno = href.startsWith('http') && !href.includes('totvs.com');
        
        // Regra: É subdomínio se tiver 'totvs.com' mas NÃO for o 'www' principal
        const ehSubdominio = href.startsWith('http') && href.includes('totvs.com') && !href.includes('www.totvs.com');

        // Captura o texto do link e o HTML completo do elemento para facilitar a localização
        const textoLink = (await link.innerText()).trim().replace(/\s+/g, ' ') || '[Ícone ou Imagem sem texto]';
        const htmlElemento = await link.evaluate(el => el.outerHTML);

        if (ehExterno || ehSubdominio) {
          // REGRA 1: Subdomínios/Externos DEVEM abrir em nova aba
          expect(
            target, 
            `\n\n🔴 FALHA NA PÁGINA: ${url}` +
            `\n🔗 URL do Link (href): ${href}` +
            `\n📝 Texto visível na tela: "${textoLink}"` +
            `\n💻 HTML do Elemento: ${htmlElemento}` +
            `\n⚠️ MOTIVO: Deveria ter target="_blank" mas veio "${target}"\n`
          ).toBe('_blank');

        } else {
          // REGRA 2: Mesmo domínio (www ou relativos /contato) NÃO DEVE abrir em nova aba
          expect(
            target, 
            `\n\n🔴 FALHA NA PÁGINA: ${url}` +
            `\n🔗 URL do Link (href): ${href}` +
            `\n📝 Texto visível na tela: "${textoLink}"` +
            `\n💻 HTML do Elemento: ${htmlElemento}` +
            `\n⚠️ MOTIVO: NÃO deveria ter target="_blank"\n`
          ).not.toBe('_blank');
        }
      }
    });
  }

});