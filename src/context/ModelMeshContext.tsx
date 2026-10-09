import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  Model,
  RoutingStrategy,
  RoutingWeights,
  CustomRule,
  RoutingResult,
  GlobalMetrics
} from '../types';
import {
  INITIAL_MODELS,
  DEFAULT_WEIGHTS,
  INITIAL_CUSTOM_RULES,
  INITIAL_FALLBACK_CHAIN,
  INITIAL_HISTORICAL_LOGS
} from '../data/initialData';
import { routePrompt } from '../utils/router';

export type TabType = 'landing' | 'playground' | 'routing-engine' | 'dashboard' | 'registry' | 'architecture';
export type ThemeType = 'dark' | 'light' | 'cyberpunk';

interface ModelMeshContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  models: Model[];
  addModel: (model: Omit<Model, 'id'>) => void;
  updateModel: (id: string, updates: Partial<Model>) => void;
  toggleModelActive: (id: string) => void;
  strategy: RoutingStrategy;
  setStrategy: (strategy: RoutingStrategy) => void;
  weights: RoutingWeights;
  updateWeights: (newWeights: Partial<RoutingWeights>) => void;
  customRules: CustomRule[];
  addCustomRule: (rule: Omit<CustomRule, 'id'>) => void;
  toggleCustomRule: (id: string) => void;
  deleteCustomRule: (id: string) => void;
  fallbackChain: string[];
  setFallbackChain: (chain: string[]) => void;
  requestLogs: RoutingResult[];
  executeRouting: (prompt: string, overrideStrategy?: RoutingStrategy) => RoutingResult;
  clearLogs: () => void;
  resetDefaults: () => void;
  globalMetrics: GlobalMetrics;
}

const ModelMeshContext = createContext<ModelMeshContextType | undefined>(undefined);

export const ModelMeshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('landing');
  const [theme, setThemeState] = useState<ThemeType>('dark');
  const [models, setModels] = useState<Model[]>(() => {
    const saved = localStorage.getItem('modelmesh_models');
    return saved ? JSON.parse(saved) : INITIAL_MODELS;
  });
  const [strategy, setStrategy] = useState<RoutingStrategy>('balanced');
  const [weights, setWeights] = useState<RoutingWeights>(DEFAULT_WEIGHTS);
  const [customRules, setCustomRules] = useState<CustomRule[]>(INITIAL_CUSTOM_RULES);
  const [fallbackChain, setFallbackChain] = useState<string[]>(INITIAL_FALLBACK_CHAIN);
  const [requestLogs, setRequestLogs] = useState<RoutingResult[]>(() => {
    const saved = localStorage.getItem('modelmesh_logs');
    return saved ? JSON.parse(saved) : INITIAL_HISTORICAL_LOGS;
  });

  // Apply theme data attribute on body
  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Persist models and logs in localStorage
  useEffect(() => {
    localStorage.setItem('modelmesh_models', JSON.stringify(models));
  }, [models]);

  useEffect(() => {
    localStorage.setItem('modelmesh_logs', JSON.stringify(requestLogs));
  }, [requestLogs]);

  // Calculate live aggregate global metrics
  const globalMetrics: GlobalMetrics = React.useMemo(() => {
    const totalRequests = requestLogs.length;
    if (totalRequests === 0) {
      return {
        totalRequests: 0,
        totalCostSaved: 0,
        avgLatency: 0,
        accuracySLA: 100,
        totalTokensProcessed: 0
      };
    }

    const totalCostSaved = requestLogs.reduce((acc, log) => acc + (log.costSavings || 0), 0);
    const sumLatency = requestLogs.reduce((acc, log) => acc + (log.executionTimeMs || 0), 0);
    const avgLatency = Math.round(sumLatency / totalRequests);
    const totalTokensProcessed = requestLogs.reduce((acc, log) => acc + log.promptTokens + log.completionTokens, 0);
    const nonFallback = requestLogs.filter(log => !log.fallbackTriggered).length;
    const accuracySLA = Number(((nonFallback / totalRequests) * 100).toFixed(1));

    return {
      totalRequests,
      totalCostSaved: Number(totalCostSaved.toFixed(4)),
      avgLatency,
      accuracySLA,
      totalTokensProcessed
    };
  }, [requestLogs]);

  const executeRouting = (prompt: string, overrideStrategy?: RoutingStrategy): RoutingResult => {
    const activeStrat = overrideStrategy || strategy;
    const result = routePrompt(prompt, models, activeStrat, weights, customRules, fallbackChain);

    setRequestLogs(prev => [result, ...prev]);
    return result;
  };

  const addModel = (newModelData: Omit<Model, 'id'>) => {
    const newModel: Model = {
      ...newModelData,
      id: `custom-${Date.now().toString().slice(-5)}`
    };
    setModels(prev => [...prev, newModel]);
  };

  const updateModel = (id: string, updates: Partial<Model>) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const toggleModelActive = (id: string) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m));
  };

  const updateWeights = (newWeights: Partial<RoutingWeights>) => {
    setWeights(prev => ({ ...prev, ...newWeights }));
  };

  const addCustomRule = (ruleData: Omit<CustomRule, 'id'>) => {
    const newRule: CustomRule = {
      ...ruleData,
      id: `rule-${Date.now().toString().slice(-4)}`
    };
    setCustomRules(prev => [...prev, newRule]);
  };

  const toggleCustomRule = (id: string) => {
    setCustomRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const deleteCustomRule = (id: string) => {
    setCustomRules(prev => prev.filter(r => r.id !== id));
  };

  const clearLogs = () => {
    setRequestLogs([]);
    localStorage.removeItem('modelmesh_logs');
  };

  const resetDefaults = () => {
    setModels(INITIAL_MODELS);
    setWeights(DEFAULT_WEIGHTS);
    setCustomRules(INITIAL_CUSTOM_RULES);
    setFallbackChain(INITIAL_FALLBACK_CHAIN);
    setRequestLogs(INITIAL_HISTORICAL_LOGS);
    localStorage.removeItem('modelmesh_models');
    localStorage.removeItem('modelmesh_logs');
  };

  return (
    <ModelMeshContext.Provider
      value={{
        activeTab,
        setActiveTab,
        theme,
        setTheme,
        models,
        addModel,
        updateModel,
        toggleModelActive,
        strategy,
        setStrategy,
        weights,
        updateWeights,
        customRules,
        addCustomRule,
        toggleCustomRule,
        deleteCustomRule,
        fallbackChain,
        setFallbackChain,
        requestLogs,
        executeRouting,
        clearLogs,
        resetDefaults,
        globalMetrics
      }}
    >
      {children}
    </ModelMeshContext.Provider>
  );
};

export const useModelMesh = () => {
  const ctx = useContext(ModelMeshContext);
  if (!ctx) {
    throw new Error('useModelMesh must be used within a ModelMeshProvider');
  }
  return ctx;
};
