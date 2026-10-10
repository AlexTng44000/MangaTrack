import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const modulesDirectory =
    path.resolve('src/modules');

function getTypeScriptFiles(
    directory: string,
): string[] {
    const entries =
        fs.readdirSync(directory, {
            withFileTypes: true,
        });

    return entries.flatMap((entry) => {
        const fullPath =
            path.join(directory, entry.name);

        if (entry.isDirectory()) {
            return getTypeScriptFiles(fullPath);
        }

        if (entry.isFile() && entry.name.endsWith('.ts')) {
            return [fullPath];
        }

        return [];
    });
}

test(
    'les modules métier ne dépendent pas directement de infrastructure ou integrations',
    () => {
        const files =
            getTypeScriptFiles(modulesDirectory);

        const violations: string[] = [];

        for (const file of files) {
            const content =
                fs.readFileSync(file, 'utf8');

            const forbiddenImport =
                /from\s+['"][^'"]*(infrastructure|integrations)[^'"]*['"]/;

            if (forbiddenImport.test(content)) {
                violations.push(
                    path.relative(process.cwd(), file),
                );
            }
        }

        assert.deepEqual(
            violations,
            [],
            `Imports interdits détectés :\n${violations.join('\n')}`,
        );
    },
);

test(
    'les modules métier ne dépendent pas directement des technologies techniques',
    () => {
        const files =
            getTypeScriptFiles(modulesDirectory);

        const violations: string[] = [];

        const forbiddenPackages = [
            'bullmq',
            'ioredis',
            'pg',
        ];

        for (const file of files) {
            const content =
                fs.readFileSync(file, 'utf8');

            for (const packageName of forbiddenPackages) {
                const pattern =
                    new RegExp(
                        `from\\s+['"]${packageName}['"]`,
                    );

                if (pattern.test(content)) {
                    violations.push(
                        `${path.relative(
                            process.cwd(),
                            file,
                        )} → ${packageName}`,
                    );
                }
            }
        }

        assert.deepEqual(
            violations,
            [],
            `Dépendances techniques interdites :\n${violations.join('\n')}`,
        );
    },
);