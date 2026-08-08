import * as fs from 'fs'
import * as path from 'path'

// Let's mock a React environment if needed, or just import them
async function testImports() {
  try {
    const pipelineCard = await import('./src/components/evaluation/AgentPipelineCard.tsx')
    console.log('AgentPipelineCard export:', pipelineCard.default ? 'OK' : 'UNDEFINED')
  } catch (e) {
    console.error('AgentPipelineCard load failed:', e)
  }

  try {
    const terminalLog = await import('./src/components/evaluation/TerminalLog.tsx')
    console.log('TerminalLog export:', terminalLog.default ? 'OK' : 'UNDEFINED')
  } catch (e) {
    console.error('TerminalLog load failed:', e)
  }

  try {
    const agentNetwork = await import('./src/components/evaluation/AgentNetwork.tsx')
    console.log('AgentNetwork export:', agentNetwork.default ? 'OK' : 'UNDEFINED')
  } catch (e) {
    console.error('AgentNetwork load failed:', e)
  }

  try {
    const particleField = await import('./src/components/effects/BackgroundParticleField.tsx')
    console.log('BackgroundParticleField export:', particleField.default ? 'OK' : 'UNDEFINED')
  } catch (e) {
    console.error('BackgroundParticleField load failed:', e)
  }
}

testImports()
