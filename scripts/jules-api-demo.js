#!/usr/bin/env node
import { julesRest } from '../services/julesRest.js';

const argv = process.argv.slice(2);
const command = argv[0] || 'help';

const log = (title, data) => {
    console.log(`=== ${title} ===`);
    console.log(JSON.stringify(data, null, 2));
    console.log();
};

const prompt = (text) => {
    const [, question] = text.split(':');
    return question?.trim();
};

async function main() {
    try {
        switch (command) {
            case 'status':
                log('Status', await julesRest.status());
                break;
            case 'health':
                log('Health', await julesRest.health());
                break;
            case 'sources':
                log('Sources', await julesRest.listSources());
                break;
            case 'session': {
                const promptText = argv[1] || 'Create a Jules API demo note';
                const source = process.env.JULES_SOURCE;
                if (!source) {
                    throw new Error('Define JULES_SOURCE env var (e.g., sources/github/owner/repo).');
                }
                const payload = {
                    prompt: promptText,
                    sourceContext: {
                        source,
                        githubRepoContext: {
                            startingBranch: 'main',
                        },
                    },
                    automationMode: 'AUTO_CREATE_PR',
                    title: `Demo ${Date.now()}`,
                };
                log('Create Session', await julesRest.createSession(payload));
                break;
            }
            case 'instructions':
            default:
                console.log('Usage: npm run jules:demo <command>');
                console.log('Commands: status | health | sources | session "<prompt>"');
                console.log('Set JULES_SOURCE to a valid source name for the session command.');
        }
    } catch (error) {
        console.error('Jules API error:', error.message);
        process.exitCode = 1;
    }
}

main();
