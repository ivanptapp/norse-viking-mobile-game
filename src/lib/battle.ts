import { heroById, heroStats, type HeroDef } from "./heroes";

export interface Fighter {
  uid: string; // "A0" aliados, "E0" enemigos
  heroId: string; name: string; side: "ally" | "enemy";
  position: string; level: number; stars: number;
  maxHp: number; hp: number; atk: number; def: number; spd: number; crit: number; energy: number;
}
export interface BattleStep {
  actor: string; targets: string[]; skill: string; kind: string; ult: boolean;
  damages: { uid: string; amount: number; crit: boolean; hpAfter: number; died: boolean }[];
  heals: { uid: string; amount: number; hpAfter: number }[];
  log: string;
}
export interface BattleResult { victory: boolean; steps: BattleStep[]; allies: Fighter[]; enemies: Fighter[]; rounds: number; }

export function makeFighter(heroId: string, level: number, stars: number, side: "ally" | "enemy", idx: number, scale = 1): Fighter {
  const def = heroById(heroId);
  const s = heroStats(def, level, stars);
  return {
    uid: `${side === "ally" ? "A" : "E"}${idx}`, heroId, name: def.name, side, position: def.position,
    level, stars, maxHp: Math.round(s.hp * scale), hp: Math.round(s.hp * scale),
    atk: Math.round(s.atk * scale), def: Math.round(s.def * scale), spd: s.spd, crit: s.crit, energy: 25 + Math.floor(Math.random() * 20),
  };
}

const POS_ORDER: Record<string, number> = { front: 0, mid: 1, back: 2 };

function pickTargets(actor: Fighter, foes: Fighter[], kind: string, count = 1): Fighter[] {
  const alive = foes.filter(f => f.hp > 0).sort((a, b) => POS_ORDER[a.position] - POS_ORDER[b.position] || a.hp - b.hp);
  if (alive.length === 0) return [];
  if (kind === "aoe") return alive.slice(0, 3);
  // asesinos/tiradores a veces van a retaguardia
  const def = heroById(actor.heroId);
  if ((def.role === "Asesino" || def.role === "Tirador") && Math.random() < 0.45) {
    return [[...alive].sort((a, b) => POS_ORDER[b.position] - POS_ORDER[a.position])[0]];
  }
  return alive.slice(0, count);
}

export function simulate(allies: Fighter[], enemies: Fighter[]): BattleResult {
  const steps: BattleStep[] = [];
  const all = [...allies, ...enemies];
  let rounds = 0;
  const turnCount: Record<string, number> = {};

  while (rounds < 14 && allies.some(f => f.hp > 0) && enemies.some(f => f.hp > 0)) {
    rounds++;
    const order = all.filter(f => f.hp > 0).sort((a, b) => b.spd - a.spd);
    for (const actor of order) {
      if (actor.hp <= 0) continue;
      if (!allies.some(f => f.hp > 0) || !enemies.some(f => f.hp > 0)) break;
      const def: HeroDef = heroById(actor.heroId);
      const myTeam = actor.side === "ally" ? allies : enemies;
      const foes = actor.side === "ally" ? enemies : allies;
      turnCount[actor.uid] = (turnCount[actor.uid] || 0) + 1;

      // decidir acción: ult si energía llena, habilidad cada 3 turnos, si no básico
      const hurtAlly = [...myTeam].filter(f => f.hp > 0).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      let skill = { name: "Ataque básico", mult: 1, kind: "damage" as string };
      let isUlt = false;
      if (actor.energy >= 100) { skill = { ...def.ult }; isUlt = true; actor.energy = 0; }
      else if (turnCount[actor.uid] % 3 === 0) {
        const healSkill = def.skills.find(s => s.kind === "heal");
        if (healSkill && hurtAlly && hurtAlly.hp / hurtAlly.maxHp < 0.75) skill = { ...healSkill };
        else skill = { ...def.skills[Math.floor(Math.random() * def.skills.length)] };
      }

      const step: BattleStep = { actor: actor.uid, targets: [], skill: skill.name, kind: skill.kind, ult: isUlt, damages: [], heals: [], log: "" };

      if (skill.kind === "heal") {
        const targets = isUlt ? myTeam.filter(f => f.hp > 0) : hurtAlly ? [hurtAlly] : [actor];
        for (const t of targets) {
          const amount = Math.round(actor.atk * skill.mult * (0.9 + Math.random() * 0.25));
          t.hp = Math.min(t.maxHp, t.hp + amount);
          step.heals.push({ uid: t.uid, amount, hpAfter: t.hp });
          step.targets.push(t.uid);
        }
        step.log = `${actor.name} usa ${skill.name} y restaura ${step.heals.reduce((a, h) => a + h.amount, 0)} PV`;
      } else {
        const targets = pickTargets(actor, foes, skill.kind === "aoe" ? "aoe" : "damage");
        let total = 0;
        for (const t of targets) {
          const crit = Math.random() * 100 < actor.crit;
          const raw = actor.atk * skill.mult * (0.88 + Math.random() * 0.28) * (crit ? 1.65 : 1);
          const dmg = Math.max(18, Math.round(raw - t.def * 0.55));
          t.hp = Math.max(0, t.hp - dmg);
          t.energy = Math.min(100, t.energy + 16);
          total += dmg;
          step.damages.push({ uid: t.uid, amount: dmg, crit, hpAfter: t.hp, died: t.hp <= 0 });
          step.targets.push(t.uid);
        }
        step.log = `${actor.name} → ${skill.name}: ${total} de daño${step.damages.some(d => d.crit) ? " ¡CRÍTICO!" : ""}${step.damages.some(d => d.died) ? " ¡Enemigo caído!" : ""}`;
      }
      actor.energy = Math.min(100, actor.energy + 24);
      steps.push(step);
      if (steps.length > 130) break;
    }
  }
  const victory = enemies.every(f => f.hp <= 0) && allies.some(f => f.hp > 0);
  return { victory, steps, allies, enemies, rounds };
}
