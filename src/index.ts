#!/usr/bin/env node
import { AssemblyServer } from './assemblyserver.js';

const server = new AssemblyServer();
server.run().catch(console.error);