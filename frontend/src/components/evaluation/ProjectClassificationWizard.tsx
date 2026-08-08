import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Server, Layout, Layers, Cpu, Sparkles, Smartphone, Terminal, 
  BookOpen, Network, Cloud, ShieldAlert, Award, TrendingUp, CheckCircle, 
  HelpCircle, Compass, ShieldCheck, Activity, Eye, Zap, Database, ArrowRight
} from 'lucide-react'

// Step 1: Project Types with estimated times, example repos, and focus points
export const PROJECT_TYPES = [
  { id: 'backend', label: 'Backend API', icon: Server, desc: 'Web services, REST/GraphQL APIs, microservices databases.', focus: 'Concurrency, Database index, auth controls', examples: 'FastAPI, Express, Spring Boot', time: '1.5 min' },
  { id: 'frontend', label: 'Frontend Web', icon: Layout, desc: 'Single-page web applications and responsive user interfaces.', focus: 'Accessibility, performance, bundle size', examples: 'React, Next.js, Vue, Vite', time: '1 min' },
  { id: 'fullstack', label: 'Full Stack', icon: Layers, desc: 'Unified backend and client-facing web applications.', focus: 'Decoupled routing, state synchronization', examples: 'SvelteKit, Remix, MERN projects', time: '2 min' },
  { id: 'ai_ml', label: 'AI / Machine Learning', icon: Cpu, desc: 'Training pipelines, optimization models, dataset parsers.', focus: 'Model architectures, testing, reproducibility', examples: 'PyTorch, TensorFlow, Scikit-learn', time: '2.5 min' },
  { id: 'llm_app', label: 'LLM Application', icon: Sparkles, desc: 'RAG systems, agent orchestrations, prompts chains.', focus: 'Prompt evaluations, vector cache, token costs', examples: 'LangChain, LlamaIndex, CrewAI', time: '1.5 min' },
  { id: 'mobile', label: 'Mobile App', icon: Smartphone, desc: 'Native or cross-platform mobile interfaces.', focus: 'Memory footprint, local storage, view state', examples: 'Flutter, React Native, Swift, Kotlin', time: '1.8 min' },
  { id: 'cli', label: 'CLI Tool', icon: Terminal, desc: 'Terminal utilities and automated script interfaces.', focus: 'Argument parsing, stderr checks, commands UX', examples: 'Click, Commander, Cobra packages', time: '1 min' },
  { id: 'library', label: 'Library / SDK', icon: BookOpen, desc: 'Re-distributable packages and developer components.', focus: 'SemVer versioning, backwards compatibility, API docs', examples: 'NPM modules, Python wheels', time: '1.2 min' },
  { id: 'microservices', label: 'Microservices', icon: Network, desc: 'Distributed software service architecture mesh.', focus: 'Service registry, API gateway, circuit breaker', examples: 'gRPC endpoints, Docker networks', time: '2.2 min' },
  { id: 'cloud_infra', label: 'Cloud Infrastructure', icon: Cloud, desc: 'Infrastructure as Code (IaC) deployment scriptings.', focus: 'Least privilege IAM, environment parity', examples: 'Terraform, Ansible, CloudFormation', time: '1.5 min' }
]

// Step 2: Evaluation Goals with weight metrics
export const EVALUATION_GOALS = [
  { id: 'prod_readiness', label: 'Production Readiness', icon: ShieldCheck, desc: 'Hardening checks before system deployment.', focus: 'Observability & scalability priority' },
  { id: 'security_audit', label: 'Security Audit', icon: ShieldAlert, desc: 'Thorough vulnerability and secrets assessment.', focus: 'Exposed credentials, AST security rules' },
  { id: 'arch_review', label: 'Architecture Review', icon: Layers, desc: 'Auditing layer decoupling and patterns consistency.', focus: 'Dependency cycles, package structure' },
  { id: 'due_diligence', label: 'Technical Due Diligence', icon: Award, desc: 'Comprehensive rating of code risk and technical debt.', focus: 'Estimated days to rewrite, stability index' },
  { id: 'hackathon', label: 'Hackathon Evaluation', icon: Zap, desc: 'Fast prototyping score emphasizing novelty and speed.', focus: 'Innovation novelty priority, prototype bypasses' },
  { id: 'investor_review', label: 'Investment Review', icon: TrendingUp, desc: 'Product concept and maintainability evaluations.', focus: 'Market viability, modular growth rating' },
  { id: 'open_source', label: 'Open Source Health', icon: Compass, desc: 'Developer onboarding and documentation checkmarks.', focus: 'README clarity, API schemes complete' },
  { id: 'enterprise_readiness', label: 'Enterprise Readiness', icon: Server, desc: 'Scalability, licensing, and compliance parameters.', focus: 'Compliance rules, rate limiting check' },
  { id: 'code_quality', label: 'Code Quality Review', icon: Activity, desc: 'Adherence to formatting and complexity guidelines.', focus: 'Cyclomatic indices, duplication rate' }
]

// Step 3: Repository Maturity
export const REPO_MATURITIES = [
  { id: 'prototype', label: 'Prototype', desc: 'Proof of concept codebase. Heavy dynamic shortcuts accepted.', focus: 'Tolerance for missing tests and CI pipelines' },
  { id: 'mvp', label: 'MVP', desc: 'Minimal viable product. Basic database and routing structure verified.', focus: 'Focuses on functional paths over optimization' },
  { id: 'beta', label: 'Beta', desc: 'Pre-production test build. Initial testing baseline expected.', focus: 'Validates configuration security and metrics' },
  { id: 'production', label: 'Production', desc: 'Active customer deployments. High security and stability enforced.', focus: 'Full dependency parity and unit tests coverage' },
  { id: 'enterprise', label: 'Enterprise', desc: 'Multi-region clustered system. Strict governance mandatory.', focus: 'Complete rate limiting and logging required' },
  { id: 'legacy', label: 'Legacy', desc: 'Stable maintenance system. Backwards compatibility required.', focus: 'Checks deprecations and version drift' }
]

interface WizardProps {
  onComplete: (data: {
    project_type: string
    project_domain: string
    evaluation_profile: string
    evaluation_goal: string
    repository_maturity: string
  }) => void
}

export default function ProjectClassificationWizard({ onComplete }: WizardProps) {
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState('')
  const [selectedGoal, setSelectedGoal] = useState('')
  const [selectedMaturity, setSelectedMaturity] = useState('')

  const handleNext = () => {
    if (step === 1 && !selectedType) return
    if (step === 2 && !selectedGoal) return
    if (step === 3 && !selectedMaturity) return

    if (step < 3) {
      setStep(step + 1)
    } else {
      const typeData = PROJECT_TYPES.find(t => t.id === selectedType)
      const goalData = EVALUATION_GOALS.find(g => g.id === selectedGoal)
      const maturityData = REPO_MATURITIES.find(m => m.id === selectedMaturity)

      onComplete({
        project_type: typeData?.label || 'Other',
        project_domain: typeData?.label || 'General',
        evaluation_profile: typeData?.label || 'General',
        evaluation_goal: goalData?.label || 'General Code Quality',
        repository_maturity: maturityData?.label || 'MVP'
      })
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-[#090d13]/90 border border-zinc-800 rounded-[24px] shadow-[0_24px_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Wizard Steps Bar */}
        <div className="px-8 py-5 border-b border-white/[0.04] bg-[#0c1017]/80 flex justify-between items-center shrink-0">
          <div>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-black">Onboarding Profile Wizard</span>
            <h2 className="text-lg font-extrabold text-white font-display mt-0.5">
              {step === 1 && 'Step 1: Project Classification'}
              {step === 2 && 'Step 2: Define Evaluation Goal'}
              {step === 3 && 'Step 3: Repository Maturity'}
            </h2>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
            <span className={step >= 1 ? 'text-cyan-400 font-extrabold' : ''}>01</span>
            <span className="text-zinc-800">/</span>
            <span className={step >= 2 ? 'text-cyan-400 font-extrabold' : ''}>02</span>
            <span className="text-zinc-800">/</span>
            <span className={step >= 3 ? 'text-cyan-400 font-extrabold' : ''}>03</span>
          </div>
        </div>

        {/* Scrollable content container */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          <AnimatePresence mode="wait">
            
            {/* Step 1 Content */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {PROJECT_TYPES.map(type => {
                  const Icon = type.icon
                  const active = selectedType === type.id
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`text-left rounded-2xl border p-5 relative overflow-hidden transition-all duration-200 cursor-pointer ${
                        active 
                          ? 'border-cyan-400/40 bg-cyan-950/10 shadow-[0_0_20px_rgba(6,182,212,0.1)]' 
                          : 'border-zinc-800 bg-[#0c1017]/40 hover:border-zinc-700/60 hover:bg-[#0c1017]/80'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          active ? 'bg-cyan-950/40 border-cyan-400/35 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}>
                          <Icon size={18} />
                        </span>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <h4 className="font-extrabold text-white text-[14px]">{type.label}</h4>
                            <span className="text-[10px] font-mono text-zinc-500">{type.time}</span>
                          </div>
                          <p className="text-[12px] text-zinc-400 leading-normal">{type.desc}</p>
                          <div className="pt-2 flex flex-col gap-1 text-[10px] font-mono border-t border-white/[0.03]">
                            <span className="text-zinc-500 uppercase tracking-widest">Focus: <span className="text-zinc-300 font-bold">{type.focus}</span></span>
                            <span className="text-zinc-600">Examples: {type.examples}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </motion.div>
            )}

            {/* Step 2 Content */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {EVALUATION_GOALS.map(goal => {
                  const Icon = goal.icon
                  const active = selectedGoal === goal.id
                  return (
                    <button
                      key={goal.id}
                      onClick={() => setSelectedGoal(goal.id)}
                      className={`text-left rounded-2xl border p-5 relative overflow-hidden transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                        active 
                          ? 'border-cyan-400/40 bg-cyan-950/10 shadow-[0_0_20px_rgba(6,182,212,0.1)]' 
                          : 'border-zinc-800 bg-[#0c1017]/40 hover:border-zinc-700/60 hover:bg-[#0c1017]/80'
                      }`}
                    >
                      <div className="space-y-4">
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          active ? 'bg-cyan-950/40 border-cyan-400/35 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}>
                          <Icon size={18} />
                        </span>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-white text-[14px] leading-tight">{goal.label}</h4>
                          <p className="text-[12px] text-zinc-400 leading-normal">{goal.desc}</p>
                        </div>
                      </div>
                      <div className="pt-3 mt-4 border-t border-white/[0.03] text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-normal">
                        Scope: <span className="text-zinc-300 font-bold">{goal.focus}</span>
                      </div>
                    </button>
                  )
                })}
              </motion.div>
            )}

            {/* Step 3 Content */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {REPO_MATURITIES.map(maturity => {
                  const active = selectedMaturity === maturity.id
                  return (
                    <button
                      key={maturity.id}
                      onClick={() => setSelectedMaturity(maturity.id)}
                      className={`text-left rounded-2xl border p-5 relative overflow-hidden transition-all duration-200 cursor-pointer ${
                        active 
                          ? 'border-cyan-400/40 bg-cyan-950/10 shadow-[0_0_20px_rgba(6,182,212,0.1)]' 
                          : 'border-zinc-800 bg-[#0c1017]/40 hover:border-zinc-700/60 hover:bg-[#0c1017]/80'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-cyan-400' : 'bg-zinc-700'}`} />
                          <h4 className="font-extrabold text-white text-[14px]">{maturity.label}</h4>
                        </div>
                        <p className="text-[12px] text-zinc-400 leading-normal pl-4">{maturity.desc}</p>
                        <div className="pt-2 pl-4 border-t border-white/[0.03] text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-normal">
                          Maturity Adjust: <span className="text-zinc-300 font-bold">{maturity.focus}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </motion.div>
            )}

          </AnimatePresence>

        </div>

        {/* Bottom Actions Bar */}
        <div className="px-8 py-5 border-t border-white/[0.04] bg-[#0c1017]/80 flex justify-between items-center shrink-0">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className={`px-5 py-2.5 rounded-xl font-mono text-[11px] font-extrabold border transition-colors cursor-pointer ${
              step === 1 
                ? 'border-zinc-800 text-zinc-600 bg-transparent cursor-not-allowed' 
                : 'border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white bg-white/[0.02]'
            }`}
          >
            ← Previous Step
          </button>
          
          <button
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl font-mono text-[11px] font-extrabold bg-cyan-400 hover:bg-cyan-300 text-zinc-950 transition-colors cursor-pointer flex items-center gap-1.5 shadow-[0_4px_20px_rgba(6,182,212,0.2)]"
          >
            <span>{step === 3 ? 'Initiate Evaluation' : 'Next Step'}</span>
            <ArrowRight size={12} />
          </button>
        </div>

      </motion.div>
    </div>
  )
}
