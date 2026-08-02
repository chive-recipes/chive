import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig(({ command }) => {
  return {
    server: {
      host: '127.0.0.1'
    },
    plugins: [
      command === 'build' && {
        name: 'lucide-preact-rewriter',
        enforce: 'pre',
        transform(code: string, id: string) {
          if (id.includes('node_modules')) return null;
          if (!code.includes('lucide-preact')) return null;

          return code.replace(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-preact['"];?/g, (_: string, importsStr: string) => {
            const imports = importsStr.split(',').map((s: string) => s.trim()).filter(Boolean);
            return imports.map((imp: string) => {
              const [importName, alias] = imp.split(/\s+as\s+/);
              const kebab = importName.trim().replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([a-zA-Z])([0-9])/g, '$1-$2').toLowerCase();
              const aliasName = alias ? alias.trim() : importName.trim();
              return `import ${aliasName} from 'lucide-preact/dist/esm/icons/${kebab}.js';`;
            }).join('\n');
          });
        }
      },
      preact()
    ].filter(Boolean)
  };
});
