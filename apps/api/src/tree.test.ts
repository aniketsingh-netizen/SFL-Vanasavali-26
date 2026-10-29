import assert from "node:assert/strict";
import test from "node:test";
import { canonicalPair, createsParentCycle } from "./tree.js";

test("rejects a parent-child edge that closes a cycle", () => {
  const edges = [
    { sourceId: "a", targetId: "b", type: "PARENT_CHILD" as const },
    { sourceId: "b", targetId: "c", type: "PARENT_CHILD" as const }
  ];
  assert.equal(createsParentCycle(edges, "c", "a"), true);
  assert.equal(createsParentCycle(edges, "a", "d"), false);
  assert.equal(createsParentCycle(edges, "same", "same"), true);
});

test("normalizes undirected relationship pairs", () => {
  assert.deepEqual(canonicalPair("z", "a", "SPOUSE"), { sourceId: "a", targetId: "z" });
  assert.deepEqual(canonicalPair("z", "a", "PARENT_CHILD"), { sourceId: "z", targetId: "a" });
});
