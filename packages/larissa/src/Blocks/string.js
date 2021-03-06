// @flow
import type Context from '../BlockContext';

export default {
    name: 'string',
    outputs: [
        {name: 'string', type: 'string'}
    ],
    options: {
        type: 'object',
        properties: {
            value: {
                type: 'string',
                required: true,
                multiLine: true
            }
        }
    },
    executor: setOutput
};

async function setOutput(ctx: Context) {
    ctx.setOutput('string', ctx.getOptions().value);
}
