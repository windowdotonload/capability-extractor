// shared/types.ts
// Core type definitions for the capability system

/** API parameter definition */
export interface ApiParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

/** API method definition */
export interface ApiDef {
  name: string;
  description: string;
  type: 'content-script-injection' | 'utility' | 'middleware' | 'hook';
  params: ApiParam[];
  returns: {
    type: string;
    description: string;
  };
}

/** Custom type field definition */
export interface TypeField {
  type: string;
  default?: unknown;
  description: string;
}

/** Implementation step */
export interface Step {
  step: number;
  title: string;
  description: string;
  code_ref?: string;
  api?: string;
  config?: Record<string, unknown>;
  caveat?: string;
}

/** Dependency manifest */
export interface Dependencies {
  runtime: string[];
  dev: string[];
  npm: string[];
}

/** Caveat / gotcha */
export interface Caveat {
  title: string;
  description: string;
}

/** Full capability spec (mirrors spec.yaml structure) */
export interface CapabilitySpec {
  name: string;
  version: string;
  description: string;
  tags: string[];
  extracted_from: {
    project: string;
    path: string;
    date: string;
  };
  when_to_use: string[];
  when_not_to_use: string[];
  principle: string;
  apis: ApiDef[];
  types: Record<string, Record<string, TypeField>>;
  steps: Step[];
  dependencies: Dependencies;
  caveats: Caveat[];
}

/** Integration file placement definition */
export interface FilePlacement {
  source: string;
  target: string;
  transform: 'copy' | 'merge' | 'template';
}

/** Config merge definition */
export interface ConfigMerge {
  file: string;
  strategy: 'deep-merge' | 'append' | 'replace';
  entries: Record<string, unknown>;
}

/** Integration script export structure */
export interface IntegrationScript {
  name: string;
  version: string;
  compatibility: {
    projectTypes: string[];
    check(targetProject: string): boolean;
  };
  files: FilePlacement[];
  configMerges: ConfigMerge[];
  dependencies: {
    install: string[];
  };
  postInstall: {
    message: string;
    manualSteps: string[];
  };
}

/** Capability summary (for list views) */
export interface CapabilitySummary {
  name: string;
  version: string;
  description: string;
  tags: string[];
  extractedFrom: string;
  date: string;
}

/** Integration result */
export interface IntegrationResult {
  success: boolean;
  capability: string;
  targetProject: string;
  filesAdded: string[];
  filesModified: string[];
  dependenciesInstalled: string[];
  errors: string[];
  manualSteps: string[];
}

/** Tag with count */
export interface TagCount {
  tag: string;
  count: number;
}
