import nodeTypesJSON from "../src/node-types.json" with { type: "json" };

export interface TreeSitterBasicNodeType {
  type: string;
  named: boolean;
  extra?: boolean;
}

export interface TreeSitterContainerNodeType {
  type: string;
  named: boolean;
  fields?: Record<string, NodeField>;
  children?: NodeField;
}

export interface TreeSitterSubtypeNodeType {
  type: string;
  named: boolean;
  subtypes: TreeSitterBasicNodeType[];
}

export interface NodeField {
  multiple: boolean;
  required: boolean;
  types: TreeSitterBasicNodeType[];
}

export type TreeSitterNodeType =
  | TreeSitterBasicNodeType
  | TreeSitterContainerNodeType
  | TreeSitterSubtypeNodeType
  ;

export const nodeTypes: TreeSitterNodeType[] = nodeTypesJSON;
