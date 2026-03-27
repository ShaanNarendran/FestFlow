const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Chandhini/Desktop/FestFlow/frontend/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/color:\s*'var\(--cherry-cola\)'/g, "color: 'var(--text-primary)'");
  content = content.replace(/color:\s*'var\(--cherry-dark\)'/g, "color: 'var(--text-primary)'");
  content = content.replace(/background:\s*'var\(--cherry-cola\)'/g, "background: 'var(--bg-dark)'");
  content = content.replace(/background:\s*'var\(--cream-vanilla\)'/g, "background: 'var(--bg-primary)'");
  content = content.replace(/border:\s*'[^']*var\(--cherry-cola\)[^']*'/g, "border: 'none'");
  content = content.replace(/borderTopColor:\s*'var\(--cherry-cola\)'/g, "borderTopColor: 'var(--accent)'");
  content = content.replace(/borderTop:\s*'[^']*var\(--cherry-cola\)[^']*'/g, "borderTop: '2px solid var(--border)'");
  content = content.replace(/borderLeft:\s*'[^']*var\(--cherry-cola\)[^']*'/g, "borderLeft: '4px solid var(--accent)'");

  content = content.replace(/var\(--cherry-cola\)/g, "var(--text-primary)");
  content = content.replace(/var\(--cherry-dark\)/g, "var(--text-primary)");
  content = content.replace(/var\(--cream-vanilla\)/g, "var(--bg-primary)");

  fs.writeFileSync(filePath, content);
});

const indexCssPath = 'c:/Users/Chandhini/Desktop/FestFlow/frontend/src/index.css';
let css = fs.readFileSync(indexCssPath, 'utf8');
css = css.replace(/var\(--cherry-cola\)/g, "var(--accent)");
fs.writeFileSync(indexCssPath, css);

console.log('Done');
