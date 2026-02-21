const esbuild = require('esbuild');
const fs = require('fs');

const VERSION = require('./package.json').version;

const banner = `/**
 * BeBranded Contents
 * Contenus additionnels pour Webflow
 * @version ${VERSION}
 * @author BeBranded
 * @license MIT
 * @website https://www.bebranded.xyz
 *
 * GENERATED FILE — do not edit directly.
 * Edit src/ files and run: npm run build
 */`;

async function build() {
    // Unminified build — no sourcemap footer
    // No globalName: the IIFE runs as a side-effect; window.bbContents is set inside core.js.
    // Using globalName would create an outer `var bbContents = IIFE()` that receives the
    // CJS exports wrapper and overrides the window.bbContents set inside, breaking all
    // module method calls that reference `bbContents` at runtime.
    await esbuild.build({
        entryPoints: ['src/core.js'],
        bundle: true,
        format: 'iife',
        outfile: 'bb-contents.js',
        sourcemap: false,
        banner: { js: banner },
        target: ['es2017'],
    });

    // Minified build + sourcemap
    await esbuild.build({
        entryPoints: ['src/core.js'],
        bundle: true,
        format: 'iife',
        outfile: 'bb-contents.min.js',
        minify: true,
        sourcemap: true,
        banner: { js: banner },
        target: ['es2017'],
    });

    console.log(`bb-contents v${VERSION} built successfully.`);
}

build().catch(err => {
    console.error(err);
    process.exit(1);
});
