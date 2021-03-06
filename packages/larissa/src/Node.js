// @flow
import uuid from 'uuid/v4';

import InputPort from './InputPort';
import OutputPort from './OutputPort';
import EventEmitter from 'events';

export default class Node extends EventEmitter {
    id: string;
    _status: NodeStatus;
    inputs: Map<string, InputPort>;
    outputs: Map<string, OutputPort>;
    defaultInput: ?InputPort;
    defaultOutput: ?OutputPort;
    error: Error;
    title: string;

    constructor(id: ?string) {
        super();
        this.id = id || uuid();
        this.inputs = new Map();
        this.outputs = new Map();
        this._status = INSTANTIATED;
    }

    hasDefaultInput(): boolean {
        return !!this.defaultInput;
    }

    hasDefaultOutput(): boolean {
        return !!this.defaultOutput;
    }

    get kind(): string {
        throw new Error('Node.kind: implement me');
    }

    setOptions(options: Object): void { // eslint-disable-line no-unused-vars
        throw new Error('Node.setOptions: implement me');
    }

    setTitle(title: string): void {
        this.title = title;
        this.emit('change', 'title', title);
    }

    output(name?: string): OutputPort {
        if (name === undefined) {
            const output = this.defaultOutput;
            if (!output) throw new Error('Node has no default output');
            return output;
        } else {
            const output = this.outputs.get(name);
            if (!output) throw new Error(`Unknown output: ${name}`);
            return output;
        }
    }

    input(name?: string): InputPort {
        if (name === undefined) {
            const input = this.defaultInput;
            if (!input) throw new Error('Node has no default input');
            return input;
        } else {
            const input = this.inputs.get(name);
            if (!input) throw new Error(`Unknown input: ${name}`);
            return input;
        }
    }

    set status(status: NodeStatus) {
        if (this._status !== status) {
            this._status = status;
            this.emit('change', 'status', status);
        }
    }

    get status(): NodeStatus {
        return this._status;
    }

    computeStatus(): void {
        this.status = this._computeStatus();
    }

    _computeStatus(): NodeStatus {
        throw new Error('implement _computeStatus');
    }

    reset(): void {
        this.computeStatus();
        for (const input of this.inputs.values()) {
            input.reset();
        }
        for (const output of this.outputs.values()) {
            output.reset();
        }
    }

    resetInput(input: InputPort): void {
        input.reset();
        this.computeStatus();
    }

    _canRun(): boolean {
        throw new Error('Node._canRun: implement me');
    }

    canRun(): boolean {
        // check all required inputs are present
        for (const input of this.inputs.values()) {
            if (input.isRequired() && !input.hasValue()) {
                return false;
            }
        }
        return this._canRun();
    }

    async run() {
        if (!this.canRun()) {
            this.status = ERRORED;
            throw new Error('Cannot run node, required input ports do not have values');
        }
        // TODO: how can we prevent the end-user to set status?
        if (this.status === RUNNING) {
            throw new Error('node is already running');
        }
        if (this.status === FINISHED) {
            return;
        }
        this.status = RUNNING;
        try {
            await this._run();
        } catch (e) {
            this.status = ERRORED;
            this.error = e;
            throw e;
        }
        this.status = FINISHED;
    }

    async _run() {
        throw new Error('Node.run: implement me');
    }

    inspect(): Object {
        return this.toJSON();
    }

    toJSON(): Object {
        return {
            kind: 'node'
        };
    }
}

export const INSTANTIATED: 'INSTANTIATED' = 'INSTANTIATED';
export const READY: 'READY' = 'READY';
export const ERRORED: 'ERRORED' = 'ERRORED';
export const RUNNING: 'RUNNING' = 'RUNNING';
export const FINISHED: 'FINISHED' = 'FINISHED';

export type NodeStatus = typeof INSTANTIATED | typeof READY | typeof ERRORED | typeof RUNNING | typeof FINISHED;
