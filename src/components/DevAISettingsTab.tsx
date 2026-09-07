import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Sliders,
  Cpu,
  Save,
  RotateCcw,
  Play,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Info,
  ShieldAlert,
  Zap,
  Layers,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Code,
  ShieldCheck,
} from 'lucide-react';
import { AITaskConfig, AITaskId, AIUsageConfig } from '../types';

interface DevAISettingsTabProps {
  currentUsername: string;
  onAddToast: (type: 'success' | 'warning' | 'error' | 'info', message: string) => void;
}

interface TestResultState {
  loading: boolean;
  success?: boolean;
  durationMs?: number;
  output?: any;
  error?: string;
}

export const DevAISettingsTab: React.FC<DevAISettingsTabProps> = ({
  currentUsername,
  onAddToast,
}) => {
  const [config, setConfig] = useState<AIUsageConfig | null>(null);
  const [editedConfig, setEditedConfig] = useState<AIUsageConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [expandedTask, setExpandedTask] = useState<AITaskId | null>('sloth_cards');
  const [testResults, setTestResults] = useState<Record<AITaskId, TestResultState>>({
    sloth_cards: { loading: false },
    post_mortem: { loading: false },
    trophy_art: { loading: false },
  });

  const fetchAIConfig = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/dev/ai-config?username=${encodeURIComponent(currentUsername)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig(data.config);
          setEditedConfig(JSON.parse(JSON.stringify(data.config)));
        }
      } else {
        const err = await res.json().catch(() => ({}));
        onAddToast('error', err.error || 'Failed to fetch AI configuration.');
      }
    } catch {
      onAddToast('error', 'Network error fetching AI configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAIConfig();
  }, [currentUsername]);

  const hasUnsavedChanges = Boolean(
    config &&
      editedConfig &&
      JSON.stringify(config) !== JSON.stringify(editedConfig)
  );

  const handleToggleGlobal = () => {
    if (!editedConfig) return;
    setEditedConfig({
      ...editedConfig,
      globalEnabled: !editedConfig.globalEnabled,
    });
  };

  const handleToggleTask = (taskId: AITaskId) => {
    if (!editedConfig) return;
    setEditedConfig({
      ...editedConfig,
      tasks: {
        ...editedConfig.tasks,
        [taskId]: {
          ...editedConfig.tasks[taskId],
          enabled: !editedConfig.tasks[taskId].enabled,
        },
      },
    });
  };

  const handleModelChange = (taskId: AITaskId, model: string) => {
    if (!editedConfig) return;
    setEditedConfig({
      ...editedConfig,
      tasks: {
        ...editedConfig.tasks,
        [taskId]: {
          ...editedConfig.tasks[taskId],
          model,
        },
      },
    });
  };

  const handlePromptChange = (taskId: AITaskId, systemPrompt: string) => {
    if (!editedConfig) return;
    setEditedConfig({
      ...editedConfig,
      tasks: {
        ...editedConfig.tasks,
        [taskId]: {
          ...editedConfig.tasks[taskId],
          systemPrompt,
        },
      },
    });
  };

  const handleResetTaskPrompt = (taskId: AITaskId) => {
    if (!editedConfig) return;
    setEditedConfig({
      ...editedConfig,
      tasks: {
        ...editedConfig.tasks,
        [taskId]: {
          ...editedConfig.tasks[taskId],
          systemPrompt: editedConfig.tasks[taskId].defaultPrompt,
          model: editedConfig.tasks[taskId].defaultModel,
        },
      },
    });
    onAddToast('info', `Prompt and model for ${editedConfig.tasks[taskId].name} reset to defaults.`);
  };

  const handleSaveAll = async () => {
    if (!editedConfig) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/dev/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUsername,
          updates: editedConfig,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConfig(data.config);
        setEditedConfig(JSON.parse(JSON.stringify(data.config)));
        onAddToast('success', 'AI usage configuration saved successfully!');
      } else {
        onAddToast('error', data.error || 'Failed to save AI configuration.');
      }
    } catch {
      onAddToast('error', 'Network error saving AI configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAllDefaults = async () => {
    if (!window.confirm('Reset all AI settings, model overrides, and system prompts to factory defaults?')) {
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch('/api/dev/ai-config/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUsername }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConfig(data.config);
        setEditedConfig(JSON.parse(JSON.stringify(data.config)));
        onAddToast('success', 'All AI settings restored to factory defaults.');
      } else {
        onAddToast('error', data.error || 'Failed to reset AI settings.');
      }
    } catch {
      onAddToast('error', 'Network error resetting AI settings.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleTestTask = async (taskId: AITaskId) => {
    if (!editedConfig) return;
    const currentTask = editedConfig.tasks[taskId];
    setTestResults(prev => ({
      ...prev,
      [taskId]: { loading: true },
    }));

    try {
      const res = await fetch('/api/dev/ai-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUsername,
          taskId,
          model: currentTask.model,
          prompt: currentTask.systemPrompt,
        }),
      });

      const data = await res.json();
      setTestResults(prev => ({
        ...prev,
        [taskId]: {
          loading: false,
          success: data.success,
          durationMs: data.durationMs,
          output: data.output,
          error: data.error,
        },
      }));

      if (data.success) {
        onAddToast('success', `Test call for ${currentTask.name} completed in ${data.durationMs}ms!`);
      } else {
        onAddToast('warning', `Test failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [taskId]: {
          loading: false,
          success: false,
          error: err?.message || 'Network request failed',
        },
      }));
      onAddToast('error', 'Network error while testing AI task.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#8a8f98] gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-[#00ff95]" />
        <span className="text-xs font-mono">Loading in-game AI configuration...</span>
      </div>
    );
  }

  if (!editedConfig) {
    return (
      <div className="p-6 text-center text-[#8a8f98]">
        <AlertTriangle className="w-8 h-8 text-[#ff4d4d] mx-auto mb-2" />
        <p className="text-sm text-[#f0f2f5] font-semibold">Unable to load AI configuration.</p>
        <p className="text-xs mt-1">Please ensure you are logged in as a Dev user.</p>
        <button
          onClick={fetchAIConfig}
          className="mt-4 px-4 py-2 rounded-lg bg-[#22242a] hover:bg-[#2c3038] text-xs font-medium text-[#f0f2f5] cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const tasks: AITaskConfig[] = [
    editedConfig.tasks.sloth_cards,
    editedConfig.tasks.post_mortem,
    editedConfig.tasks.trophy_art,
  ];

  return (
    <div className="space-y-5 pb-6">
      {/* Top Banner & Master Global Switch */}
      <div className="p-4 rounded-xl border border-[#22242a] bg-[#171920] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl border ${
              editedConfig.globalEnabled
                ? 'bg-[#00ff95]/10 border-[#00ff95]/30 text-[#00ff95]'
                : 'bg-[#ff4d4d]/10 border-[#ff4d4d]/30 text-[#ff4d4d]'
            }`}>
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#f0f2f5]">In-Game AI Engine</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  editedConfig.globalEnabled
                    ? 'bg-[#00ff95]/15 text-[#00ff95] border-[#00ff95]/30'
                    : 'bg-[#ffb800]/15 text-[#ffb800] border-[#ffb800]/30'
                }`}>
                  {editedConfig.globalEnabled ? 'LIVE AI ENABLED' : 'PLACEHOLDERS ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-[#8a8f98] mt-1 leading-relaxed max-w-xl">
                {editedConfig.globalEnabled
                  ? 'Gemini dynamically crafts deceptive sloth cards, behavioral coaching post-mortems, and esports medal artwork.'
                  : 'AI calls are completely disabled. The game engine uses pre-generated curated sloth cards, deterministic psychological coaching, and vector SVG medals. Full gameplay remains intact with 0ms latency.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <span className="text-xs font-semibold text-[#8a8f98]">
              {editedConfig.globalEnabled ? 'AI Active' : 'AI Disabled'}
            </span>
            <button
              onClick={handleToggleGlobal}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                editedConfig.globalEnabled ? 'bg-[#00ff95]' : 'bg-[#2a2d36]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-[#0c0d10] transition-transform ${
                  editedConfig.globalEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {!editedConfig.globalEnabled && (
          <div className="mt-3.5 pt-3 border-t border-[#22242a] flex items-center gap-2 text-xs text-[#ffb800] bg-[#ffb800]/5 px-3 py-2 rounded-lg">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#ffb800]" />
            <span>
              <strong>Zero-AI Guarantee:</strong> No requests are sent to Gemini. All three subsystems use bundled offline templates.
            </span>
          </div>
        )}
      </div>

      {/* Task-by-Task AI Usage Configuration */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#00ff95]" />
            <h4 className="text-xs font-bold text-[#f0f2f5] uppercase tracking-wider">
              AI Tasks & Model Routing
            </h4>
          </div>
          <span className="text-[11px] text-[#8a8f98]">
            Customize model aliases and system prompt instructions per task
          </span>
        </div>

        {tasks.map(task => {
          const isExpanded = expandedTask === task.id;
          const isTaskActive = editedConfig.globalEnabled && task.enabled;
          const testState = testResults[task.id];

          return (
            <div
              key={task.id}
              className={`rounded-xl border transition-all overflow-hidden ${
                isExpanded
                  ? 'border-[#00ff95]/30 bg-[#16181f] shadow-md'
                  : 'border-[#22242a] bg-[#121318] hover:border-[#2f333d]'
              }`}
            >
              {/* Task Header Bar */}
              <div className="p-3.5 flex items-center justify-between gap-3 select-none">
                <div
                  onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                  className="flex items-center gap-3 cursor-pointer flex-1"
                >
                  <div className={`p-2 rounded-lg border ${
                    isTaskActive
                      ? 'bg-[#00ff95]/10 border-[#00ff95]/30 text-[#00ff95]'
                      : 'bg-[#22242a] border-[#2f333d] text-[#8a8f98]'
                  }`}>
                    {task.id === 'sloth_cards' && <Zap className="w-4 h-4" />}
                    {task.id === 'post_mortem' && <FileText className="w-4 h-4" />}
                    {task.id === 'trophy_art' && <ImageIcon className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#f0f2f5]">{task.name}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#1f222b] text-[#8a8f98] border border-[#2a2e3a]">
                        {task.model}
                      </span>
                      {!isTaskActive && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-[#22242a] text-[#8a8f98]">
                          Using Placeholders
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#8a8f98] mt-0.5 line-clamp-1">{task.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Task Enable Switch */}
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    title={task.enabled ? 'Disable AI for this task' : 'Enable AI for this task'}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                      task.enabled ? 'bg-[#00ff95]' : 'bg-[#2a2d36]'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-[#0c0d10] transition-transform ${
                        task.enabled ? 'translate-x-4' : 'translate-x-1'
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                    className="p-1 text-[#8a8f98] hover:text-[#f0f2f5] cursor-pointer"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Detail Configuration Panel */}
              {isExpanded && (
                <div className="p-4 pt-1 border-t border-[#22242a] space-y-4 bg-[#0e0f14]/50">
                  {/* Model Selector & Fallback Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#8a8f98] mb-1.5 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-[#00ff95]" />
                        Selected Gemini Model
                      </label>
                      <select
                        value={task.model}
                        onChange={e => handleModelChange(task.id, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#181a21] border border-[#2a2e3a] text-xs font-mono text-[#f0f2f5] focus:border-[#00ff95] focus:outline-none cursor-pointer"
                      >
                        {task.availableModels.map(m => (
                          <option key={m} value={m}>
                            {m} {m === task.defaultModel ? '(Default)' : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-[#8a8f98] mt-1">
                        Default model: <span className="font-mono text-[#f0f2f5]">{task.defaultModel}</span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#8a8f98] mb-1.5 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#ffb800]" />
                        Fallback Engine when Disabled / Unavailable
                      </label>
                      <div className="p-2 rounded-lg bg-[#181a21] border border-[#2a2e3a] text-[11px] text-[#8a8f98] leading-relaxed">
                        {task.id === 'sloth_cards' && (
                          <span>Instant curated templates: "Cancer Research Charity Mega-Lottery", "Neon Oasis VIP Casino Gambling" (0ms, pre-calculated risk).</span>
                        )}
                        {task.id === 'post_mortem' && (
                          <span>Deterministic cognitive coaching analyzing telemetry ratios, pillar investments, and entropy degradation.</span>
                        )}
                        {task.id === 'trophy_art' && (
                          <span>High-resolution vector SVG medal badge generated client/server side with custom heraldic laurels.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* System Prompt Editor */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-semibold text-[#8a8f98] flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-[#00ff95]" />
                        System Instruction / Prompt Template
                      </label>
                      <button
                        onClick={() => handleResetTaskPrompt(task.id)}
                        className="text-[10px] text-[#8a8f98] hover:text-[#00ff95] flex items-center gap-1 transition cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset to Default</span>
                      </button>
                    </div>
                    <textarea
                      value={task.systemPrompt}
                      onChange={e => handlePromptChange(task.id, e.target.value)}
                      rows={task.id === 'sloth_cards' ? 7 : 6}
                      className="w-full px-3 py-2 rounded-lg bg-[#13151b] border border-[#2a2e3a] text-xs font-mono text-[#f0f2f5] focus:border-[#00ff95] focus:outline-none leading-relaxed resize-y"
                    />
                    <div className="flex items-center justify-between text-[10px] text-[#8a8f98] mt-1">
                      <span>
                        {task.id === 'sloth_cards' && 'Variable placeholder: {archetype} (e.g. lottery, gambling)'}
                        {task.id === 'post_mortem' && 'Variable placeholder: {telemetry} (run stats summary)'}
                        {task.id === 'trophy_art' && 'Variable placeholders: {rank}, {username}, {score}, {archetype}'}
                      </span>
                      <span>{task.systemPrompt.length} chars</span>
                    </div>
                  </div>

                  {/* Live Testing Control & Output */}
                  <div className="pt-2 border-t border-[#22242a]">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        disabled={testState.loading}
                        onClick={() => handleTestTask(task.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#22252e] hover:bg-[#2b2f3a] text-xs font-semibold text-[#f0f2f5] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                      >
                        {testState.loading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00ff95]" />
                            <span>Calling Gemini...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 text-[#00ff95]" />
                            <span>Test Live Generation</span>
                          </>
                        )}
                      </button>

                      {testState.durationMs !== undefined && (
                        <span className="text-[11px] font-mono text-[#00ff95]">
                          Latency: {testState.durationMs}ms
                        </span>
                      )}
                    </div>

                    {/* Test Results Output Display */}
                    {testState.error && (
                      <div className="mt-2.5 p-3 rounded-lg bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 text-xs text-[#ff6b6b] flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <strong>Test Failed:</strong> {testState.error}
                        </div>
                      </div>
                    )}

                    {testState.output && (
                      <div className="mt-2.5 p-3 rounded-lg bg-[#121319] border border-[#282c37] space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-[#00ff95]">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Live Model Output Received
                          </span>
                        </div>

                        {task.id === 'sloth_cards' && (
                          <div className="text-xs space-y-1 bg-[#171922] p-2.5 rounded border border-[#22242a]">
                            <div className="font-bold text-[#f0f2f5]">{testState.output.title}</div>
                            <div className="text-[#8a8f98]">{testState.output.description}</div>
                            <div className="text-[11px] text-[#ffb800] font-mono">
                              Cost: {testState.output.cost} | Reward: {testState.output.rewardDescription}
                            </div>
                            <div className="italic text-[11px] text-[#555a64]">"{testState.output.flavor}"</div>
                          </div>
                        )}

                        {task.id === 'post_mortem' && (
                          <div className="text-xs space-y-1.5 bg-[#171922] p-2.5 rounded border border-[#22242a]">
                            <div className="font-bold text-[#00ff95] text-sm">
                              {testState.output.archetypeName}
                            </div>
                            <div className="text-[#8a8f98] text-[11px] leading-relaxed">
                              {testState.output.behavioralAnalysis}
                            </div>
                            {testState.output.strategicTips && (
                              <div className="text-[11px] text-[#f0f2f5] pt-1">
                                <span className="font-semibold text-[#ffb800]">Tips: </span>
                                {testState.output.strategicTips.join(' • ')}
                              </div>
                            )}
                          </div>
                        )}

                        {task.id === 'trophy_art' && (
                          <div className="flex items-center gap-3 bg-[#171922] p-2.5 rounded border border-[#22242a]">
                            {testState.output.imageUrl ? (
                              <img
                                src={testState.output.imageUrl}
                                alt="Live Trophy Generation"
                                className="w-16 h-16 rounded-lg object-cover border border-[#22242a]"
                              />
                            ) : null}
                            <div className="text-xs text-[#8a8f98]">
                              <div className="font-semibold text-[#f0f2f5]">Esports Medal Emblem</div>
                              <div className="text-[10px] font-mono mt-0.5 text-[#00ff95]">Format: {testState.output.format || 'inline image data'}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Global Actions Bottom Bar */}
      <div className="p-4 rounded-xl border border-[#22242a] bg-[#12141a] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-[#8a8f98] flex items-center gap-1.5">
          {hasUnsavedChanges ? (
            <span className="text-[#ffb800] font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Unsaved AI changes pending
            </span>
          ) : (
            <span className="text-[#00ff95] flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              All AI settings synced to server
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            disabled={isResetting}
            onClick={handleResetAllDefaults}
            className="px-3 py-2 rounded-lg border border-[#2a2e3a] hover:bg-[#1e212b] text-xs font-medium text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Defaults</span>
          </button>

          <button
            type="button"
            disabled={!hasUnsavedChanges || isSaving}
            onClick={handleSaveAll}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-[#00ff95] text-[#0c0d10] hover:bg-[#00e685] shadow-[0_0_16px_rgba(0,255,149,0.35)]'
                : 'bg-[#1c1f26] text-[#555a64] cursor-not-allowed border border-[#2a2e3a]'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save AI Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
