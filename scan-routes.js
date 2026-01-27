const fs = require('fs');
const path = require('path');

function scanDir(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            scanDir(filePath, fileList);
        } else {
            if (file === 'route.ts') fileList.push(filePath);
        }
    });
    return fileList;
}

const apiDir = path.join(process.cwd(), 'app', 'api');
const routes = scanDir(apiDir);

let output = 'API Route Isolation Scan:\n-------------------------\n';
let safeRoutes = 0;
let riskyRoutes = 0;

routes.forEach(route => {
    const content = fs.readFileSync(route, 'utf8');
    const relativePath = path.relative(process.cwd(), route);

    // Skip public routes (auth, webhooks, uploadthing)
    if (relativePath.includes('auth') || relativePath.includes('webhook') || relativePath.includes('uploadthing') || relativePath.includes('public')) {
        return;
    }

    const hasTenantAuth = content.includes('requireTenantAuth');

    if (!hasTenantAuth) {
        output += `❌ Missing Tenant Auth: ${relativePath}\n`;
        riskyRoutes++;
    } else {
        safeRoutes++;
    }
});

output += `\nSummary:\n✅ Protected Routes: ${safeRoutes}\n❌ Potential Risks: ${riskyRoutes}\n`;
fs.writeFileSync('audit-routes.txt', output);
console.log('API Scan written to audit-routes.txt');
