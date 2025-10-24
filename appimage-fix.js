const child_process = require('child_process');
const fs = require('fs');
const path = require('path');

// App name from package.json build.productName
const appName = "zh-cn-to-tw-converter";

function isLinux(targets) {
    const re = /AppImage|snap|deb|rpm|freebsd|pacman/i;
    return !!targets.find(target => re.test(target.name));
}

async function afterPack({ targets, appOutDir }) {
    if (!isLinux(targets)) {
        console.log('Not a Linux target, skipping AppImage sandbox fix');
        return;
    }

    console.log('Applying AppImage sandbox fix...');

    const scriptPath = path.join(appOutDir, appName);
    const script = '#!/bin/bash\n"${BASH_SOURCE%/*}"/' + appName + '.bin "$@" --no-sandbox\n';

    return new Promise((resolve, reject) => {
        // Rename the original executable to .bin
        const child = child_process.exec(`mv "${appName}" "${appName}.bin"`, { cwd: appOutDir });

        child.on('exit', (code) => {
            if (code !== 0) {
                console.error('Failed to rename executable');
                reject(new Error('Failed to rename executable'));
                return;
            }

            // Create wrapper script
            fs.writeFileSync(scriptPath, script);
            console.log('Created wrapper script:', scriptPath);

            // Make wrapper executable
            const chmodChild = child_process.exec(`chmod +x "${appName}"`, { cwd: appOutDir });

            chmodChild.on('exit', (code) => {
                if (code !== 0) {
                    console.error('Failed to make wrapper executable');
                    reject(new Error('Failed to make wrapper executable'));
                    return;
                }

                console.log('AppImage sandbox fix applied successfully!');
                resolve();
            });
        });
    });
}

module.exports = afterPack;
