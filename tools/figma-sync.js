/**
 * Wonderwall-Pi Official Figma API Integration Tool
 * Uses Figma Official REST API with Personal Access Token
 */

const fs = require('fs');
const path = require('path');

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = process.env.FIGMA_FILE_KEY;
const BASE_URL = 'https://api.figma.com/v1';

if (!FIGMA_TOKEN) {
  console.error('Missing FIGMA_TOKEN. Set it in the environment before running this script.');
  process.exit(1);
}
if (!FILE_KEY) {
  console.error('Missing FIGMA_FILE_KEY. Set it in the environment before running this script.');
  process.exit(1);
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'X-Figma-Token': FIGMA_TOKEN,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Figma API Error ${res.status}: ${errText}`);
  }
  return await res.json();
}

// Figma node IDs look like "1:23" or "12-345". Reject anything that could
// alter the request path/query so CLI args cannot redirect the API call.
function assertNodeId(nodeId) {
  if (!/^[0-9][0-9:\-]*$/.test(nodeId)) {
    throw new Error(`Invalid Figma node id: ${nodeId}`);
  }
  return nodeId;
}

// 1. Get File Info & Canvas Nodes
async function getStatus() {
  const data = await request(`/files/${FILE_KEY}?depth=2`);
  console.log(`=== Wonderwall-Pi Canvas Status ===`);
  console.log(`File Name: ${data.name}`);
  console.log(`Last Modified: ${data.lastModified}`);
  const pages = data.document?.children || [];
  pages.forEach(p => {
    console.log(`\nPage: ${p.name} (${p.children?.length || 0} top-level nodes)`);
    (p.children || []).forEach(child => {
      console.log(`  - [${child.type}] ${child.name} (ID: ${child.id})`);
    });
  });
  return data;
}

// 2. Export Image of Node
async function exportNodeImage(nodeId, format = 'png') {
  assertNodeId(nodeId);
  const data = await request(`/images/${FILE_KEY}?ids=${nodeId}&format=${format}&scale=2`);
  const imgUrl = data.images?.[nodeId];
  console.log(`\nNode ${nodeId} exported (${format}): ${imgUrl}`);
  return imgUrl;
}

// 4. Inspect Node Tree and Text
async function inspectNode(nodeId, depth = 5) {
  assertNodeId(nodeId);
  const data = await request(`/files/${FILE_KEY}/nodes?ids=${nodeId}&depth=${depth}`);
  const root = data.nodes?.[nodeId]?.document;
  if (!root) {
    console.log('Node not found:', nodeId);
    return;
  }
  function printNode(n, indent = '') {
    if (n.type === 'TEXT') {
      console.log(`${indent}🔤 [TEXT] "${n.characters.replace(/\n/g, ' ')}"`);
    } else {
      console.log(`${indent}📁 [${n.type}] ${n.name}`);
    }
    if (n.children) {
      n.children.forEach(c => printNode(c, indent + '  '));
    }
  }
  printNode(root);
}

// CLI handler
const [cmd, arg1, arg2] = process.argv.slice(2);
if (cmd === 'status') {
  getStatus().catch(console.error);
} else if (cmd === 'export' && arg1) {
  exportNodeImage(arg1, arg2 || 'png').catch(console.error);
} else if (cmd === 'inspect' && arg1) {
  inspectNode(arg1, arg2 || 5).catch(console.error);
} else if (cmd === 'comment' && arg1) {
  postComment(arg1).catch(console.error);
} else {
  getStatus().catch(console.error);
}
