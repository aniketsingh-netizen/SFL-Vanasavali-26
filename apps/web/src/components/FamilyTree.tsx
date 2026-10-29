import { useMemo } from "react";
import { Background, Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Member, Relationship } from "../types";

type MemberNodeData = { member: Member; selected: boolean; onSelect: (member: Member) => void };
type MemberFlowNode = Node<MemberNodeData, "member">;

function MemberNode({ data }: NodeProps<MemberFlowNode>) {
  const { member } = data;
  const initials = member.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <button className={`member-node ${data.selected ? "member-node-selected" : ""}`} onClick={() => data.onSelect(member)}>
      <Handle type="target" position={Position.Top} />
      <Handle id="left-target" type="target" position={Position.Left} />
      <Handle id="right-target" type="target" position={Position.Right} />
      <span className="node-avatar">{member.photoUrl ? <img src={member.photoUrl} alt="" /> : initials}</span>
      <span className="node-name">{member.fullName}</span>
      <span className="node-dates">{member.birthDate?.slice(0, 4) ?? "—"}{member.deathDate ? ` – ${member.deathDate.slice(0, 4)}` : ""}</span>
      <Handle type="source" position={Position.Bottom} />
      <Handle id="left-source" type="source" position={Position.Left} />
      <Handle id="right-source" type="source" position={Position.Right} />
    </button>
  );
}

const nodeTypes = { member: MemberNode };

export default function FamilyTree({ members, relationships, selectedId, onSelect }: {
  members: Member[];
  relationships: Relationship[];
  selectedId?: string;
  onSelect: (member: Member) => void;
}) {
  const { nodes, edges } = useMemo(() => {
    const levels = new Map<string, number>();
    const byId = new Map(members.map((member) => [member.id, member]));
    const parents = relationships.filter((edge) => edge.type === "PARENT_CHILD");
    const visiting = new Set<string>();
    const levelFor = (id: string): number => {
      if (levels.has(id)) return levels.get(id)!;
      if (visiting.has(id)) return byId.get(id)?.generation ?? 0;
      visiting.add(id);
      const parent = parents.find((edge) => edge.targetId === id);
      const level = parent ? levelFor(parent.sourceId) + 1 : byId.get(id)?.generation ?? 0;
      visiting.delete(id);
      levels.set(id, level);
      return level;
    };
    members.forEach((member) => levelFor(member.id));
    const rows = new Map<number, Member[]>();
    members.forEach((member) => {
      const row = rows.get(levels.get(member.id)!) ?? [];
      row.push(member);
      rows.set(levels.get(member.id)!, row);
    });
    const partner = new Map<string, string>();
    relationships.filter((edge) => edge.type === "SPOUSE").forEach((edge) => {
      partner.set(edge.sourceId, edge.targetId);
      partner.set(edge.targetId, edge.sourceId);
    });
    const positions = new Map<string, { x: number; y: number }>();
    [...rows.entries()].sort((a, b) => a[0] - b[0]).forEach(([level, row]) => {
      const used = new Set<string>();
      const arranged: Member[] = [];
      row.forEach((member) => {
        if (used.has(member.id)) return;
        arranged.push(member);
        used.add(member.id);
        const spouse = partner.get(member.id);
        if (spouse && row.some((item) => item.id === spouse) && !used.has(spouse)) {
          const paired = row.find((item) => item.id === spouse);
          if (paired) arranged.push(paired);
          used.add(spouse);
        }
      });
      arranged.forEach((member, index) => positions.set(member.id, { x: index * 250, y: level * 190 }));
    });
    const nodes: MemberFlowNode[] = members.map((member) => ({
      id: member.id,
      type: "member" as const,
      position: positions.get(member.id) ?? { x: 0, y: 0 },
      data: { member, selected: member.id === selectedId, onSelect }
    }));
    const edges: Edge[] = relationships.filter((edge) => byId.has(edge.sourceId) && byId.has(edge.targetId)).map((edge) => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      sourceHandle: edge.type === "PARENT_CHILD" ? undefined : "right-source",
      targetHandle: edge.type === "PARENT_CHILD" ? undefined : "left-target",
      type: edge.type === "PARENT_CHILD" ? "smoothstep" : "straight",
      label: edge.type === "SPOUSE" ? "partner" : edge.type === "SIBLING" ? "sibling" : undefined,
      style: { stroke: edge.type === "PARENT_CHILD" ? "#b4a58c" : "#c28d64", strokeWidth: 1.8, strokeDasharray: edge.type === "SIBLING" ? "4 4" : undefined },
      labelStyle: { fill: "#887963", fontSize: 10 }
    }));
    return { nodes, edges };
  }, [members, relationships, selectedId, onSelect]);

  return (
    <div className="tree-canvas">
      {members.length ? (
        <ReactFlow<MemberFlowNode, Edge> nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.2 }} minZoom={0.15} maxZoom={1.8} nodesDraggable={false} nodesConnectable={false} proOptions={{ hideAttribution: true }}>
          <Background color="#dfd8cc" gap={24} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      ) : <div className="empty-tree"><span>✳</span><strong>Your family story starts here</strong><p>Add a member to begin building your family tree.</p></div>}
    </div>
  );
}
