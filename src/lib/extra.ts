export interface Artifact { id: string; name: string; bearer: string; icon: string; element: string; lore: string; color: string; bonus: string; stats: { atk?: number; hp?: number; def?: number; crit?: number; spd?: number } }

// 8 artefactos Æsir / vikingos
export const ARTIFACTS: Artifact[] = [
  { id:"mjolnir", name:"Mjölnir", bearer:"Thor", icon:"Hammer", element:"Trueno", color:"#d97706", lore:"El martillo que jamás falla. Solo los dignos lo alzan.", bonus:"+22% ATQ a tanques del escuadrón", stats:{atk:35, spd:3} },
  { id:"gungnir", name:"Gungnir", bearer:"Odín", icon:"Spear", element:"Sabiduría", color:"#1e40af", lore:"La lanza de Odín que siempre acierta.", bonus:"Tus magos siempre golpean primero", stats:{crit:10, atk:24} },
  { id:"skofnung", name:"Skofnung", bearer:"Ragnar", icon:"Sword", element:"Furia", color:"#7c2d12", lore:"La espada del rey danés Hrolf Kraki, prestada a Ragnar.", bonus:"+35% daño de ejecución bajo 30% PV", stats:{atk:30, crit:8} },
  { id:"shield-lagertha", name:"Escudo Doncella", bearer:"Lagertha", icon:"Shield", element:"Hielo", color:"#0e7490", lore:"Pintado por la propia Lagertha con el dragón de Kattegat.", bonus:"Al inicio: escudo = 18% PV máx", stats:{hp:420, def:20} },
  { id:"fang-fenrir", name:"Colmillo de Fenrir", bearer:"Fenrir", icon:"Skull", element:"Sombra", color:"#1c1917", lore:"Un colmillo arrancado al lobo durante su atadura.", bonus:"15% robo de vida", stats:{atk:28, hp:300} },
  { id:"brisingamen", name:"Brisingamen", bearer:"Freya", icon:"Heart", element:"Amor", color:"#be185d", lore:"El collar de los elfos oscuros que Freya pagó con cuatro noches.", bonus:"Curaciones +28%", stats:{hp:350, def:14} },
  { id:"draupnir", name:"Draupnir", bearer:"Odín", icon:"Coins", element:"Sabiduría", color:"#a16207", lore:"Cada novena noche gotea ocho anillos de oro.", bonus:"+20% oro y gemas en batallas", stats:{def:16, spd:4} },
  { id:"gjallarhorn", name:"Gjallarhorn", bearer:"Heimdall", icon:"Zap", element:"Luz", color:"#854d0e", lore:"Su sonido anuncia el Ragnarök en los nueve mundos.", bonus:"Velocidad de equipo +12", stats:{spd:12, hp:260} },
];

export interface Rune { id: string; name: string; rune: string; color: string; stat: string; desc: string; }
export const RUNES: Rune[] = [
  { id:"fehu", name:"Fehu", rune:"ᚠ", color:"#ca8a04", stat:"PV +220", desc:"Ganado y riqueza. La base de todo." },
  { id:"uruz", name:"Uruz", rune:"ᚢ", color:"#dc2626", stat:"ATQ +18", desc:"El uro salvaje. Fuerza bruta." },
  { id:"thurisaz", name:"Thurisaz", rune:"ᚦ", color:"#1d4ed8", stat:"DEF +14", desc:"El gigante. Barrera impenetrable." },
  { id:"ansuz", name:"Ansuz", rune:"ᚨ", color:"#7c3aed", stat:"CRÍT +6%", desc:"La boca de Odín. Palabra divina." },
  { id:"raidho", name:"Raidho", rune:"ᚱ", color:"#059669", stat:"VEL +7", desc:"El viaje. Siempre un paso por delante." },
  { id:"sowilo", name:"Sowilo", rune:"ᛊ", color:"#eab308", stat:"Cura/Daño +10%", desc:"El sol. Luz que purifica." },
];

export function artifactById(id: string) { return ARTIFACTS.find(a => a.id === id)!; }
export function runeById(id: string) { return RUNES.find(r => r.id === id)!; }

export function artifactBonusPower(level: number) { return level * 320; }
export function runePower(level: number) { return level * 55; }
export function seasonTier(exp: number) { return Math.min(20, Math.floor(exp / 300) + 1); }

// Jörmungandr raid scaling
export function jormungandrStats(scoreOrMax: number) {
  const tier = Math.floor(scoreOrMax / 12000);
  return { hp: 40000 + tier * 18000, atk: 90 + tier * 16, name: tier < 2 ? "Jörmungandr Joven" : tier < 4 ? "Serpiente de Midgard" : tier < 6 ? "Hijo de Loki" : "Devorador de Mundos" };
}
